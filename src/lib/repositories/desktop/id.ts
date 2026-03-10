// CUID-like ID generator for desktop (no crypto dependency on cuid package).
// Uses timestamp + random suffix, compatible with cloud CUIDs for sync.

export function generateId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 10)
  return `d${timestamp}${random}`
}
