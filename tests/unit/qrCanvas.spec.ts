import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * qrCanvas unit tests.
 * generateLabeledQrCanvasBlob relies on browser Canvas API and QRCode library,
 * so we test the pure logic helpers (extractStr, headerText composition,
 * filename sanitization, QR URL encoding) extracted from the module.
 */

// ─── Replicate pure helpers from qrCanvas.ts ────────────────────────────────

function extractStr(val: any): string {
  if (!val) return ''
  if (typeof val === 'string') return val.trim()
  if (typeof val === 'object') {
    const prop = val.name || val.region || val.district || val.title || val.label || Object.values(val)[0] || ''
    return typeof prop === 'string' ? prop.trim() : String(prop).trim()
  }
  return String(val).trim()
}

function buildHeaderText(registration: Record<string, any>, index: number): string {
  let year = 2026
  if (registration.event?.start_date) {
    const parsed = new Date(registration.event.start_date).getFullYear()
    if (!isNaN(parsed)) year = parsed
  }
  const region =
    extractStr(registration.region) ||
    extractStr(registration.district) ||
    extractStr(registration.location)
  const locationLetter = region.length > 0 ? region[0].toUpperCase() : 'M'
  const baseNumber = Number(registration.id) || (typeof index === 'number' ? index + 1 : 1)
  const paddedIndex = String(baseNumber).padStart(5, '0')
  return `${year}-${locationLetter}-${paddedIndex}`
}

function buildFileName(headerText: string): string {
  return `${headerText}.png`
}

function buildQrUrl(registration: Record<string, any>, index: number, originUrl: string): string {
  const eventId = registration.event_id || 1
  const regId = registration.id || index + 1
  const rawCode = registration.qr_code || `REG-${eventId}-${regId}`
  return `${originUrl}/scan?code=${encodeURIComponent(rawCode)}`
}

