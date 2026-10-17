import 'dotenv/config'
import { GoogleGenAI, Type } from '@google/genai'

function getApiKeys(): string[] {
  const keys: string[] = []
  if (process.env.GEMINI_API_KEY) {
    keys.push(...process.env.GEMINI_API_KEY.split(',').map((k) => k.trim()).filter(Boolean))
  }
  if (process.env.GEMINI_BACKUP_API_KEY) {
    keys.push(...process.env.GEMINI_BACKUP_API_KEY.split(',').map((k) => k.trim()).filter(Boolean))
  }
  return Array.from(new Set(keys))
}

function getAI(customKey?: string) {
  const apiKey = customKey || getApiKeys()[0]
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server. Please set GEMINI_API_KEY in your environment variables.')
  }
  return new GoogleGenAI({ apiKey })
}

const CANDIDATE_MODELS = [
  'gemini-3.7-flash',
  'gemini-3.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.5-flash',
  'gemini-3.6-flash',
]

async function generateWithFallback(
  contents: any,
  config: any
) {
  const apiKeys = getApiKeys()
  if (apiKeys.length === 0) {
    throw new Error('GEMINI_API_KEY is not configured on the server. Please set GEMINI_API_KEY in your environment variables.')
  }

  const primaryModel = process.env.GEMINI_MODEL || CANDIDATE_MODELS[0]
  const modelsToTry = [primaryModel, ...CANDIDATE_MODELS.filter((m) => m !== primaryModel)]

  let lastError: any = null

  for (const apiKey of apiKeys) {
    const ai = new GoogleGenAI({ apiKey })

    for (const model of modelsToTry) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents,
            config,
          })
          if (response && response.text) {
            return response.text
          }
        } catch (err: any) {
          lastError = err
          const is503 = err?.status === 503 || (err?.message && (err.message.includes('503') || err.message.includes('high demand')))
          const is429 = err?.status === 429 || (err?.message && (err.message.includes('429') || err.message.includes('quota') || err.message.includes('RESOURCE_EXHAUSTED')))
          console.warn(`[AI Service] Model ${model} (attempt ${attempt}) failed: ${err.message || err}`)
          if (is429) {
            // Immediately skip retrying this exhausted model and move to the next candidate model
            break
          }
          if (is503 && attempt === 1) {
            await new Promise((resolve) => setTimeout(resolve, 1500))
          } else {
            break
          }
        }
      }
      // Brief pause before trying next fallback model
      await new Promise((resolve) => setTimeout(resolve, 300))
    }
  }

  if (lastError?.message && (lastError.message.includes('503') || lastError.message.includes('high demand'))) {
    throw new Error('The AI service is temporarily experiencing high demand from Google. Please try again in a few moments.')
  }

  throw lastError || new Error('All AI models failed to generate content.')
}

export interface DetectedFoodItem {
  name: string
  servingSize: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  sugar?: number
  sodiumMg?: number
  saturatedFat?: number
}

export interface MealAnalysisResult {
  isFood?: boolean
  rejectionReason?: string
  foodName: string
  servingSize: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  sugar?: number
  sodiumMg?: number
  saturatedFat?: number
  confidenceScore?: number // 0.0 to 1.0 (e.g. 0.94 for 94%)
  dietaryFlags?: string[] // e.g. ["High Protein", "Low Carb", "Dairy-Free"]
  healthNotes?: string
}

