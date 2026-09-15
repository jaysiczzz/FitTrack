import bcrypt from 'bcrypt'

const saltRounds = 10

export const hashPassword = async (password: string): Promise<string> => {
   return await bcrypt.hash(password, saltRounds)
}

export const comparePassword = async (password: string, hashed: string): Promise<boolean> => {
   return await bcrypt.compare(password, hashed)
}

/**
 * Validates password meets security policy:
 * - At least 8 characters
 * - At least 1 uppercase letter (A-Z)
 * - At least 1 lowercase letter (a-z)
 * - At least 1 numeric digit (0-9)
 * - At least 1 special character (!@#$%^&*, etc.)
 */
export const validatePasswordStrength = (password: string): { valid: boolean; error?: string } => {
  if (!password || password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' }
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must include at least one uppercase letter (A-Z)' }
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must include at least one lowercase letter (a-z)' }
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must include at least one number (0-9)' }
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { valid: false, error: 'Password must include at least one special character (!@#$%^&*, etc.)' }
  }
  return { valid: true }
}