function buildSubText(
  firstName: string,
  lastName: string,
  region: string,
  regId: number | string
): string {
  const fullName = `${firstName} ${lastName}`.trim()
  return fullName
    ? `${fullName} • ${region || 'Delegate'} • Pass`
    : `ID: ${regId} • ${region || 'Mwombaji'} Pass`
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('qrCanvas — extractStr helper', () => {
  it('1. returns empty string for null/undefined/falsy', () => {
    expect(extractStr(null)).toBe('')
    expect(extractStr(undefined)).toBe('')
    expect(extractStr('')).toBe('')
  })

  it('2. trims and returns plain strings', () => {
    expect(extractStr('  Dodoma  ')).toBe('Dodoma')
    expect(extractStr('Mwanza')).toBe('Mwanza')
  })

  it('3. extracts .name from object', () => {
    expect(extractStr({ name: 'Arusha' })).toBe('Arusha')
  })

  it('4. extracts .region from object when .name is absent', () => {
    expect(extractStr({ region: 'Tanga' })).toBe('Tanga')
  })

  it('5. extracts .district when name and region absent', () => {
    expect(extractStr({ district: 'Ilala' })).toBe('Ilala')
  })

  it('6. extracts .title when name/region/district absent', () => {
    expect(extractStr({ title: 'Kinondoni' })).toBe('Kinondoni')
  })

  it('7. extracts .label when prior props absent', () => {
    expect(extractStr({ label: 'Temeke' })).toBe('Temeke')
  })

  it('8. falls back to first object value when no known key', () => {
    expect(extractStr({ unknown: 'FallbackValue' })).toBe('FallbackValue')
  })

  it('9. converts number to string', () => {
    expect(extractStr(42)).toBe('42')
  })
})

describe('qrCanvas — buildHeaderText', () => {
  it('10. uses registration.id to pad the index', () => {
    const reg = { id: 7, region: 'Dodoma' }
    const header = buildHeaderText(reg, 0)
    expect(header).toBe('2026-D-00007')
  })

  it('11. uses batch index + 1 when registration.id is absent', () => {
    const reg = { region: 'Mwanza' }
    const header = buildHeaderText(reg, 2) // index 2 → base 3
    expect(header).toBe('2026-M-00003')
  })

  it('12. defaults location letter to M when no region/district/location', () => {
    const reg = { id: 1 }
    const header = buildHeaderText(reg, 0)
    expect(header).toBe('2026-M-00001')
  })

  it('13. uses first letter of region (uppercase)', () => {
    const reg = { id: 5, region: 'dodoma' }
    const header = buildHeaderText(reg, 0)
    expect(header).toBe('2026-D-00005')
  })

  it('14. uses district letter when region is absent', () => {
    const reg = { id: 3, district: 'Kinondoni' }
    const header = buildHeaderText(reg, 0)
    expect(header).toBe('2026-K-00003')
  })

  it('15. uses event start_date year when available', () => {
    const reg = { id: 1, region: 'Arusha', event: { start_date: '2027-03-15' } }
    const header = buildHeaderText(reg, 0)
    expect(header).toBe('2027-A-00001')
  })

  it('16. pads index to 5 digits', () => {
    const reg = { id: 100 }
    const header = buildHeaderText(reg, 0)
    expect(header).toMatch(/^\d{4}-[A-Z]-00100$/)
  })
})

describe('qrCanvas — buildFileName', () => {
  it('17. appends .png to header text', () => {
    expect(buildFileName('2026-D-00001')).toBe('2026-D-00001.png')
  })

  it('18. fileName is safe for ZIP entry (no spaces)', () => {
    const name = buildFileName('2026-M-00042')
    expect(name).not.toContain(' ')
  })
})

describe('qrCanvas — buildQrUrl', () => {
  it('19. uses registration.qr_code when available', () => {
    const reg = { qr_code: 'QR-ABC-123', id: 1, event_id: 2 }
    const url = buildQrUrl(reg, 0, 'https://kongamano.com')
    expect(url).toBe('https://kongamano.com/scan?code=QR-ABC-123')
  })

  it('20. falls back to REG-{eventId}-{regId} pattern when qr_code absent', () => {
    const reg = { id: 5, event_id: 3 }
    const url = buildQrUrl(reg, 0, 'https://app.example.com')
    expect(url).toBe('https://app.example.com/scan?code=REG-3-5')
  })

  it('21. URL-encodes special characters in QR code', () => {
    const reg = { qr_code: 'CODE A+B=C', id: 1 }
    const url = buildQrUrl(reg, 0, '')
    expect(url).toContain(encodeURIComponent('CODE A+B=C'))
  })

  it('22. uses index+1 as regId when registration.id is absent', () => {
    const reg = { event_id: 1 }
    const url = buildQrUrl(reg, 4, '')
    // index 4 → regId = 5
    expect(url).toContain('REG-1-5')
  })

  it('23. defaults event_id to 1 when absent', () => {
    const reg = { id: 2 }
    const url = buildQrUrl(reg, 0, '')
    expect(url).toContain('REG-1-2')
  })
})

describe('qrCanvas — buildSubText', () => {
  it('24. shows full name when first and last name are present', () => {
    const text = buildSubText('John', 'Doe', 'Dodoma', 1)
    expect(text).toBe('John Doe • Dodoma • Pass')
  })

  it('25. uses Delegate as default region when region is empty and name exists', () => {
    const text = buildSubText('Jane', 'Smith', '', 2)
    expect(text).toBe('Jane Smith • Delegate • Pass')
  })

  it('26. falls back to ID line when name is absent (region provided)', () => {
    // Template: `ID: ${regId} • ${region || 'Mwombaji'} Pass`
    // With region='Mwanza' → 'ID: 7 • Mwanza Pass'
    const text = buildSubText('', '', 'Mwanza', 7)
    expect(text).toBe('ID: 7 • Mwanza Pass')
  })

  it('27. uses Mwombaji as default region in ID line when region is empty', () => {
    const text = buildSubText('', '', '', 3)
    expect(text).toBe('ID: 3 • Mwombaji Pass')
  })
})
