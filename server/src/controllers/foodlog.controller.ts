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

export async function searchFoodsOnlineController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''
    if (!q || q.length < 2) {
      return res.status(200).json({ success: true, foods: [] })
    }

    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
      q
    )}&search_simple=1&action=process&json=1&page_size=20`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 4500)

    let data: any = null
    try {
      const resp = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'FitTrack-Fitness-App - Version 1.0 - www.fittrack.com',
        },
      })
      if (resp.ok) {
        data = await resp.json()
      }
    } catch (fetchErr) {
      console.log('[Open Food Facts] Offline or request timed out:', fetchErr)
    } finally {
      clearTimeout(timeout)
    }

    if (!data || !Array.isArray(data.products)) {
      return res.status(200).json({ success: true, foods: [] })
    }

    const foods = data.products
      .filter((p: any) => {
        const name = p.product_name || p.product_name_en
        const nutriments = p.nutriments || {}
        const cals =
          nutriments['energy-kcal_100g'] ||
          nutriments['energy-kcal'] ||
          (nutriments['energy_100g'] ? nutriments['energy_100g'] / 4.184 : 0)
        return Boolean(name && name.trim().length > 1 && cals && Number(cals) > 0)
      })
      .slice(0, 15)
      .map((p: any) => {
        const name = (p.product_name || p.product_name_en || '').trim()
        const brand = (p.brands || '').split(',')[0]?.trim() || undefined
        const nutriments = p.nutriments || {}
        const cals = Math.round(
          Number(
            nutriments['energy-kcal_100g'] ||
              nutriments['energy-kcal'] ||
              (nutriments['energy_100g'] ? nutriments['energy_100g'] / 4.184 : 0)
          )
        )
        const protein = Math.round(Number(nutriments.proteins_100g || nutriments.proteins || 0) * 10) / 10
        const carbs = Math.round(Number(nutriments.carbohydrates_100g || nutriments.carbohydrates || 0) * 10) / 10
        const fat = Math.round(Number(nutriments.fat_100g || nutriments.fat || 0) * 10) / 10

        let servingWeightG = 100
        if (p.serving_size) {
          const match = String(p.serving_size).match(/(\d+(?:\.\d+)?)\s*g/i)
          if (match) servingWeightG = Math.round(Number(match[1]))
        }

        return {
          id: `off-${p.code || Math.random().toString(36).substring(2, 9)}`,
          name: brand ? `${name} (${brand})` : name,
          brand,
          category: 'Staples',
          servingSize: p.serving_size || '100g',
          servingWeightG,
          servingUnit: 'g',
          calories: cals,
          protein,
          carbs,
          fat,
          icon: '🛒',
          isOnlineResult: true,
          imageUri: p.image_front_small_url || p.image_small_url || p.image_url || undefined,
          keywords: [q.toLowerCase()],
        }
      })

    return res.status(200).json({ success: true, foods })
  } catch (err) {
    next(err)
  }
}