export async function analyzeMealWithAI(params: {
  description?: string
  imageBase64?: string
  mimeType?: string
}): Promise<MealAnalysisResult> {
  const promptText = `Analyze this image and/or text description and provide accurate nutritional estimation.
  User Description / Context: ${params.description || 'Not provided'}
  
  MANDATORY FOOD VERIFICATION STEP (CRITICAL):
  1. Determine whether the subject is genuine EDIBLE FOOD, a MEAL, BEVERAGE, CULINARY INGREDIENT, or a NUTRITION FACTS LABEL / FOOD PACKAGING.
  2. If the image/text is NOT food or beverage (for example: animals/pets, people/selfies, vehicles/cars, electronics, furniture, clothing, room interiors, random objects, paperwork/documents without nutrition facts, outdoor scenery, etc.):
     - Set "isFood" to false.
     - Set "rejectionReason" to a clear, direct, and polite error message explaining what the image depicts and stating that it is not food (e.g. "The image appears to show [object/scene] rather than food. Please snap or upload a photo of your meal, beverage, or nutrition facts label.").
     - Set foodName to "Not Food", servingSize to "N/A", calories to 0, protein to 0, carbs to 0, fat to 0.
  3. If the input IS food, a drink, or a nutrition facts label:
     - Set "isFood" to true.
     - Set "rejectionReason" to "".
  
  SINGLE UNIFIED DISH / MEAL MERGING RULE (MANDATORY):
  - Always analyze and return the food as ONE SINGLE UNIFIED DISH / MEAL with ALL nutrients merged together into one set of combined totals.
  - NEVER divide or dissect a single dish, stew, curry, soup, pasta, salad, casserole, sandwich, or composite meal into individual ingredient parts (e.g., NEVER divide "Chicken Adobo" into chicken pieces, potatoes, and adobo sauce; NEVER divide a burger into patty, bun, and cheese; NEVER divide a salad into lettuce, dressing, and toppings).
  - The "foodName" must be the full name of the complete dish or meal (e.g., "Chicken Adobo", "Beef Stew with Rice", "Spaghetti Bolognese", "Caesar Salad with Grilled Chicken").
  - The "calories", "protein", "carbs", "fat", "fiber", "sugar", "sodiumMg", and "saturatedFat" must represent the complete, combined total nutrition of the entire dish/meal as photographed.
  - The "servingSize" must represent the overall portion (e.g., "1 plate (approx. 350g)", "1 bowl", "1 medium fillet with 1 cup sides").
  - If the image contains a Nutrition Facts label or packaged food, extract the exact stated serving size and nutrients. Set confidenceScore to 0.98.
  - In "healthNotes", provide a concise 1-sentence health insight or coach tip about the dish's nutritional profile and its key culinary ingredients.
  - Include relevant "dietaryFlags" (e.g., "High Protein", "Low Carb", "Keto-Friendly", "High Fiber", "Whole Foods", "Gluten-Free").
  
  Return a structured JSON.`

  const contents: any[] = []

  if (params.imageBase64 && params.mimeType) {
    let cleanBase64 = params.imageBase64
    if (cleanBase64.includes(',')) {
      cleanBase64 = cleanBase64.split(',')[1]
    }
    contents.push({
      inlineData: {
        data: cleanBase64,
        mimeType: params.mimeType,
      },
    })
  }

  contents.push(promptText)

  const text = await generateWithFallback(contents, {
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        isFood: {
          type: Type.BOOLEAN,
          description: 'True if the image/text contains edible food, meal, beverage, or nutrition facts label. False if not food.',
        },
        rejectionReason: {
          type: Type.STRING,
          description: 'Explanation if the image is not food, or empty string if it is food.',
        },
        foodName: { type: Type.STRING },
        servingSize: { type: Type.STRING },
        calories: { type: Type.NUMBER },
        protein: { type: Type.NUMBER },
        carbs: { type: Type.NUMBER },
        fat: { type: Type.NUMBER },
        fiber: { type: Type.NUMBER },
        sugar: { type: Type.NUMBER },
        sodiumMg: { type: Type.NUMBER },
        saturatedFat: { type: Type.NUMBER },
        confidenceScore: { type: Type.NUMBER },
        dietaryFlags: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        healthNotes: { type: Type.STRING },
      },
      required: ['isFood', 'foodName', 'servingSize', 'calories', 'protein', 'carbs', 'fat'],
    },
  })

  return JSON.parse(text) as MealAnalysisResult
}

export interface AIInsight {
  title: string
  lines: string[]
}

