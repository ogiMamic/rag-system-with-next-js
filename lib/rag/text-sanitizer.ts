/**
 * Sanitize text to remove characters that PostgreSQL can't handle
 */
export function sanitizeText(text: string): string {
  // Remove null bytes (\u0000) which PostgreSQL TEXT columns cannot store
  let sanitized = text.replace(/\0/g, "")

  // Remove other problematic control characters but keep newlines and tabs
  sanitized = sanitized.replace(/[\x01-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "")

  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, " ")

  return sanitized.trim()
}
