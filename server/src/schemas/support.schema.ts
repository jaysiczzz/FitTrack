import { z } from 'zod'

export const supportFeedbackSchema = z.object({
  body: z.object({
    category: z.enum(['BUG', 'FEATURE', 'QUESTION', 'GENERAL']).default('GENERAL'),
    subject: z.string().trim().min(3, 'Subject must be at least 3 characters').max(150, 'Subject is too long'),
    message: z.string().trim().min(10, 'Message must be at least 10 characters').max(2000, 'Message is too long'),
    email: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
  }),
})

export type SupportFeedbackInput = z.infer<typeof supportFeedbackSchema>['body']
