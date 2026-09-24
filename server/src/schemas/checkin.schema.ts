import { z } from 'zod'

export const saveCheckInSchema = z.object({
  body: z.object({
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
      .optional(),
    moodId: z.enum(['fire', 'strong', 'good', 'tired', 'rest'], {
      message: 'Invalid mood identifier',
    }),
    moodLabel: z.string().trim().min(1, 'Mood label is required').max(50),
    coachTip: z.string().trim().min(1, 'Coach tip is required').max(500),
    quote: z.string().trim().max(500).optional().nullable(),
    quoteAuthor: z.string().trim().max(100).optional().nullable(),
    notes: z.string().trim().max(500).optional().nullable(),
  }),
})

export type SaveCheckInInput = z.infer<typeof saveCheckInSchema>['body']
