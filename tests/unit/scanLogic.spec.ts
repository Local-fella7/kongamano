import { describe, it, expect } from 'vitest'

describe('Scan Station & Verification Logic Unit Tests', () => {
  // Helper: parse time to minutes
  function parseTimeToMinutes(timeStr?: string | null): number | null {
    if (!timeStr) return null
    const match = String(timeStr).trim().match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/)
    if (!match) return null
    const h = parseInt(match[1], 10)
    const m = parseInt(match[2], 10)
    if (isNaN(h) || isNaN(m)) return null
    return h * 60 + m
  }

  // Helper: in-memory registration indexer
  function indexRegistrations(regList: any[]) {
    const map = new Map<string, any>()
    for (const r of regList) {
      if (!r) continue
      if (r.qr_code) {
        map.set(String(r.qr_code).trim(), r)
      }
      if (r.id) {
        map.set(String(r.id), r)
        if (r.event_id) {
          map.set(`REG-${r.event_id}-${r.id}`, r)
        }
      }
    }
    return map
  }

  // Helper: evaluate check-in status
  function isAttendeeCheckedIn(logs: any[]): boolean {
    if (!logs || logs.length === 0) return false
    const latest = logs[0]
    if (latest?.scan_type === 'check_out') return false
    return logs.some((l) => l.scan_type === 'check_in' || !l.service_id)
  }

  // Helper: service active check
  function isServiceActive(
    srv: { start_time?: string | null; end_time?: string | null; requires_scan?: boolean },
    currentMinutes: number
  ): boolean {
    const requiresScan = srv.requires_scan !== false
    if (!requiresScan) return false

    const startMins = parseTimeToMinutes(srv.start_time)
    const endMins = parseTimeToMinutes(srv.end_time)

    if (startMins !== null && endMins !== null) {
      return currentMinutes >= startMins && currentMinutes <= endMins
    } else if (startMins !== null) {
      return currentMinutes >= startMins
    } else if (endMins !== null) {
      return currentMinutes <= endMins
    }
    return false
  }

  describe('1. Time Window Parsing & Active Service Detection', () => {
    it('correctly converts 24-hour time strings to total minutes from midnight', () => {
      expect(parseTimeToMinutes('08:00')).toBe(480)
      expect(parseTimeToMinutes('12:30')).toBe(750)
      expect(parseTimeToMinutes('23:59')).toBe(1439)
      expect(parseTimeToMinutes('00:00')).toBe(0)
      expect(parseTimeToMinutes('14:45:00')).toBe(885)
    })

    it('returns null for missing or invalid time strings', () => {
      expect(parseTimeToMinutes(null)).toBeNull()
      expect(parseTimeToMinutes(undefined)).toBeNull()
      expect(parseTimeToMinutes('')).toBeNull()
      expect(parseTimeToMinutes('invalid')).toBeNull()
    })

    it('marks service as active ONLY when current time is strictly within the time window', () => {
      const lunchService = { start_time: '12:00', end_time: '14:00', requires_scan: true }

      // 11:59 (719m) -> Not active
      expect(isServiceActive(lunchService, 719)).toBe(false)

      // 12:00 (720m) -> Active
      expect(isServiceActive(lunchService, 720)).toBe(true)

      // 13:00 (780m) -> Active
      expect(isServiceActive(lunchService, 780)).toBe(true)

      // 14:00 (840m) -> Active
      expect(isServiceActive(lunchService, 840)).toBe(true)

      // 14:01 (841m) -> Not active
      expect(isServiceActive(lunchService, 841)).toBe(false)
    })

    it('returns false for services without defined time windows', () => {
      const untimedService = { start_time: null, end_time: null, requires_scan: true }
      expect(isServiceActive(untimedService, 720)).toBe(false)
    })

    it('respects requires_scan = false flag', () => {
      const noScanService = { start_time: '08:00', end_time: '18:00', requires_scan: false }
      expect(isServiceActive(noScanService, 600)).toBe(false)
    })
  })

  describe('2. In-Memory Indexing & QR Resolution', () => {
    const mockRegistrations = [
      { id: 101, first_name: 'John', last_name: 'Doe', qr_code: 'CUSTOM-QR-101', event_id: 5 },
      { id: 102, first_name: 'Jane', last_name: 'Smith', qr_code: null, event_id: 5 },
    ]

    it('indexes registrations by QR code, raw ID, and REG code format', () => {
      const map = indexRegistrations(mockRegistrations)

      // By custom QR code
      expect(map.get('CUSTOM-QR-101')?.first_name).toBe('John')

      // By raw numeric ID
      expect(map.get('101')?.first_name).toBe('John')
      expect(map.get('102')?.first_name).toBe('Jane')

      // By standardized REG code
      expect(map.get('REG-5-101')?.first_name).toBe('John')
      expect(map.get('REG-5-102')?.first_name).toBe('Jane')
    })

    it('returns undefined for non-existent codes in constant time O(1)', () => {
      const map = indexRegistrations(mockRegistrations)
      expect(map.get('NON-EXISTENT')).toBeUndefined()
    })
  })

  describe('3. Attendance Check-in and Check-out Status Determination', () => {
    it('returns false when no scan logs exist for today', () => {
      expect(isAttendeeCheckedIn([])).toBe(false)
    })

    it('returns true when latest scan today is check_in', () => {
      const logs = [
        { scan_type: 'check_in', created_at: '2026-08-14T08:00:00Z' }
      ]
      expect(isAttendeeCheckedIn(logs)).toBe(true)
    })

    it('returns false when latest scan today is check_out', () => {
      const logs = [
        { scan_type: 'check_out', created_at: '2026-08-14T17:00:00Z' },
        { scan_type: 'check_in', created_at: '2026-08-14T08:00:00Z' }
      ]
      expect(isAttendeeCheckedIn(logs)).toBe(false)
    })

    it('returns true after re-entry check_in following check_out', () => {
      const logs = [
        { scan_type: 'check_in', created_at: '2026-08-14T18:30:00Z' }, // Re-entry
        { scan_type: 'check_out', created_at: '2026-08-14T17:00:00Z' },
        { scan_type: 'check_in', created_at: '2026-08-14T08:00:00Z' }
      ]
      expect(isAttendeeCheckedIn(logs)).toBe(true)
    })
  })

  describe('4. Badge Code Extraction & Cleaning', () => {
    function extractCode(rawUrlOrCode: string): string {
      let code = rawUrlOrCode.trim()
      if (code.includes('?code=')) {
        const parts = code.split('?code=')
        if (parts[1]) {
          code = decodeURIComponent(parts[1].split('&')[0])
        }
      }
      return code
    }

    it('extracts raw code from full URLs', () => {
      expect(extractCode('https://kongamano.org/scan?code=REG-2-00456')).toBe('REG-2-00456')
      expect(extractCode('http://192.168.1.50:3000/scan?code=REG-2-00456&event_id=2')).toBe('REG-2-00456')
      expect(extractCode('https://kongamano.org/scannings?code=REG-1-00001')).toBe('REG-1-00001')
    })

    it('preserves clean raw codes untouched', () => {
      expect(extractCode('REG-3-00099')).toBe('REG-3-00099')
      expect(extractCode('00099')).toBe('00099')
    })
  })
})
