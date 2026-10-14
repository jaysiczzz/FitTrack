import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { FeatureKey } from '../config/limits';
import { reserveUsage, releaseUsage } from '../utils/usage.utils';

export interface FeatureLimitRequest extends AuthRequest {
  featureReservation?: {
    feature: FeatureKey;
    periodKey: string;
  };
}

export const featureLimitMiddleware = (feature: FeatureKey) => {
  return async (req: FeatureLimitRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
    }

    try {
      const reservation = await reserveUsage(userId, feature);

      if (!reservation.allowed) {
        res.setHeader('Retry-After', reservation.resetsInSeconds.toString());
        return res.status(429).json({
          error: 'LIMIT_REACHED',
          message: `You have reached your ${reservation.period === 'day' ? 'daily' : 'monthly'} limit of ${reservation.limit} for ${reservation.featureName}. Upgrade to FitTrack Pro for higher limits.`,
          feature,
          tier: reservation.tier,
          limit: reservation.limit,
          remaining: 0,
          resetsAt: reservation.resetsAt,
        });
      }

      req.featureReservation = {
        feature,
        periodKey: reservation.periodKey,
      };

      // Automatically release usage if the response fails with an error status (>= 400)
      let released = false;
      const originalSend = res.send;
      res.send = function (body: any) {
        if (res.statusCode >= 400 && !released) {
          released = true;
          releaseUsage(userId, feature, reservation.periodKey).catch(() => {});
        }
        return originalSend.call(this, body);
      };

      res.on('close', () => {
        if (!res.writableEnded && !released) {
          released = true;
          releaseUsage(userId, feature, reservation.periodKey).catch(() => {});
        }
      });

      next();
    } catch (err) {
      next(err);
    }
  };
};
