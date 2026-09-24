import { z } from 'zod'

export const createTestimonialSchema = z.object({
  body: z.object({
    rating: z.number().int().min(1, 'Rating must be at least 1 star').max(5, 'Rating cannot exceed 5 stars'),
    content: z.string().trim().min(8, 'Testimony must be at least 8 characters').max(1000, 'Testimony cannot exceed 1000 characters'),
    highlightBadge: z.string().trim().max(60, 'Highlight badge too long').optional().nullable(),
    goal: z.union([z.enum(['MUSCLE_GAIN', 'WEIGHT_LOSS']), z.literal('')]).optional().nullable(),
    weightChangeKg: z.number().min(-100).max(100).optional().nullable(),
    durationWeeks: z.number().int().min(1).max(520).optional().nullable(),
  }),
})

export type CreateTestimonialInput = z.infer<typeof createTestimonialSchema>['body']
