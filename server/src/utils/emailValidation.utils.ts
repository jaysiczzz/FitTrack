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

const KNOWN_MAJOR_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'ymail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'protonmail.com',
  'proton.me',
  'zoho.com',
  'mail.com',
  'gmx.com',
])

const domainMxCache = new Map<string, boolean>()

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

  // Fast path for trusted major email providers (no network DNS call needed)
  if (KNOWN_MAJOR_DOMAINS.has(domain)) {
    return { valid: true }
  }

  // Fast path: cached DNS lookup
  if (domainMxCache.has(domain)) {
    const isCachedValid = domainMxCache.get(domain)
    if (!isCachedValid) {
      return {
        valid: false,
        error: `The email domain '@${domain}' does not exist or has no active mail servers.`,
      }
    }
    return { valid: true }
  }

  // Verify custom domain has active Mail Exchange (MX) records
  try {
    const mxPromise = dns.promises.resolveMx(domain)
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('DNS_TIMEOUT')), 1200)
    )
    const mxRecords = await Promise.race([mxPromise, timeoutPromise])
    if (!mxRecords || mxRecords.length === 0) {
      if (domainMxCache.size < 500) domainMxCache.set(domain, false)
      return {
        valid: false,
        error: `The domain '@${domain}' cannot receive emails. Please check your email address.`,
      }
    }
    if (domainMxCache.size < 500) domainMxCache.set(domain, true)
  } catch (err: any) {
    if (err.message === 'DNS_TIMEOUT') {
      console.warn(`[DNS MX Timeout] Resolving MX for ${domain} timed out after 1.2s, proceeding.`)
      return { valid: true }
    }
    if (err.code === 'ENOTFOUND' || err.code === 'ENODATA' || err.code === 'ESERVFAIL') {
      if (domainMxCache.size < 500) domainMxCache.set(domain, false)
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
