export interface PasswordValidationResult {
  valid: boolean;
  error?: string;
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

/**
 * Validates that a password satisfies the high-security requirements:
 * - At least 8 characters
 * - At least 1 uppercase letter (A-Z)
 * - At least 1 lowercase letter (a-z)
 * - At least 1 number (0-9)
 * - At least 1 special character (!@#$%^&*, etc.)
 */
export function validatePasswordStrength(password: string): PasswordValidationResult {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

  let error: string | undefined;
  if (!hasMinLength) {
    error = 'Password must be at least 8 characters long';
  } else if (!hasUppercase) {
    error = 'Password must include at least one uppercase letter (A-Z)';
  } else if (!hasLowercase) {
    error = 'Password must include at least one lowercase letter (a-z)';
  } else if (!hasNumber) {
    error = 'Password must include at least one number (0-9)';
  } else if (!hasSpecialChar) {
    error = 'Password must include at least one special character (!@#$%^&*, etc.)';
  }

  return {
    valid: hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar,
    error,
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecialChar,
  };
}