export async function generateAIInsights(userProfile: {
  firstName: string
  weight: number
  height: number
  age: number
  goal: string
  gender?: string
  workoutCount?: number
  caloriesLoggedToday?: number
  loggedMeals?: Array<{
    title: string
    mealType?: string
    calories: number
    protein: number
    carbs: number
    fat: number
  }>
  targets?: {
    calories: number
    protein: number
    carbs: number
    fat: number
    waterMl?: number
  }
  loggedMacros?: {
    calories: number
    protein: number
    carbs: number
    fat: number
    waterMl?: number
  }
}): Promise<AIInsight[]> {
  const isNutritionFocused = Boolean(
    (userProfile.loggedMeals && userProfile.loggedMeals.length > 0) ||
    userProfile.targets ||
    userProfile.loggedMacros
  )

  let prompt: string

  if (isNutritionFocused) {
    let contextDetails = `- Athlete: ${userProfile.firstName}, ${userProfile.weight}kg, ${userProfile.height}cm, Sex: ${userProfile.gender || 'Not specified'}.
- Goal: ${userProfile.goal}`

    if (userProfile.targets) {
      contextDetails += `\n- Daily Targets: ${userProfile.targets.calories} kcal | ${userProfile.targets.protein}g Protein | ${userProfile.targets.carbs}g Carbs | ${userProfile.targets.fat}g Fat${userProfile.targets.waterMl ? ` | ${userProfile.targets.waterMl}ml Water` : ''}`
    }

    if (userProfile.loggedMacros) {
      contextDetails += `\n- Logged So Far: ${userProfile.loggedMacros.calories} kcal | ${userProfile.loggedMacros.protein}g Protein | ${userProfile.loggedMacros.carbs}g Carbs | ${userProfile.loggedMacros.fat}g Fat${userProfile.loggedMacros.waterMl !== undefined ? ` | ${userProfile.loggedMacros.waterMl}ml Water` : ''}`
    }

    if (Array.isArray(userProfile.loggedMeals) && userProfile.loggedMeals.length > 0) {
      const mealList = userProfile.loggedMeals
        .map((m) => `  * [${m.mealType || 'Meal'}] ${m.title}: ${m.calories} kcal, ${m.protein}g P, ${m.carbs}g C, ${m.fat}g F`)
        .join('\n')
      contextDetails += `\n- Today's Logged Meals:\n${mealList}`
    } else {
      contextDetails += `\n- Today's Logged Meals: None logged yet today.`
    }

    prompt = `You are FitTrack's expert sports nutrition and hydration coach.
Analyze the user's logged nutrition for today and generate 2 concise, highly personalized coaching insights.

User Context:
${contextDetails}

Rules for insights:
1. Insight 1 (Macronutrient & Energy Pacing): Analyze their meal choices, protein pacing, and give actionable guidance for remaining meals based on their target budget.
2. Insight 2 (Hydration, Recovery, or Micronutrients): Actionable advice considering water logged, electrolytes, or meal timing.
3. Be practical, friendly, and direct. Do NOT just repeat raw numbers; explain what the athlete should actually eat or do next.

Return a JSON array of 2 insight objects with:
- title: Short catchphrase (e.g., "Protein Distribution", "Hydration Timing", "Carbohydrate Satiety")
- lines: Array of exactly 2 concise, actionable bullet point strings.`
  } else {
    prompt = `You are FitTrack's AI fitness and nutrition coach.
Generate 3 dynamic, personalized health insights/predictions for user ${userProfile.firstName}:
- User Stats: ${userProfile.weight}kg, ${userProfile.height}cm, ${userProfile.age} years old, biological sex: ${userProfile.gender || 'Not specified'}.
- Fitness Goal: ${userProfile.goal} (e.g., MUSCLE_GAIN or WEIGHT_LOSS).
- Completed Workouts This Week: ${userProfile.workoutCount || 0}.

Return a JSON array of 3 insights, each having:
- title: Short catchphrase (e.g., "Trend prediction", "Meal timing", "Recovery", "Hydration strategy")
- lines: Array of 2 concise, actionable bullet point strings giving realistic calculations or tips for their specific goal.`
  }

  const text = await generateWithFallback(prompt, {
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          lines: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ['title', 'lines'],
      },
    },
  })

  return JSON.parse(text) as AIInsight[]
}

export interface AIWorkoutPlan {
  title: string
  estimatedDurationMinutes: number
  targetMuscleGroup: string
  exercises: {
    name: string
    category: string
    sets: number
    reps: number
    suggestedWeightKg?: number
  }[]
}

