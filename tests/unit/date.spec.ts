import { describe, it, expect } from 'vitest'
import { formatDate } from '../../app/utils/date'

describe('formatDate utility - Comprehensive Edge Cases', () => {
  it('1. returns fallback for null input', () => {
    expect(formatDate(null)).toBe('—')
  })

  it('2. returns fallback for undefined input', () => {
    expect(formatDate(undefined)).toBe('—')
  })

  it('3. returns fallback for empty string', () => {
    expect(formatDate('')).toBe('—')
  })

  it('4. formats date string YYYY-MM-DD correctly', () => {
    const formatted = formatDate('2026-08-03')
    expect(formatted).toMatch(/03 Aug 2026|3 Aug 2026/)
  })

  it('5. formats datetime string YYYY-MM-DD HH:mm:ss correctly', () => {
    const formatted = formatDate('2026-10-01 09:00:00')
    expect(formatted).toMatch(/01 Oct 2026|1 Oct 2026/)
  })

  it('6. formats ISO 8601 string correctly', () => {
    const formatted = formatDate('2026-12-25')
    expect(formatted).toMatch(/25 Dec 2026/)
  })

  it('7. handles single digit months and days gracefully', () => {
    const formatted = formatDate('2026-01-05')
    expect(formatted).toMatch(/05 Jan 2026|5 Jan 2026/)
  })

  it('8. preserves invalid string if parsing fails', () => {
    expect(formatDate('invalid-date')).toBe('invalid-date')
  })

  it('9. preserves malformed dash string if numbers are NaN', () => {
    expect(formatDate('abc-def-ghi')).toBe('abc-def-ghi')
  })

  it('10. handles leap year date parsing accurately', () => {
    const formatted = formatDate('2028-02-29')
    expect(formatted).toMatch(/29 Feb 2028/)
  })

  it('11. handles year end dates correctly', () => {
    const formatted = formatDate('2026-12-31')
    expect(formatted).toMatch(/31 Dec 2026/)
  })
})
