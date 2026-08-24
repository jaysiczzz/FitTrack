import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import {
  saveDailyFoodLogInDb,
  getFoodLogHistoryFromDb,
  getDailyFoodLogByDateFromDb,
  deleteDailyFoodLogFromDb,
} from '../services/foodlog.service'

export async function saveDayLogController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized user' })
    }

    const { date, items, waterMl } = req.body
    if (!date) {
      return res.status(400).json({ error: 'Date is required (YYYY-MM-DD)' })
    }

    const savedLog = await saveDailyFoodLogInDb(userId, {
      date,
      items: Array.isArray(items) ? items : [],
      waterMl: Number(waterMl) || 0,
    })

    return res.status(200).json({
      success: true,
      message: 'Daily nutrition log saved to database successfully',
      data: savedLog,
    })
  } catch (err) {
    next(err)
  }
}

export async function getHistoryController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized user' })
    }

    const history = await getFoodLogHistoryFromDb(userId)

    return res.status(200).json({
      success: true,
      history,
    })
  } catch (err) {
    next(err)
  }
}

export async function getDayLogController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized user' })
    }

    const dateParam = Array.isArray(req.params.date) ? req.params.date[0] : req.params.date
    if (!dateParam) {
      return res.status(400).json({ error: 'Date parameter is required' })
    }

    const dayLog = await getDailyFoodLogByDateFromDb(userId, dateParam)

    return res.status(200).json({
      success: true,
      data: dayLog || null,
    })
  } catch (err) {
    next(err)
  }
}

export async function deleteDayLogController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized user' })
    }

    const dateParam = Array.isArray(req.params.date) ? req.params.date[0] : req.params.date
    if (!dateParam) {
      return res.status(400).json({ error: 'Date parameter is required' })
    }

    await deleteDailyFoodLogFromDb(userId, dateParam)

    return res.status(200).json({
      success: true,
      message: `Food log for ${dateParam} removed successfully`,
    })
  } catch (err) {
    next(err)
  }
}