export async function generateAIWorkout(userProfile: {
  weight: number
  height: number
  goal: string
  gender?: string
  targetArea?: string
  activityLevel?: string
  personalRecords?: Array<{ exerciseName: string; weight: number; reps: number; record?: string }>
  workoutsCompletedThisWeek?: number
  lastWorkoutTitle?: string
  lastWorkoutExercises?: string[]
}): Promise<AIWorkoutPlan> {
  const prText = userProfile.personalRecords && userProfile.personalRecords.length > 0
    ? userProfile.personalRecords
        .slice(0, 12)
        .map((p) => `${p.exerciseName}: ${p.weight > 0 ? `${p.weight}kg` : 'Bodyweight'} × ${p.reps} reps`)
        .join(', ')
    : 'None logged yet (beginner baseline calibration)'

  const recentHistoryText = userProfile.lastWorkoutTitle
    ? `Completed ${userProfile.workoutsCompletedThisWeek || 0} workout sessions in the last 7 days. Most recent workout was "${userProfile.lastWorkoutTitle}"${userProfile.lastWorkoutExercises && userProfile.lastWorkoutExercises.length > 0 ? ` (${userProfile.lastWorkoutExercises.slice(0, 4).join(', ')})` : ''}.`
    : `Completed ${userProfile.workoutsCompletedThisWeek || 0} workout sessions in the last 7 days.`

  const prompt = `Design a customized workout routine for a user with:
- Fitness Goal: ${userProfile.goal}
- Target focus: ${userProfile.targetArea || 'Full Body'}
- Daily Activity Level: ${userProfile.activityLevel || 'LIGHTLY_ACTIVE'}
- Weight: ${userProfile.weight}kg, Height: ${userProfile.height}cm, Sex: ${userProfile.gender || 'Not specified'}.
- Recent Training Frequency & History: ${recentHistoryText}
- User's Verified Personal Records (Past Best Lifts): ${prText}

Exercise Programming & Weight Prescription Guidelines:
1. Progressive Overload Calibration:
   - If the user has logged Personal Records for an exercise (or similar movement pattern, e.g. Bench Press PR for any chest press), calibrate suggestedWeightKg directly based on their past best performance:
     * Working weight for Hypertrophy/Strength (6-12 reps): Prescribe approximately 70% to 85% of their logged PR weight for working sets.
     * If no PR is recorded for an exercise, prescribe a safe, evidence-based starting weight calibrated to their body weight (${userProfile.weight}kg) and activity level.
2. Activity Level Tuning:
   - If SEDENTARY: Prioritize core/posture stability, mobility warm-ups, lighter starting weights, and 12-15 controlled reps to prevent excessive soreness.
   - If LIGHTLY_ACTIVE / MODERATELY_ACTIVE: Prescribe balanced progressive overload with 8-12 reps per set and classic compound lifts.
   - If VERY_ACTIVE: Prescribe high-intensity progression, challenging compound lifts, 6-10 rep strength/hypertrophy sets, and optional supersets.
3. Fatigue & Recovery:
   - Avoid over-fatiguing muscles that were heavily taxed in their most recent workout session.

Return a JSON object containing:
- title: Name of the workout session
- estimatedDurationMinutes: Estimated duration in minutes
- targetMuscleGroup: Main muscle group targeted
- exercises: Array of 4-5 exercises with name, category, sets, reps, and optional suggestedWeightKg (realistic working weight in kg).`

  const text = await generateWithFallback(prompt, {
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        estimatedDurationMinutes: { type: Type.NUMBER },
        targetMuscleGroup: { type: Type.STRING },
        exercises: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              category: { type: Type.STRING },
              sets: { type: Type.NUMBER },
              reps: { type: Type.NUMBER },
              suggestedWeightKg: { type: Type.NUMBER },
            },
            required: ['name', 'category', 'sets', 'reps'],
          },
        },
      },
      required: ['title', 'estimatedDurationMinutes', 'targetMuscleGroup', 'exercises'],
    },
  })

  return JSON.parse(text) as AIWorkoutPlan
}

export interface MealSuggestion {
  title: string
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  calories: number
  protein: number
  carbs: number
  fat: number
  prepTime: string
  ingredients: string[]
  reason: string
  icon: string
}

