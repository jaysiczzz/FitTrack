/**
 * Capitalizes the first letter of each word in a string (Title Case)
 * e.g. "john doe" -> "John Doe", "ALEX RIVERA" -> "Alex Rivera", "josh" -> "Josh"
 */
export function capitalizeWords(str?: string | null): string {
  if (!str) return ''
  return str
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}
