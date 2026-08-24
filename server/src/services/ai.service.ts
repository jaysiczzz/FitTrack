import { GoogleGenAI, Type } from '@google/genai'

const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) {
  console.warn('Warning: GEMINI_API_KEY environment variable is not set!')
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' })

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
  const modelName = 'gemini-3.6-flash'

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

  const response = await ai.models.generateContent({
    model: modelName,
    contents,
    config: {
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
    },
  })

  if (!response.text) {
    throw new Error('Failed to get response from Gemini API')
  }

  return JSON.parse(response.text) as MealAnalysisResult
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
  const modelName = 'gemini-3.6-flash'

  const prompt = `You are FitTrack's AI fitness and nutrition coach.
Generate 3 dynamic, personalized health insights/predictions for user ${userProfile.firstName}:
- User Stats: ${userProfile.weight}kg, ${userProfile.height}cm, ${userProfile.age} years old.
- Fitness Goal: ${userProfile.goal} (e.g., MUSCLE_GAIN or WEIGHT_LOSS).
- Completed Workouts This Week: ${userProfile.workoutCount || 0}.

Return a JSON array of 3 insights, each having:
- title: Short catchphrase (e.g., "Trend prediction", "Meal timing", "Recovery", "Hydration strategy")
- lines: Array of 2 concise, actionable bullet point strings giving realistic calculations or tips for their specific goal.`

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
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
    },
  })

  if (!response.text) {
    throw new Error('Failed to generate insights from Gemini API')
  }

  return JSON.parse(response.text) as AIInsight[]
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
  const modelName = 'gemini-3.6-flash'

  const prompt = `Design a customized workout routine for a user with:
- Fitness Goal: ${userProfile.goal}
- Target focus: ${userProfile.targetArea || 'Full Body'}
- Weight: ${userProfile.weight}kg, Height: ${userProfile.height}cm.

Return a JSON object containing:
- title: Name of the workout session
- estimatedDurationMinutes: Estimated duration in minutes
- targetMuscleGroup: Main muscle group targeted
- exercises: Array of 4-5 exercises with name, category, sets, reps, and optional suggestedWeightKg.`

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
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
    },
  })

  if (!response.text) {
    throw new Error('Failed to generate workout plan from Gemini API')
  }

  return JSON.parse(response.text) as AIWorkoutPlan
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
  const modelName = 'gemini-3.6-flash'

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

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
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
    },
  })

  if (!response.text) {
    throw new Error('Failed to generate meal suggestions from Gemini API')
  }

  return JSON.parse(response.text) as MealSuggestion[]
}