export async function generateAIMealSuggestions(params: {
  goal: string
  remainingCalories: number
  remainingProtein: number
  mealType?: string
}): Promise<MealSuggestion[]> {
  const isBudgetExhausted = params.remainingCalories <= 50
  const targetMeal = params.mealType && params.mealType !== 'all' ? params.mealType.toLowerCase() : null

  const mealScopeInstruction = targetMeal
    ? `SPECIFIC MEAL TIMING REQUIREMENT:
The user specifically requested meal options for: **${targetMeal.toUpperCase()}**!
- ALL 3 suggested options MUST be suitable and appropriate for **${targetMeal.toUpperCase()}** (set "category": "${targetMeal}").
${
  targetMeal === 'breakfast'
    ? '- Focus on morning energizing foods (e.g. eggs, protein oats, healthy toasts, high-protein breakfast bowls, smoothies).'
    : targetMeal === 'lunch'
    ? '- Focus on midday power meals (e.g. high-protein bowls, healthy wraps, salads with chicken/tuna/tofu, balanced stir-fries).'
    : targetMeal === 'dinner'
    ? '- Focus on nourishing evening recovery suppers (e.g. salmon/steak/poultry with roasted veggies, quinoa, light soups).'
    : '- Focus on fast, satisfying, high-protein snacks (e.g. Greek yogurt, protein shake, edamame, cottage cheese, rice cakes with peanut butter).'
}`
    : `WHOLE DAY / ALL-DAY SPREAD:
Provide a versatile variety of meals across different times of day (e.g. main meals and high-protein snacks). Set category to "breakfast", "lunch", "dinner", or "snack".`

  const budgetConstraint = isBudgetExhausted
    ? `SPECIAL INSTRUCTION - BUDGET ALREADY REACHED/EXCEEDED:
The user has ALREADY reached or exceeded their daily calorie target for today (${params.remainingCalories} kcal left).
Do NOT suggest high-calorie or heavy meals!
Instead, recommend 3 ultra-light, zero-calorie or very low-calorie (under 45 kcal each) digestive, hydration, and recovery options:
- e.g. "Soothing Peppermint & Chamomile Herbal Tea" (0 kcal, 0g P)
- e.g. "Cucumber, Lemon & Mint Infused Ice Water" (10 kcal, 0g P)
- e.g. "Crunchy Celery Sticks with Himalayan Pink Salt" (15 kcal, 1g P)
- e.g. "Electrolyte Lemon Water with Chia Seeds" (35 kcal, 1.5g P)
Explain in the "reason" that this satisfies oral fixation and supports recovery/digestion without adding excess calories.`
    : `STRICT BUDGET CONSTRAINT - DO NOT EXCEED REMAINING CALORIES:
The user has ${params.remainingCalories} kcal remaining today.
- CRITICAL: EACH SUGGESTED MEAL MUST NOT EXCEED ${params.remainingCalories} kcal (calories <= ${params.remainingCalories}).
- Suggestions MUST NOT blow past the user's remaining calorie budget under any circumstances!
${params.remainingCalories < 350
  ? `- Since the remaining budget is tight (${params.remainingCalories} kcal), suggest high-protein, satiating mini-meals or smart light snacks (e.g. Greek yogurt with cinnamon, whey protein shake, hard-boiled eggs with baby carrots, low-fat cottage cheese) that strictly stay under ${params.remainingCalories} kcal.`
  : params.remainingCalories < 650
  ? `- The user has moderate room (${params.remainingCalories} kcal). Suggest satisfying single meals or bowls that maximize protein (${params.remainingProtein}g target) while staying safely under ${params.remainingCalories} kcal.`
  : `- The user has ample budget (${params.remainingCalories} kcal). Suggest wholesome, nutrient-dense meals that leave comfortable room for their day and help reach ${params.remainingProtein}g protein.`
}`

  const prompt = `You are FitTrack's AI Nutrition Coach.
Recommend 3 distinct, delicious, practical meals or snacks for a user with:
- Fitness Goal: ${params.goal} (e.g. MUSCLE_GAIN or WEIGHT_LOSS)
- Remaining Calories Today: ${params.remainingCalories} kcal
- Remaining Protein Target: ${params.remainingProtein}g
${targetMeal ? `- Target Meal Category: ${targetMeal.toUpperCase()}` : '- Meal Timing: Whole Day'}

${mealScopeInstruction}

${budgetConstraint}

CRITICAL REQUIREMENTS FOR INGREDIENTS & PORTIONS:
1. Every item in the "ingredients" array MUST specify its EXACT measurable portion/quantity and unit (e.g., grams, cups, tablespoons, pieces, slices).
   - EXCELLENT examples:
     * "150g skinless chicken breast"
     * "1 cup (150g) cooked brown rice"
     * "100g steamed broccoli florets"
     * "1 tbsp (14g) extra virgin olive oil"
     * "2 large whole eggs"
     * "1 medium banana (approx. 118g)"
     * "1 scoop (30g) whey protein powder with 250ml water"
     * "1 slice (40g) whole grain bread"
     * "2 tbsp (32g) natural peanut butter"
   - FORBIDDEN: Bare ingredient names without amounts (e.g., DO NOT write "Chicken breast", "Rice", "Olive oil", "Eggs"). The user needs to know exactly how much of each ingredient to prepare/add to achieve the meal.
2. The sum of the ingredients and their specified quantities MUST realistically and mathematically match the meal's stated calories, protein, carbs, and fat.
3. Each meal's calories MUST BE <= ${isBudgetExhausted ? 45 : params.remainingCalories}.

Return a JSON array of 3 meal objects:
- title: Name of the meal
- category: one of "breakfast", "lunch", "dinner", "snack"
- calories: Estimated calories (integer)
- protein: Protein in grams (integer)
- carbs: Carbs in grams (integer)
- fat: Fat in grams (integer)
- prepTime: Preparation time string (e.g., "10 mins")
- ingredients: Array of 3-5 ingredients with exact measurements/portions (e.g. ["150g chicken breast", "1 cup (150g) cooked jasmine rice", "100g steamed broccoli", "1 tbsp olive oil"])
- reason: 1-sentence explanation of why this fits their current goal and remaining macros
- icon: 1 relevant food emoji (e.g., "🥗", "🍗", "🥪", "🍳", "🥣")`

  const text = await generateWithFallback(prompt, {
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          category: { type: Type.STRING },
          calories: { type: Type.NUMBER },
          protein: { type: Type.NUMBER },
          carbs: { type: Type.NUMBER },
          fat: { type: Type.NUMBER },
          prepTime: { type: Type.STRING },
          ingredients: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
              description: 'Ingredient name WITH exact portion measurement (e.g., "150g raw chicken breast", "1 cup (150g) cooked brown rice", "1 tbsp (14g) olive oil")',
            },
            description: 'List of ingredients with exact portions and measurements needed to prepare the meal',
          },
          reason: { type: Type.STRING },
          icon: { type: Type.STRING },
        },
        required: [
          'title',
          'category',
          'calories',
          'protein',
          'carbs',
          'fat',
          'prepTime',
          'ingredients',
          'reason',
          'icon',
        ],
      },
    },
  })

  return JSON.parse(text) as MealSuggestion[]
}

