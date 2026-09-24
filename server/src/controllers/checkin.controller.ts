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

function getPreviousDateString(dateStr: string, daysAgo: number = 1): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  d.setDate(d.getDate() - daysAgo)
  return getLocalDateString(d)
}

/**
 * Calculates user's check-in streak stats from an array of sorted unique date strings (descending)
 */
function calculateStreakStats(datesDesc: string[], todayStr: string) {
  const dateSet = new Set(datesDesc)
  const todayCheckedIn = dateSet.has(todayStr)
  const yesterdayStr = getPreviousDateString(todayStr, 1)
  const yesterdayCheckedIn = dateSet.has(yesterdayStr)

  let currentStreak = 0
  if (todayCheckedIn) {
    currentStreak = 1
    let checkDate = yesterdayStr
    while (dateSet.has(checkDate)) {
      currentStreak++
      checkDate = getPreviousDateString(checkDate, 1)
    }
  } else if (yesterdayCheckedIn) {
    // Grace period: checked in yesterday, can still continue streak if checking in today
    currentStreak = 1
    let checkDate = getPreviousDateString(yesterdayStr, 1)
    while (dateSet.has(checkDate)) {
      currentStreak++
      checkDate = getPreviousDateString(checkDate, 1)
    }
  }

  // Calculate best all-time streak
  let bestStreak = 0
  if (datesDesc.length > 0) {
    // Sort ascending to calculate runs
    const sortedAsc = [...datesDesc].sort()
    let currentRun = 0
    let prevDate: string | null = null

    for (const d of sortedAsc) {
      if (!prevDate) {
        currentRun = 1
      } else {
        const expectedNext = getPreviousDateString(d, -1) // Next calendar day
        // check if d is consecutive to prevDate
        const expected = getLocalDateString(new Date(new Date(prevDate).getTime() + 24 * 60 * 60 * 1000))
        if (d === expected) {
          currentRun++
        } else {
          currentRun = 1
        }
      }
      prevDate = d
      if (currentRun > bestStreak) {
        bestStreak = currentRun
      }
    }
  }

  bestStreak = Math.max(bestStreak, currentStreak)

  return {
    currentStreak,
    bestStreak,
    totalCheckIns: datesDesc.length,
    todayCheckedIn,
  }
}

/**
 * GET /api/checkin/today
 * Returns today's check-in for authenticated user, or for a specified ?date=YYYY-MM-DD
 */
export const getTodayCheckIn = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const queryDate = (req.query.date as string) || getLocalDateString()

  const checkin = await prisma.dailyCheckIn.findUnique({
    where: {
      userId_date: {
        userId,
        date: queryDate,
      },
    },
  })

  res.json({
    success: true,
    date: queryDate,
    checkIn: checkin || null,
  })
})

/**
 * POST /api/checkin
 * Create or update a daily check-in for the authenticated user
 */
export const saveCheckIn = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { date, moodId, moodLabel, coachTip, quote, quoteAuthor, notes } = req.body
  const targetDate = date || getLocalDateString()

  const saved = await prisma.dailyCheckIn.upsert({
    where: {
      userId_date: {
        userId,
        date: targetDate,
      },
    },
    update: {
      moodId,
      moodLabel,
      coachTip,
      quote: quote || null,
      quoteAuthor: quoteAuthor || null,
      notes: notes !== undefined ? notes : undefined,
    },
    create: {
      userId,
      date: targetDate,
      moodId,
      moodLabel,
      coachTip,
      quote: quote || null,
      quoteAuthor: quoteAuthor || null,
      notes: notes || null,
    },
  })

  // Fetch all user checkin dates to return fresh streak calculations
  const allUserCheckIns = await prisma.dailyCheckIn.findMany({
    where: { userId },
    select: { date: true },
    orderBy: { date: 'desc' },
  })

  const dates = allUserCheckIns.map((c) => c.date)
  const streakStats = calculateStreakStats(dates, targetDate)

  res.status(200).json({
    success: true,
    message: 'Daily readiness check-in recorded successfully!',
    checkIn: saved,
    streak: streakStats,
  })
})

/**
 * GET /api/checkin/streak
 * Returns current consecutive streak, best streak, and total check-ins
 */
export const getCheckInStreak = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const todayStr = (req.query.date as string) || getLocalDateString()

  const allUserCheckIns = await prisma.dailyCheckIn.findMany({
    where: { userId },
    select: { date: true, moodId: true, moodLabel: true, coachTip: true },
    orderBy: { date: 'desc' },
  })

  const dates = allUserCheckIns.map((c) => c.date)
  const streakStats = calculateStreakStats(dates, todayStr)

  const todayEntry = allUserCheckIns.find((c) => c.date === todayStr) || null

  res.json({
    success: true,
    ...streakStats,
    todayCheckIn: todayEntry,
  })
})

/**
 * GET /api/checkin/history
 * Returns recent check-in logs for trends and calendar display
 */
export const getCheckInHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const limitParam = req.query.limit ? Number(req.query.limit) : 30
  const limit = Math.min(Math.max(limitParam || 30, 1), 90)

  const history = await prisma.dailyCheckIn.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    take: limit,
  })

  const dates = history.map((c) => c.date)
  const todayStr = (req.query.date as string) || getLocalDateString()
  const streakStats = calculateStreakStats(dates, todayStr)

  res.json({
    success: true,
    history,
    streak: streakStats,
  })
})

/**
 * DELETE /api/checkin/today
 * Remove today's check-in
 */
export const deleteTodayCheckIn = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const targetDate = (req.query.date as string) || getLocalDateString()

  const existing = await prisma.dailyCheckIn.findUnique({
    where: {
      userId_date: {
        userId,
        date: targetDate,
      },
    },
  })

  if (existing) {
    await prisma.dailyCheckIn.delete({
      where: { id: existing.id },
    })
  }

  res.json({
    success: true,
    message: 'Check-in removed.',
  })
})
