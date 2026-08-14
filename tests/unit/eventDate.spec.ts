import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { isActiveOrScheduledEvent } from '../../app/utils/eventDate'

describe('isActiveOrScheduledEvent utility tests', () => {
  let fixedNow: Date

  beforeEach(() => {
    // Fix "today" to 2026-08-13 for deterministic tests
    fixedNow = new Date('2026-08-13T00:00:00.000Z')
    vi.useFakeTimers()
    vi.setSystemTime(fixedNow)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('1. returns false for null/undefined event', () => {
    expect(isActiveOrScheduledEvent(null)).toBe(false)
    expect(isActiveOrScheduledEvent(undefined)).toBe(false)
  })

  it('2. returns true when event has no end date (date_to and end_date both absent)', () => {
    expect(isActiveOrScheduledEvent({ name: 'No End Date Event' })).toBe(true)
  })

  it('3. returns true when date_to is null or undefined', () => {
    expect(isActiveOrScheduledEvent({ date_to: null })).toBe(true)
    expect(isActiveOrScheduledEvent({ date_to: undefined })).toBe(true)
  })

  it('4. returns true for a future end date via date_to', () => {
    // 2026-12-31 is after 2026-08-13
    expect(isActiveOrScheduledEvent({ date_to: '2026-12-31' })).toBe(true)
  })

  it('5. returns true for a future end date via end_date field', () => {
    expect(isActiveOrScheduledEvent({ end_date: '2027-01-01' })).toBe(true)
  })

  it('6. returns false for a past end date', () => {
    // 2026-01-01 is before 2026-08-13
    expect(isActiveOrScheduledEvent({ date_to: '2026-01-01' })).toBe(false)
  })

  it('7. returns true for end date equal to today (begins of today)', () => {
    // Exactly today: 2026-08-13 — should still be active (>= today midnight)
    expect(isActiveOrScheduledEvent({ date_to: '2026-08-13' })).toBe(true)
  })

  it('8. returns false for a date_to one day before today', () => {
    expect(isActiveOrScheduledEvent({ date_to: '2026-08-12' })).toBe(false)
  })

  it('9. handles datetime string format (YYYY-MM-DD HH:mm:ss)', () => {
    // Future datetime
    expect(isActiveOrScheduledEvent({ date_to: '2026-12-31 23:59:59' })).toBe(true)
    // Past datetime
    expect(isActiveOrScheduledEvent({ date_to: '2026-08-01 12:00:00' })).toBe(false)
  })

  it('10. handles ISO 8601 string with Z suffix', () => {
    expect(isActiveOrScheduledEvent({ date_to: '2026-12-01T00:00:00Z' })).toBe(true)
  })

  it('11. prefers date_to over end_date when both are present', () => {
    // date_to is future, end_date is past — date_to takes priority
    expect(isActiveOrScheduledEvent({ date_to: '2027-01-01', end_date: '2020-01-01' })).toBe(true)
  })

  it('12. returns true for a completely invalid date string (fail-safe)', () => {
    expect(isActiveOrScheduledEvent({ date_to: 'not-a-date' })).toBe(true)
  })

  it('13. returns true for NaN date (malformed number string)', () => {
    expect(isActiveOrScheduledEvent({ date_to: 'abc-def-ghi' })).toBe(true)
  })
})
