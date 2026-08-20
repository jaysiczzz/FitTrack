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
  const modelName = 'gemini-2.5-flash'

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
    contents.push({
      inlineData: {
        data: params.imageBase64,
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
  const modelName = 'gemini-2.5-flash'

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
  const modelName = 'gemini-2.5-flash'

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
