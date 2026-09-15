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

export const strongPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Z]/, 'Password must include at least one uppercase letter (A-Z)')
  .regex(/[a-z]/, 'Password must include at least one lowercase letter (a-z)')
  .regex(/[0-9]/, 'Password must include at least one number (0-9)')
  .regex(/[^A-Za-z0-9]/, 'Password must include at least one special character (!@#$%^&*, etc.)')

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
    password: strongPasswordSchema,
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

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: strongPasswordSchema,
  }),
})

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Please enter a valid email address'),
  }),
})

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Please enter a valid email address'),
    code: z
      .string()
      .trim()
      .length(6, 'Verification code must be 6 digits'),
    newPassword: strongPasswordSchema,
  }),
})

export const checkEmailSchema = z.object({
  body: z.object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email('Please enter a valid email address'),
  }),
})


