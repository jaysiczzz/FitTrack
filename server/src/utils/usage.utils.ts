import { prisma } from '../config/db';
import { SubscriptionTier, SubscriptionStatus } from '@prisma/client';
import { FEATURE_LIMITS, FeatureKey, TierKey } from '../config/limits';

// In-memory fallback if database migration hasn't been applied yet
const memoryUsageStore = new Map<string, number>();

// Concurrency lock per user and feature to serialize boundary requests
const lockMap = new Map<string, Promise<any>>();

export function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = lockMap.get(key) || Promise.resolve();
  const next = prev.catch(() => {}).then(() => fn());
  lockMap.set(
    key,
    next.finally(() => {
      if (lockMap.get(key) === next) {
        lockMap.delete(key);
      }
    })
  );
  return next;
}

export async function getUserTier(userId: string): Promise<SubscriptionTier> {
  try {
    const sub = await prisma.subscription.findUnique({
      where: { userId },
      select: {
        tier: true,
        status: true,
        currentPeriodEnd: true,
      },
    });

    if (!sub || sub.status !== SubscriptionStatus.ACTIVE) {
      return SubscriptionTier.FREE;
    }

    // Check expiration if not lifetime founder
    if (
      sub.tier !== SubscriptionTier.LIFETIME_FOUNDER &&
      sub.currentPeriodEnd &&
      sub.currentPeriodEnd < new Date()
    ) {
      return SubscriptionTier.FREE;
    }

    return sub.tier;
  } catch {
    return SubscriptionTier.FREE;
  }
}

export function getPeriodKey(period: 'day' | 'month', date: Date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  if (period === 'month') {
    return `${y}-${m}`;
  }
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getResetsAt(period: 'day' | 'month', date: Date = new Date()): Date {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  if (period === 'month') {
    // 1st of next month 00:00:00 UTC
    return new Date(Date.UTC(y, m + 1, 1, 0, 0, 0, 0));
  }
  const d = date.getUTCDate();
  // Midnight UTC of next day
  return new Date(Date.UTC(y, m, d + 1, 0, 0, 0, 0));
}

export async function getUsage(
  userId: string,
  feature: FeatureKey
): Promise<{
  used: number;
  limit: number;
  remaining: number;
  resetsAt: string;
  resetsInSeconds: number;
  tier: TierKey;
  featureName: string;
  unit: string;
  period: 'day' | 'month';
  periodKey: string;
}> {
  const tier = await getUserTier(userId);
  const tierKey: TierKey = tier === SubscriptionTier.FREE ? 'FREE' : 'PRO';
  const config = FEATURE_LIMITS[tierKey][feature];
  const periodKey = getPeriodKey(config.period);
  const resetsAt = getResetsAt(config.period);
  const resetsInSeconds = Math.max(1, Math.ceil((resetsAt.getTime() - Date.now()) / 1000));

  let used = 0;
  try {
    const record = await (prisma as any).featureUsage.findUnique({
      where: {
        userId_feature_periodKey: {
          userId,
          feature,
          periodKey,
        },
      },
    });
    if (record) {
      used = record.count;
    } else {
      // Check legacy tables if featureUsage has 0 records
      used = await fallbackGetUsedCount(userId, feature, config.period);
    }
  } catch {
    // Graceful fallback if table does not exist in DB yet
    used = await fallbackGetUsedCount(userId, feature, config.period);
  }

  const remaining = Math.max(0, config.max - used);

  return {
    used,
    limit: config.max,
    remaining,
    resetsAt: resetsAt.toISOString(),
    resetsInSeconds,
    tier: tierKey,
    featureName: config.name,
    unit: config.unit,
    period: config.period,
    periodKey,
  };
}

export async function reserveUsage(
  userId: string,
  feature: FeatureKey
): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  resetsAt: string;
  resetsInSeconds: number;
  tier: TierKey;
  featureName: string;
  period: 'day' | 'month';
  periodKey: string;
}> {
  return withLock(`${userId}:${feature}`, async () => {
    const tier = await getUserTier(userId);
    const tierKey: TierKey = tier === SubscriptionTier.FREE ? 'FREE' : 'PRO';
    const config = FEATURE_LIMITS[tierKey][feature];
    const periodKey = getPeriodKey(config.period);
    const resetsAt = getResetsAt(config.period);
    const resetsInSeconds = Math.max(1, Math.ceil((resetsAt.getTime() - Date.now()) / 1000));

    let count = 0;
    try {
      const updated = await (prisma as any).featureUsage.upsert({
        where: {
          userId_feature_periodKey: {
            userId,
            feature,
            periodKey,
          },
        },
        update: {
          count: { increment: 1 },
        },
        create: {
          userId,
          feature,
          periodKey,
          count: 1,
        },
      });
      count = updated.count;
    } catch {
      // If DB table not yet created, use in-memory store with fallback
      const memKey = `${userId}:${feature}:${periodKey}`;
      const baseCount = Math.max(
        memoryUsageStore.get(memKey) || 0,
        await fallbackGetUsedCount(userId, feature, config.period)
      );
      count = baseCount + 1;
      memoryUsageStore.set(memKey, count);
    }

    if (count > config.max) {
      // Exceeded limit: revert the increment without re-locking
      await executeReleaseUsage(userId, feature, periodKey);
      return {
        allowed: false,
        used: config.max,
        limit: config.max,
        remaining: 0,
        resetsAt: resetsAt.toISOString(),
        resetsInSeconds,
        tier: tierKey,
        featureName: config.name,
        period: config.period,
        periodKey,
      };
    }

    return {
      allowed: true,
      used: count,
      limit: config.max,
      remaining: Math.max(0, config.max - count),
      resetsAt: resetsAt.toISOString(),
      resetsInSeconds,
      tier: tierKey,
      featureName: config.name,
      period: config.period,
      periodKey,
    };
  });
}

