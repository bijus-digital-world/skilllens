/**
 * Input validation and sanitization utilities.
 * Used at API boundaries to prevent injection and ensure data integrity.
 */

// Strip HTML tags and trim whitespace
export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') return ''
  return input.replace(/<[^>]*>/g, '').trim()
}

// Validate email format
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254
}

// Validate UUID v4 format
export function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

// Validate and clamp a positive integer within a range
export function validateInt(input: unknown, min: number, max: number, fallback: number): number {
  const num = typeof input === 'number' ? input : parseInt(String(input), 10)
  if (isNaN(num)) return fallback
  return Math.max(min, Math.min(max, num))
}

// Validate that a value is one of the allowed options
export function isOneOf<T extends string>(value: unknown, allowed: T[]): value is T {
  return typeof value === 'string' && allowed.includes(value as T)
}

// Sanitize a name — letters, spaces, hyphens, apostrophes, periods only
export function sanitizeName(input: unknown): string {
  if (typeof input !== 'string') return ''
  return input.replace(/[^a-zA-Z\s\-'.]/g, '').trim().slice(0, 100)
}
