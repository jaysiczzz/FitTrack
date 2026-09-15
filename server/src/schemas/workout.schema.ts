import { z } from 'zod'

export const updateSetSchema = z.object({
  body: z.object({
    weight: z.coerce.number().min(0, 'Weight cannot be negative').max(1500).optional(),
    reps: z.coerce.number().int().min(0, 'Reps cannot be negative').max(500).optional(),
    done: z.boolean().optional(),
  }),
})

export const addSetSchema = z.object({
  body: z.object({
    weight: z.coerce.number().min(0).max(1500).optional(),
    reps: z.coerce.number().int().min(0).max(500).optional(),
    bodyweight: z.boolean().optional(),
  }),
})

export const toggleSetSchema = z.object({
  body: z.object({
    done: z.boolean().optional(),
  }),
})

export const addExerciseToTodaySchema = z.object({
  body: z.object({
    exerciseId: z.string().optional(),
    name: z.string().trim().min(1, 'Exercise name is required'),
    category: z.string().optional(),
    type: z.string().optional(),
    defaultSets: z
      .array(
        z.object({
          weight: z.coerce.number().optional(),
          reps: z.coerce.number().int().optional(),
          bodyweight: z.boolean().optional(),
        })
      )
      .optional(),
  }),
})

export const createCustomExerciseSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Exercise name is required').max(100),
    description: z.string().max(500).optional(),
    category: z.string().default('Strength'),
    type: z.string().default('Compound'),
    difficulty: z.string().default('Intermediate'),
    primaryMuscle: z.string().default('Chest'),
    muscleGroup: z.string().optional(),
    secondaryMuscles: z.array(z.string()).optional(),
    bodyPart: z.string().default('Upper Body'),
    equipment: z.array(z.string()).optional(),
    equipmentAlternatives: z.array(z.string()).optional(),
    startingPosition: z.string().optional(),
    instructions: z.union([z.array(z.string()), z.string()]).optional(),
    formTips: z.array(z.string()).optional(),
    commonMistakes: z.array(z.string()).optional(),
    breathingTechnique: z.string().optional(),
    recommendedSets: z.coerce.number().int().optional(),
    recommendedReps: z.coerce.number().int().optional(),
    recommendedDuration: z.coerce.number().int().optional(),
    recommendedRest: z.coerce.number().int().optional(),
    recommendedTempo: z.string().optional(),
    defaultSets: z.any().optional(),
    imageUrl: z.string().url().optional().or(z.literal('')),
    thumbnailUrl: z.string().url().optional().or(z.literal('')),
    safetyInstructions: z.string().optional(),
    injuryPreventionTips: z.string().optional(),
    beginnerModification: z.string().optional(),
    advancedVariation: z.string().optional(),
    easierAlternative: z.string().optional(),
    harderAlternative: z.string().optional(),
    equipmentFreeAlternative: z.string().optional(),
    similarExercises: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    difficultyPresets: z.any().optional(),
  }),
})