export interface ChatMessage {
  role: 'user' | 'model'
  content: string
}

export interface UserChatContext {
  firstName?: string
  gender?: string
  weight?: number
  height?: number
  age?: number
  goal?: string
  caloriesLoggedToday?: number
  targetCalories?: number
  proteinLoggedToday?: number
  targetProtein?: number
  carbsLoggedToday?: number
  fatLoggedToday?: number
  waterMl?: number
  workoutDoneToday?: boolean
  todayWorkoutTitle?: string
  workoutsCompletedThisWeek?: number
  todayCheckInMood?: string
  todayCheckInNotes?: string
  checkInStreak?: number
  activityLevel?: string
}

export async function chatWithAICoach(
  messages: ChatMessage[],
  context: UserChatContext = {}
): Promise<string> {
  const goalDisplay =
    context.goal === 'MUSCLE_GAIN'
      ? 'Muscle Gain / Hypertrophy'
      : context.goal === 'WEIGHT_LOSS'
      ? 'Fat Loss / Cutting'
      : context.goal || 'General Health & Fitness'

  const systemPrompt = `You are FitTrack Coach, an elite, motivating, evidence-based fitness and sports nutrition coach inside the FitTrack mobile app.
You are conversing directly with ${context.firstName || 'the user'}.

=== User Real-Time Profile & Daily Context ===
- Fitness Goal: ${goalDisplay}
- Physical Stats: ${context.weight ? `${context.weight} kg` : 'N/A'}, ${context.height ? `${context.height} cm` : 'N/A'}, ${context.age ? `${context.age} years old` : 'N/A'}, Sex: ${context.gender || 'Not specified'}
- Baseline Activity Level: ${context.activityLevel || 'LIGHTLY_ACTIVE'}
- Today's Readiness Check-In: ${context.todayCheckInMood ? `${context.todayCheckInMood}${context.todayCheckInNotes ? ` (Notes: "${context.todayCheckInNotes}")` : ''}` : 'Not checked in yet today'}
- Daily Check-In Streak: ${context.checkInStreak ? `${context.checkInStreak} days 🔥` : 'Active'}
- Nutrition Today: ${context.caloriesLoggedToday ?? 0} / ${context.targetCalories || 2000} kcal
  * Protein: ${context.proteinLoggedToday ?? 0}g / ${context.targetProtein || 140}g
  * Carbs: ${context.carbsLoggedToday ?? 0}g
  * Fat: ${context.fatLoggedToday ?? 0}g
- Water Hydration: ${context.waterMl ?? 0} / 2000 ml
- Workout Today: ${context.workoutDoneToday ? `Completed (${context.todayWorkoutTitle || 'Session'}) 💪` : 'Not completed yet today'}
- Workouts This Week: ${context.workoutsCompletedThisWeek ?? 0} sessions

=== Coaching Principles & Response Guidelines ===
1. Personalize advice deeply using the user's real-time stats, readiness mood, and goal.
   - If user reports low energy, fatigue, or soreness today, recommend active recovery, mobility, adequate sleep, and anti-inflammatory nutrition.
   - If feeling strong or energized, urge progressive overload and intensity.
   - If behind on protein or hydration, provide quick, convenient meal/beverage suggestions.
   - Factor in sex-specific metabolic nuances:
     * For female athletes: be mindful of iron needs (~18mg/day), natural muscle hypertrophy pacing (~0.5-1 lb/month), and potential luteal phase water retention or energy shifts.
     * For male athletes: factor in standard hypertrophy pacing (~1-2 lbs/month) and caloric burn baselines.
2. Structure answers specifically for clean mobile reading:
   - Use concise paragraphs, bullet points (•), and bold keywords (**bold**).
   - When suggesting meals or snacks, include estimated calories and protein.
   - When giving workout tips, specify sets, reps, and form safety cues.
3. If the user mentions acute injury, chest pain, or medical symptoms, compassionately advise seeing a doctor or physical therapist.
4. Keep an inspiring, positive, and disciplined coaching tone.`

  const conversationHistory = messages
    .map((m) => {
      return `${m.role === 'user' ? 'User' : 'FitTrack Coach'}: ${m.content}`
    })
    .join('\n\n')

  const prompt = `${systemPrompt}\n\n=== Conversation History ===\n${conversationHistory}\n\nFitTrack Coach:`

  const responseText = await generateWithFallback(prompt, {
    temperature: 0.7,
  })

  return responseText.trim()
}

