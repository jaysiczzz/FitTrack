import { z } from 'zod'

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/

export const updateNotificationSettingsSchema = z.object({
  body: z.object({
    mealReminders: z.boolean().optional(),
    breakfastTime: z.string().regex(timeRegex, 'Invalid time format (HH:MM)').optional(),
    lunchTime: z.string().regex(timeRegex, 'Invalid time format (HH:MM)').optional(),
    dinnerTime: z.string().regex(timeRegex, 'Invalid time format (HH:MM)').optional(),
    hydrationReminders: z.boolean().optional(),
    hydrationTime1: z.string().regex(timeRegex, 'Invalid time format (HH:MM)').optional(),
    hydrationTime2: z.string().regex(timeRegex, 'Invalid time format (HH:MM)').optional(),
    workoutReminders: z.boolean().optional(),
    workoutTime: z.string().regex(timeRegex, 'Invalid time format (HH:MM)').optional(),
    checkinReminders: z.boolean().optional(),
    checkinTime: z.string().regex(timeRegex, 'Invalid time format (HH:MM)').optional(),
    soundEnabled: z.boolean().optional(),
    vibrationEnabled: z.boolean().optional(),
    quietHoursEnabled: z.boolean().optional(),
    quietHoursStart: z.string().regex(timeRegex, 'Invalid time format (HH:MM)').optional(),
    quietHoursEnd: z.string().regex(timeRegex, 'Invalid time format (HH:MM)').optional(),
  }),
})

export type UpdateNotificationSettingsInput = z.infer<typeof updateNotificationSettingsSchema>['body']
