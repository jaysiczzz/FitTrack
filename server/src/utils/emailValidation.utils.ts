import dns from 'dns'

const COMMON_TYPO_DOMAINS: Record<string, string> = {
  'gamil.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmaik.com': 'gmail.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'hotmial.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outloo.com': 'outlook.com',
  'iclud.com': 'icloud.com',
}

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Validates email format, catches common domain typos, and checks DNS MX records
 * to ensure the domain can actually receive password reset emails.
 */
export async function validateEmailDeliverability(email: string): Promise<{ valid: boolean; error?: string }> {
  const trimmed = email.trim().toLowerCase()

  if (!trimmed || !EMAIL_REGEX.test(trimmed)) {
    return { valid: false, error: 'Please enter a valid email address' }
  }

  const parts = trimmed.split('@')
  if (parts.length !== 2) {
    return { valid: false, error: 'Please enter a valid email address' }
  }

  const domain = parts[1]

  // Check for common accidental typos
  if (COMMON_TYPO_DOMAINS[domain]) {
    return {
      valid: false,
      error: `Did you mean @${COMMON_TYPO_DOMAINS[domain]} instead of @${domain}?`,
    }
  }

  // Verify domain has active Mail Exchange (MX) records
  try {
    const mxRecords = await dns.promises.resolveMx(domain)
    if (!mxRecords || mxRecords.length === 0) {
      return {
        valid: false,
        error: `The domain '@${domain}' cannot receive emails. Please check your email address.`,
      }
    }
  } catch (err: any) {
    if (err.code === 'ENOTFOUND' || err.code === 'ENODATA' || err.code === 'ESERVFAIL') {
      return {
        valid: false,
        error: `The email domain '@${domain}' does not exist or has no active mail servers.`,
      }
    }
    // In case of timeout or local network DNS sandbox issues, log warning and allow
    console.warn(`[DNS MX Warning] Could not resolve MX for ${domain}:`, err.message || err.code)
  }

  return { valid: true }
}