export async function streamAICoach(
  messages: ChatMessage[],
  context: UserChatContext = {},
  onChunk: (chunkText: string) => void
): Promise<string> {
  const goalDisplay =
    context.goal === 'MUSCLE_GAIN'
      ? 'Muscle Gain / Hypertrophy'
      : context.goal === 'WEIGHT_LOSS'
      ? 'Fat Loss / Cutting'
      : context.goal || 'General Health & Fitness'

  const systemPrompt = `You are FitTrack Coach, an elite, motivating, evidence-based fitness and sports nutrition coach inside the FitTrack mobile app.
You are conversing directly with ${context.firstName || 'the user'}.

=== User Real-Time Profile & Daily Context ===
- Fitness Goal: ${goalDisplay}
- Physical Stats: ${context.weight ? `${context.weight} kg` : 'N/A'}, ${context.height ? `${context.height} cm` : 'N/A'}, ${context.age ? `${context.age} years old` : 'N/A'}, Sex: ${context.gender || 'Not specified'}
- Baseline Activity Level: ${context.activityLevel || 'LIGHTLY_ACTIVE'}
- Today's Readiness Check-In: ${context.todayCheckInMood ? `${context.todayCheckInMood}${context.todayCheckInNotes ? ` (Notes: "${context.todayCheckInNotes}")` : ''}` : 'Not checked in yet today'}
- Daily Check-In Streak: ${context.checkInStreak ? `${context.checkInStreak} days 🔥` : 'Active'}
- Nutrition Today: ${context.caloriesLoggedToday ?? 0} / ${context.targetCalories || 2000} kcal
  * Protein: ${context.proteinLoggedToday ?? 0}g / ${context.targetProtein || 140}g
  * Carbs: ${context.carbsLoggedToday ?? 0}g
  * Fat: ${context.fatLoggedToday ?? 0}g
- Water Hydration: ${context.waterMl ?? 0} / 2000 ml
- Workout Today: ${context.workoutDoneToday ? `Completed (${context.todayWorkoutTitle || 'Session'}) 💪` : 'Not completed yet today'}
- Workouts This Week: ${context.workoutsCompletedThisWeek ?? 0} sessions

=== Coaching Principles & Response Guidelines ===
1. Personalize advice deeply using the user's real-time stats, readiness mood, and goal.
   - If user reports low energy, fatigue, or soreness today, recommend active recovery, mobility, adequate sleep, and anti-inflammatory nutrition.
   - If feeling strong or energized, urge progressive overload and intensity.
   - If behind on protein or hydration, provide quick, convenient meal/beverage suggestions.
   - Factor in sex-specific metabolic nuances:
     * For female athletes: be mindful of iron needs (~18mg/day), natural muscle hypertrophy pacing (~0.5-1 lb/month), and potential luteal phase water retention or energy shifts.
     * For male athletes: factor in standard hypertrophy pacing (~1-2 lbs/month) and caloric burn baselines.
2. Structure answers specifically for clean mobile reading:
   - Use concise paragraphs, bullet points (•), and bold keywords (**bold**).
   - When suggesting meals or snacks, include estimated calories and protein.
   - When giving workout tips, specify sets, reps, and form safety cues.
3. If the user mentions acute injury, chest pain, or medical symptoms, compassionately advise seeing a doctor or physical therapist.
4. Keep an inspiring, positive, and disciplined coaching tone.`

  const conversationHistory = messages
    .map((m) => `${m.role === 'user' ? 'User' : 'FitTrack Coach'}: ${m.content}`)
    .join('\n\n')

  const prompt = `${systemPrompt}\n\n=== Conversation History ===\n${conversationHistory}\n\nFitTrack Coach:`

  let fullResponse = ''
  try {
    const ai = getAI()
    const primaryModel = process.env.GEMINI_MODEL || CANDIDATE_MODELS[0]

    const responseStream = await ai.models.generateContentStream({
      model: primaryModel,
      contents: prompt,
      config: { temperature: 0.7 },
    })

    for await (const chunk of responseStream) {
      const text = chunk.text
      if (text) {
        fullResponse += text
        onChunk(text)
      }
    }
  } catch (err: any) {
    console.warn('[AI Service] Stream failed with primary model, fallback to generateWithFallback:', err?.message || err)
    fullResponse = await generateWithFallback(prompt, { temperature: 0.7 })
    onChunk(fullResponse)
  }

  return fullResponse.trim()
}

