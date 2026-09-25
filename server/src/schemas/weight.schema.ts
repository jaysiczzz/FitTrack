import { z } from 'zod'

export const saveWeightLogSchema = z.object({
  body: z.object({
    weight: z
      .number({ message: 'Weight must be a number' })
      .positive('Weight must be greater than 0')
      .max(500, 'Weight must be less than 500 kg'),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in format YYYY-MM-DD')
      .optional(),
    notes: z.string().max(300, 'Notes must be under 300 characters').optional().nullable(),
  }),
})

export const setTargetWeightSchema = z.object({
  body: z.object({
    targetWeight: z
      .number({ message: 'Target weight must be a number' })
      .positive('Target weight must be greater than 0')
      .max(500, 'Target weight must be less than 500 kg')
      .nullable(),
  }),
})

export type SaveWeightLogInput = z.infer<typeof saveWeightLogSchema>['body']
export type SetTargetWeightInput = z.infer<typeof setTargetWeightSchema>['body']
