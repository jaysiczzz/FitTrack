/**
 * Capitalizes the first letter of each word in a string (Title Case)
 * e.g. "john doe" -> "John Doe", "ALEX RIVERA" -> "Alex Rivera"
 */
export function capitalizeWords(str?: string | null): string {
  if (!str) return '';
  return str
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Formats fitness goal keys into human-readable Title Case labels.
 * e.g. "MUSCLE_GAIN" | "muscle" -> "Muscle Gain", "WEIGHT_LOSS" | "loss" -> "Weight Loss"
 */
export function formatGoalLabel(goal?: string | null): string {
  if (!goal) return '';
  const normalized = goal.toUpperCase().trim();
  if (normalized === 'MUSCLE_GAIN' || normalized === 'MUSCLE') {
    return 'Muscle Gain';
  }
  if (normalized === 'WEIGHT_LOSS' || normalized === 'LOSS') {
    return 'Weight Loss';
  }
  return capitalizeWords(goal.replace(/_/g, ' '));
}
