import { describe, it, expect } from 'vitest'

describe('Reports & Analytics Module Logic & Endpoints', () => {
  function buildReportUrl(endpoint: string, requiresEvent: boolean, selectedEventId?: number | string) {
    if (requiresEvent && selectedEventId) {
      const separator = endpoint.includes('?') ? '&' : '?'
      return `${endpoint}${separator}event_id=${selectedEventId}`
    }
    return endpoint
  }

  function getReportFilename(reportId: string, eventId?: number | string) {
    const eventSuffix = eventId ? `_Event_${eventId}` : ''
    return `Kongamano_${reportId}${eventSuffix}.pdf`
  }

  it('1. appends event_id parameter to event-specific report endpoint', () => {
    const url = buildReportUrl('/api/reports/event-summary/pdf', true, 5)
    expect(url).toBe('/api/reports/event-summary/pdf?event_id=5')
  })

  it('2. preserves global report endpoint without event_id parameter', () => {
    const url = buildReportUrl('/api/reports/events-catalog/pdf', false, 5)
    expect(url).toBe('/api/reports/events-catalog/pdf')
  })

  it('3. generates correct download filename for event-specific report', () => {
    const name = getReportFilename('payments-ledger', 12)
    expect(name).toBe('Kongamano_payments-ledger_Event_12.pdf')
  })

  it('4. generates correct download filename for global directory report', () => {
    const name = getReportFilename('agents-directory')
    expect(name).toBe('Kongamano_agents-directory.pdf')
  })
})