export async function autocompleteExerciseWithAI(name: string): Promise<{
  primaryMuscle: string
  secondaryMuscles: string[]
  category: string
  type: string
  difficulty: string
  equipment: string[]
  instructions: string[]
  formTips: string[]
  commonMistakes: string[]
  breathingTechnique: string
}> {
  const prompt = `You are an elite certified strength & conditioning coach (CSCS).
Break down this exercise for a fitness app exercise catalog: "${name}".

Return a single JSON object with these exact keys:
- "primaryMuscle": Primary targeted muscle. Must be one of: "Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Full Body"
- "secondaryMuscles": Array of 1-3 secondary muscles worked (e.g. ["Triceps", "Front Delts"])
- "category": Exercise category. Must be one of: "Strength", "Hypertrophy", "Cardio", "Endurance", "Mobility"
- "type": "Compound" or "Isolation"
- "difficulty": "Beginner", "Intermediate", or "Advanced"
- "equipment": Array of required equipment (e.g. ["Barbell"], ["Dumbbells"], ["Cable"], ["Machine"], or ["Bodyweight"])
- "instructions": Array of 3 to 5 clear, concise step-by-step instructions
- "formTips": Array of 2 to 3 pro trainer tips to maximize engagement and ensure proper posture
- "commonMistakes": Array of 2 to 3 common mistakes or injury risks to avoid
- "breathingTechnique": One clear sentence detailing the breathing cadence (e.g. "Inhale deeply as you lower the weight, and exhale forcefully as you drive upward.")

Return strictly valid JSON only.`

  const text = await generateWithFallback([prompt], {
    responseMimeType: 'application/json',
  })

  return JSON.parse(text)
}


