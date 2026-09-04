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

export interface MealAnalysisResult {
  foodName: string
  servingSize: string
  calories: number
  protein: number
  carbs: number
  fat: number
  healthNotes?: string
}

export async function analyzeMealWithAI(params: {
  description?: string
  imageBase64?: string
  mimeType?: string
}): Promise<MealAnalysisResult> {
  const promptText = `Analyze this meal (from text description and/or image) and provide accurate nutritional estimation.
  User Description: ${params.description || 'Not provided'}
  
  Return a structured JSON with:
  - foodName: Name of the meal or food item(s)
  - servingSize: Estimated portion size (e.g. "1 plate", "200g")
  - calories: Total estimated calories (integer)
  - protein: Protein in grams (integer or float)
  - carbs: Carbs in grams (integer or float)
  - fat: Fat in grams (integer or float)
  - healthNotes: Brief 1-sentence health insight or tip about this meal`

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
        foodName: { type: Type.STRING },
        servingSize: { type: Type.STRING },
        calories: { type: Type.NUMBER },
        protein: { type: Type.NUMBER },
        carbs: { type: Type.NUMBER },
        fat: { type: Type.NUMBER },
        healthNotes: { type: Type.STRING },
      },
      required: ['foodName', 'servingSize', 'calories', 'protein', 'carbs', 'fat'],
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

Return a JSON array of 3 meal objects:
- title: Name of the meal
- category: one of "breakfast", "lunch", "dinner", "snack"
- calories: Estimated calories (integer)
- protein: Protein in grams (integer)
- carbs: Carbs in grams (integer)
- fat: Fat in grams (integer)
- prepTime: Preparation time string (e.g., "10 mins")
- ingredients: Array of 3-5 simple key ingredient strings
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
            items: { type: Type.STRING },
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

