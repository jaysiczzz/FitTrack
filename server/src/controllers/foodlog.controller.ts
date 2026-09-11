import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import {
  saveDailyFoodLogInDb,
  getFoodLogHistoryFromDb,
  getDailyFoodLogByDateFromDb,
  deleteDailyFoodLogFromDb,
  searchFoodCatalogInDb,
  cacheOpenFoodFactsProduct,
  createCustomFoodInDb,
  deleteCustomFoodFromDb,
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

function inferCategoryAndIcon(p: any, fullName: string): { category: string; icon: string } {
  const text = `${fullName} ${p.categories || ''} ${Array.isArray(p.categories_tags) ? p.categories_tags.join(' ') : ''}`.toLowerCase()

  if (text.match(/yogurt|yoghurt|dairy|milk|cheese|kefir|curd|fromage/)) {
    return { category: 'Dairy', icon: text.includes('cheese') ? '🧀' : text.includes('yogurt') ? '🥣' : '🥛' }
  }
  if (text.match(/chicken|poultry|turkey|beef|steak|pork|meat|fish|salmon|tuna|shrimp|seafood|egg|whey|protein|tofu|tempeh/)) {
    return { category: 'Protein', icon: text.includes('egg') ? '🥚' : text.includes('fish') || text.includes('salmon') || text.includes('tuna') ? '🐟' : text.includes('beef') || text.includes('steak') ? '🥩' : text.includes('shake') || text.includes('whey') ? '🥤' : '🍗' }
  }
  if (text.match(/bread|rice|pasta|noodle|oat|cereal|grain|potato|quinoa|tortilla|bagel|flour|corn/)) {
    return { category: 'Carbs', icon: text.includes('rice') ? '🍚' : text.includes('bread') || text.includes('toast') ? '🍞' : text.includes('potato') ? '🍠' : '🥣' }
  }
  if (text.match(/apple|banana|berry|berries|orange|fruit|strawberry|blueberry|mango|grape|avocado/)) {
    if (text.includes('avocado')) return { category: 'Fats', icon: '🥑' }
    return { category: 'Fruits', icon: text.includes('banana') ? '🍌' : text.includes('berry') || text.includes('berries') ? '🫐' : '🍎' }
  }
  if (text.match(/broccoli|spinach|vegetable|salad|greens|carrot|kale|lettuce|cucumber|tomato|pepper/)) {
    return { category: 'Vegetables', icon: text.includes('broccoli') ? '🥦' : text.includes('spinach') || text.includes('greens') ? '🥬' : '🥗' }
  }
  if (text.match(/peanut|almond|nut|oil|olive|butter|seed|walnut|cashew/)) {
    return { category: 'Fats', icon: text.includes('oil') || text.includes('olive') ? '🫒' : '🥜' }
  }
  return { category: 'Staples', icon: '🛒' }
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

    const userId = req.user?.id

    // 1. Search Database First (System verified foods, user custom foods, previously cached products)
    const dbFoods = await searchFoodCatalogInDb(q, userId)
    const formattedDbFoods = dbFoods.map((f) => ({
      id: f.id,
      name: f.name,
      brand: f.brand || undefined,
      barcode: f.barcode || undefined,
      category: f.category || 'Staples',
      servingSize: f.servingSize,
      servingWeightG: f.servingWeightG,
      servingUnit: f.servingUnit,
      calories: f.calories,
      protein: f.protein,
      carbs: f.carbs,
      fat: f.fat,
      fiber: f.fiber || undefined,
      description: f.description || undefined,
      ingredients: f.ingredients || undefined,
      icon: f.icon || '🥗',
      isVerified: f.isVerified,
      isCustom: f.source === 'USER_CUSTOM',
      isOnlineResult: f.source === 'OPEN_FOOD_FACTS',
      imageUri: f.imageUrl || undefined,
      keywords: [q.toLowerCase()],
    }))

    // If we have 8+ confident database matches, return immediately (zero external latency)
    if (formattedDbFoods.length >= 8) {
      return res.status(200).json({ success: true, foods: formattedDbFoods })
    }

    // 2. Query Open Food Facts for missing/branded long-tail items
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

    const onlineFoods: any[] = []
    if (data && Array.isArray(data.products)) {
      const existingNames = new Set(formattedDbFoods.map((f) => f.name.toLowerCase()))

      const rawProducts = data.products
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

      for (const p of rawProducts) {
        const name = (p.product_name || p.product_name_en || '').trim()
        const brand = (p.brands || '').split(',')[0]?.trim() || undefined
        const fullName = brand ? `${name} (${brand})` : name
        if (existingNames.has(fullName.toLowerCase()) || existingNames.has(name.toLowerCase())) {
          continue
        }

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
        const fiberRaw = nutriments.fiber_100g || nutriments.fiber
        const fiber = fiberRaw != null && Number(fiberRaw) > 0 ? Math.round(Number(fiberRaw) * 10) / 10 : undefined

        let servingWeightG = 100
        if (p.serving_size) {
          const match = String(p.serving_size).match(/(\d+(?:\.\d+)?)\s*g/i)
          if (match) servingWeightG = Math.round(Number(match[1]))
        }

        const rawIngredients = (p.ingredients_text || p.ingredients_text_en || '').replace(/\[.*?\]|\(.*?\)/g, ' ').replace(/\s+/g, ' ').trim()
        const ingredients = rawIngredients ? rawIngredients.slice(0, 150) : undefined
        const description = (p.generic_name || p.generic_name_en || (p.categories ? p.categories.split(',')[0].trim() : undefined) || undefined)?.slice(0, 150)
        const { category, icon } = inferCategoryAndIcon(p, fullName)

        const onlineItem = {
          id: `off-${p.code || Math.random().toString(36).substring(2, 9)}`,
          name: fullName,
          brand,
          barcode: p.code ? String(p.code) : undefined,
          category,
          servingSize: p.serving_size || '100g',
          servingWeightG,
          servingUnit: 'g',
          calories: cals,
          protein,
          carbs,
          fat,
          fiber,
          description,
          ingredients,
          icon,
          isOnlineResult: true,
          imageUri: p.image_front_small_url || p.image_small_url || p.image_url || undefined,
          keywords: [q.toLowerCase()],
        }

        onlineFoods.push(onlineItem)

        // Write-through caching in background so subsequent searches hit PostgreSQL
        cacheOpenFoodFactsProduct({
          name: fullName,
          brand,
          barcode: p.code ? String(p.code) : undefined,
          category,
          servingSize: p.serving_size || '100g',
          servingWeightG,
          servingUnit: 'g',
          calories: cals,
          protein,
          carbs,
          fat,
          fiber,
          description,
          ingredients,
          icon,
          imageUrl: onlineItem.imageUri,
        }).catch(() => {})
      }
    }

    const merged = [...formattedDbFoods, ...onlineFoods]
    return res.status(200).json({ success: true, foods: merged })
  } catch (err) {
    next(err)
  }
}

export async function createCustomFoodController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized user' })
    }

    const { name, brand, category, servingSize, servingWeightG, servingUnit, calories, protein, carbs, fat, fiber, description, ingredients, icon } = req.body
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Food name is required' })
    }

    const food = await createCustomFoodInDb(userId, {
      name,
      brand,
      category,
      servingSize,
      servingWeightG,
      servingUnit,
      calories,
      protein,
      carbs,
      fat,
      fiber: fiber != null ? Number(fiber) : undefined,
      description,
      ingredients,
      icon,
    })

    return res.status(201).json({ success: true, food })
  } catch (err) {
    next(err)
  }
}

export async function deleteCustomFoodController(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized user' })
    }

    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    if (!id) {
      return res.status(400).json({ error: 'Food ID is required' })
    }

    const deleted = await deleteCustomFoodFromDb(userId, id)
    if (!deleted) {
      return res.status(404).json({ error: 'Custom food not found or unauthorized' })
    }

    return res.status(200).json({ success: true, message: 'Custom food removed' })
  } catch (err) {
    next(err)
  }
}
