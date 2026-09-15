import { z } from 'zod'

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Please enter a valid email address'),
    password: z
      .string()
      .min(1, 'Password is required'),
  }),
})

export const registerSchema = z.object({
  body: z.object({
    firstName: z
      .string()
      .trim()
      .min(1, 'First name is required')
      .max(60, 'First name is too long'),
    lastName: z
      .string()
      .trim()
      .min(1, 'Last name is required')
      .max(60, 'Last name is too long'),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Please enter a valid email address'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters long'),
    height: z.coerce
      .number()
      .int('Height must be an integer')
      .min(1, 'Height must be at least 1 cm')
      .max(300, 'Height must be under 300 cm'),
    weight: z.coerce
      .number()
      .min(1, 'Weight must be at least 1 kg')
      .max(500, 'Weight must be under 500 kg'),
    age: z.coerce
      .number()
      .int('Age must be an integer')
      .min(1, 'Age must be at least 1')
      .max(120, 'Age must be under 120'),
    goal: z.enum(['MUSCLE_GAIN', 'WEIGHT_LOSS'] as const),
  }),
})

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
})
