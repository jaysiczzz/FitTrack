import 'dotenv/config'
import { GoogleGenAI, Type } from '@google/genai'

function getAI() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server. Please set GEMINI_API_KEY in your environment variables.')
  }
  return new GoogleGenAI({ apiKey })
}

const CANDIDATE_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash',
  'gemini-flash-latest',
]

async function generateWithFallback(
  contents: any,
  config: any
) {
  const ai = getAI()
  const primaryModel = process.env.GEMINI_MODEL || CANDIDATE_MODELS[0]
  const modelsToTry = [primaryModel, ...CANDIDATE_MODELS.filter((m) => m !== primaryModel)]

  let lastError: any = null
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
        console.warn(`[AI Service] Model ${model} (attempt ${attempt}) failed: ${err.message || err}`)
        if (is503 && attempt === 1) {
          await new Promise((resolve) => setTimeout(resolve, 1500))
        } else {
          break
        }
      }
    }
    // Brief pause before trying next fallback model
    await new Promise((resolve) => setTimeout(resolve, 600))
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
  workoutCount?: number
  caloriesLoggedToday?: number
}): Promise<AIInsight[]> {
  const prompt = `You are FitTrack's AI fitness and nutrition coach.
Generate 3 dynamic, personalized health insights/predictions for user ${userProfile.firstName}:
- User Stats: ${userProfile.weight}kg, ${userProfile.height}cm, ${userProfile.age} years old.
- Fitness Goal: ${userProfile.goal} (e.g., MUSCLE_GAIN or WEIGHT_LOSS).
- Completed Workouts This Week: ${userProfile.workoutCount || 0}.

Return a JSON array of 3 insights, each having:
- title: Short catchphrase (e.g., "Trend prediction", "Meal timing", "Recovery", "Hydration strategy")
- lines: Array of 2 concise, actionable bullet point strings giving realistic calculations or tips for their specific goal.`

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
  targetArea?: string
}): Promise<AIWorkoutPlan> {
  const prompt = `Design a customized workout routine for a user with:
- Fitness Goal: ${userProfile.goal}
- Target focus: ${userProfile.targetArea || 'Full Body'}
- Weight: ${userProfile.weight}kg, Height: ${userProfile.height}cm.

Return a JSON object containing:
- title: Name of the workout session
- estimatedDurationMinutes: Estimated duration in minutes
- targetMuscleGroup: Main muscle group targeted
- exercises: Array of 4-5 exercises with name, category, sets, reps, and optional suggestedWeightKg.`

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
}): Promise<MealSuggestion[]> {
  const prompt = `You are FitTrack's AI Nutrition Coach.
Recommend 3 distinct, delicious, practical meals or snacks for a beginner user with:
- Fitness Goal: ${params.goal} (e.g. MUSCLE_GAIN or WEIGHT_LOSS)
- Remaining Calories Today: ${params.remainingCalories} kcal
- Remaining Protein Target: ${params.remainingProtein}g

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
- Physical Stats: ${context.weight ? `${context.weight} kg` : 'N/A'}, ${context.height ? `${context.height} cm` : 'N/A'}, ${context.age ? `${context.age} years old` : 'N/A'}
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
- Physical Stats: ${context.weight ? `${context.weight} kg` : 'N/A'}, ${context.height ? `${context.height} cm` : 'N/A'}, ${context.age ? `${context.age} years old` : 'N/A'}
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


