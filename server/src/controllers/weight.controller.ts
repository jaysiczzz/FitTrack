import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import { prisma } from '../config/db'
import { asyncHandler } from '../utils/asyncHandler.utils'

function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function calculateWeightStats(
  logsAsc: { weight: number; date: string }[],
  userWeight: number,
  targetWeight: number | null,
  goal: string
) {
  if (logsAsc.length === 0) {
    return {
      currentWeight: userWeight,
      startingWeight: userWeight,
      targetWeight,
      totalChange: 0,
      remainingToGoal: targetWeight ? Math.abs(Number((userWeight - targetWeight).toFixed(1))) : null,
      progressPercentage: 0,
      weeklyAverage: userWeight,
      monthlyAverage: userWeight,
      logCount: 0,
      trend: 'stable' as const,
    }
  }

  const startingWeight = logsAsc[0].weight
  const currentWeight = logsAsc[logsAsc.length - 1].weight
  const totalChange = Number((currentWeight - startingWeight).toFixed(1))

  // Calculate progress toward target weight
  let progressPercentage = 0
  let remainingToGoal: number | null = null

  if (targetWeight !== null && targetWeight !== undefined) {
    remainingToGoal = Math.abs(Number((currentWeight - targetWeight).toFixed(1)))
    const totalDistance = Math.abs(targetWeight - startingWeight)

    if (totalDistance > 0) {
      if (goal === 'WEIGHT_LOSS') {
        const lostSoFar = startingWeight - currentWeight
        const neededToLose = startingWeight - targetWeight
        if (neededToLose > 0) {
          progressPercentage = Math.min(100, Math.max(0, Math.round((lostSoFar / neededToLose) * 100)))
        }
      } else {
        // Muscle Gain / Weight Gain
        const gainedSoFar = currentWeight - startingWeight
        const neededToGain = targetWeight - startingWeight
        if (neededToGain > 0) {
          progressPercentage = Math.min(100, Math.max(0, Math.round((gainedSoFar / neededToGain) * 100)))
        }
      }
    }
  }

  // Weekly Average (last 7 days)
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const sevenDaysAgoStr = getLocalDateString(sevenDaysAgo)
  const last7DaysLogs = logsAsc.filter((l) => l.date >= sevenDaysAgoStr)
  const weeklyAverage =
    last7DaysLogs.length > 0
      ? Number((last7DaysLogs.reduce((acc, l) => acc + l.weight, 0) / last7DaysLogs.length).toFixed(1))
      : currentWeight

  // Monthly Average (last 30 days)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgoStr = getLocalDateString(thirtyDaysAgo)
  const last30DaysLogs = logsAsc.filter((l) => l.date >= thirtyDaysAgoStr)
  const monthlyAverage =
    last30DaysLogs.length > 0
      ? Number((last30DaysLogs.reduce((acc, l) => acc + l.weight, 0) / last30DaysLogs.length).toFixed(1))
      : currentWeight

  // Trend detection over last 3 logs
  let trend: 'losing' | 'gaining' | 'stable' = 'stable'
  if (logsAsc.length >= 2) {
    const recent = logsAsc.slice(-3)
    const diff = recent[recent.length - 1].weight - recent[0].weight
    if (diff <= -0.3) trend = 'losing'
    else if (diff >= 0.3) trend = 'gaining'
  }

  return {
    currentWeight,
    startingWeight,
    targetWeight,
    totalChange,
    remainingToGoal,
    progressPercentage,
    weeklyAverage,
    monthlyAverage,
    logCount: logsAsc.length,
    trend,
  }
}

/**
 * GET /api/weight
 * Get all weight logs and computed statistics for the authenticated user
 */
export const getWeightLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { weight: true, targetWeight: true, goal: true, createdAt: true },
  })

  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  const logs = await prisma.weightLog.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
  })

  // Reverse to get chronological ascending for calculations
  const logsAsc = [...logs].reverse()
  const stats = calculateWeightStats(logsAsc, user.weight, user.targetWeight, user.goal)

  res.json({
    success: true,
    logs,
    stats,
  })
})

/**
 * POST /api/weight
 * Log or update a weigh-in for a specific date
 */
export const saveWeightLog = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { weight, date, notes } = req.body
  const targetDate = date || getLocalDateString()
  const parsedWeight = Number(Number(weight).toFixed(1))

  // Upsert weigh-in log for that day
  const savedLog = await prisma.weightLog.upsert({
    where: {
      userId_date: {
        userId,
        date: targetDate,
      },
    },
    update: {
      weight: parsedWeight,
      notes: notes !== undefined ? (notes ? notes.trim() : null) : undefined,
    },
    create: {
      userId,
      date: targetDate,
      weight: parsedWeight,
      notes: notes ? notes.trim() : null,
    },
  })

  // Check if this date is today or the latest log to update User.weight
  const latestLog = await prisma.weightLog.findFirst({
    where: { userId },
    orderBy: { date: 'desc' },
  })

  if (latestLog && latestLog.date === targetDate) {
    await prisma.user.update({
      where: { id: userId },
      data: { weight: parsedWeight },
    })
  }

  // Fetch all logs to recompute stats
  const allLogs = await prisma.weightLog.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
  })

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { weight: true, targetWeight: true, goal: true },
  })

  const logsAsc = [...allLogs].reverse()
  const stats = calculateWeightStats(logsAsc, user?.weight || parsedWeight, user?.targetWeight || null, user?.goal || 'WEIGHT_LOSS')

  res.status(200).json({
    success: true,
    message: 'Weigh-in recorded successfully!',
    log: savedLog,
    logs: allLogs,
    stats,
  })
})

/**
 * DELETE /api/weight/:id
 * Delete a specific weigh-in entry
 */
export const deleteWeightLog = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id

  if (!userId || !id) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const existing = await prisma.weightLog.findUnique({
    where: { id },
  })

  if (!existing || existing.userId !== userId) {
    return res.status(404).json({ error: 'Weight log not found' })
  }

  await prisma.weightLog.delete({
    where: { id },
  })

  // Update User.weight to newest remaining log if available
  const newestRemaining = await prisma.weightLog.findFirst({
    where: { userId },
    orderBy: { date: 'desc' },
  })

  if (newestRemaining) {
    await prisma.user.update({
      where: { id: userId },
      data: { weight: newestRemaining.weight },
    })
  }

  const allLogs = await prisma.weightLog.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
  })

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { weight: true, targetWeight: true, goal: true },
  })

  const logsAsc = [...allLogs].reverse()
  const stats = calculateWeightStats(logsAsc, user?.weight || 70, user?.targetWeight || null, user?.goal || 'WEIGHT_LOSS')

  res.json({
    success: true,
    message: 'Weigh-in deleted successfully.',
    logs: allLogs,
    stats,
  })
})

/**
 * PUT /api/weight/target
 * Update user's target weight goal
 */
export const setTargetWeight = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { targetWeight } = req.body
  const parsedTarget = targetWeight !== null && targetWeight !== undefined ? Number(Number(targetWeight).toFixed(1)) : null

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { targetWeight: parsedTarget },
    select: { id: true, weight: true, targetWeight: true, goal: true },
  })

  const allLogs = await prisma.weightLog.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
  })

  const logsAsc = [...allLogs].reverse()
  const stats = calculateWeightStats(logsAsc, updatedUser.weight, updatedUser.targetWeight, updatedUser.goal)

  res.json({
    success: true,
    message: 'Target weight goal updated!',
    targetWeight: updatedUser.targetWeight,
    stats,
  })
})