async function executeReleaseUsage(
  userId: string,
  feature: FeatureKey,
  periodKey?: string
): Promise<void> {
  const period = FEATURE_LIMITS.FREE[feature]?.period || 'day';
  const key = periodKey || getPeriodKey(period);
  try {
    const result = await (prisma as any).featureUsage.updateMany({
      where: {
        userId,
        feature,
        periodKey: key,
        count: { gt: 0 },
      },
      data: {
        count: { decrement: 1 },
      },
    });
    if (result.count === 0) {
      const memKey = `${userId}:${feature}:${key}`;
      const cur = memoryUsageStore.get(memKey) || 0;
      if (cur > 0) {
        memoryUsageStore.set(memKey, cur - 1);
      }
    }
  } catch {
    const memKey = `${userId}:${feature}:${key}`;
    const cur = memoryUsageStore.get(memKey) || 0;
    if (cur > 0) {
      memoryUsageStore.set(memKey, cur - 1);
    }
  }
}

export async function releaseUsage(
  userId: string,
  feature: FeatureKey,
  periodKey?: string
): Promise<void> {
  return withLock(`${userId}:${feature}`, () =>
    executeReleaseUsage(userId, feature, periodKey)
  );
}

export async function incrementUsage(
  userId: string,
  feature: FeatureKey,
  amount: number = 1
): Promise<{
  used: number;
  limit: number;
  remaining: number;
  resetsAt: string;
}> {
  return withLock(`${userId}:${feature}`, async () => {
    const tier = await getUserTier(userId);
    const tierKey: TierKey = tier === SubscriptionTier.FREE ? 'FREE' : 'PRO';
    const config = FEATURE_LIMITS[tierKey][feature];
    const periodKey = getPeriodKey(config.period);
    const resetsAt = getResetsAt(config.period);

    let used = 0;
    try {
      const updated = await (prisma as any).featureUsage.upsert({
        where: {
          userId_feature_periodKey: {
            userId,
            feature,
            periodKey,
          },
        },
        update: {
          count: { increment: amount },
        },
        create: {
          userId,
          feature,
          periodKey,
          count: amount,
        },
      });
      used = updated.count;
    } catch {
      const memKey = `${userId}:${feature}:${periodKey}`;
      used = (memoryUsageStore.get(memKey) || 0) + amount;
      memoryUsageStore.set(memKey, used);
    }

    return {
      used,
      limit: config.max,
      remaining: Math.max(0, config.max - used),
      resetsAt: resetsAt.toISOString(),
    };
  });
}

async function fallbackGetUsedCount(
  userId: string,
  feature: FeatureKey,
  period: 'day' | 'month'
): Promise<number> {
  const periodKey = getPeriodKey(period);
  const memCount = memoryUsageStore.get(`${userId}:${feature}:${periodKey}`) || 0;
  const now = new Date();
  let dbCount = 0;
  try {
    if (feature === 'COACH') {
      const startOfDayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
      dbCount = await prisma.aiChatMessage.count({
        where: {
          userId,
          role: 'user',
          createdAt: { gte: startOfDayUTC },
        },
      });
    } else if (feature === 'WORKOUT_GENERATOR') {
      const startOfMonthUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
      dbCount = await prisma.aiRoutineLog.count({
        where: {
          userId,
          createdAt: { gte: startOfMonthUTC },
        },
      });
    }
  } catch {
    // Ignore db count errors
  }
  return Math.max(memCount, dbCount);
}
