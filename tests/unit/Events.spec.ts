import { describe, it, expect } from 'vitest'

describe('Events Page Filtering & Status Badge Logic', () => {
  function getEventStatusBadge(event: { start_date?: string; end_date?: string; date_from?: string; date_to?: string }, now: Date) {
    const startStr = (event.start_date || event.date_from || '').replace(' ', 'T')
    const endStr = (event.end_date || event.date_to || '').replace(' ', 'T')
    const start = startStr ? new Date(startStr) : null
    const end = endStr ? new Date(endStr) : null

    if (end && !isNaN(end.getTime()) && now > end) {
      return { label: 'Completed', class: 'status-pill--completed' }
    }
    if (start && !isNaN(start.getTime()) && now < start) {
      return { label: 'Scheduled', class: 'status-pill--scheduled' }
    }
    return { label: 'Active', class: 'status-pill--active' }
  }

  function filterEvents(events: any[], status: string, eventTypeId: number | string, now: Date) {
    return events.filter(e => {
      if (status && getEventStatusBadge(e, now).label !== status) return false
      if (eventTypeId && Number(e.event_type_id) !== Number(eventTypeId)) return false
      return true
    })
  }

  const mockNow = new Date('2026-08-03')
  const events = [
    { id: 1, name: 'Future Event', start_date: '2026-09-01', end_date: '2026-09-05', event_type_id: 10 },
    { id: 2, name: 'Current Event', start_date: '2026-08-01', end_date: '2026-08-05', event_type_id: 10 },
    { id: 3, name: 'Past Event', start_date: '2026-07-01', end_date: '2026-07-05', event_type_id: 20 },
  ]

  it('1. correctly computes Scheduled status badge for future event', () => {
    const badge = getEventStatusBadge(events[0], mockNow)
    expect(badge.label).toBe('Scheduled')
  })

  it('2. correctly computes Active status badge for ongoing event', () => {
    const badge = getEventStatusBadge(events[1], mockNow)
    expect(badge.label).toBe('Active')
  })

  it('3. correctly computes Completed status badge for past event', () => {
    const badge = getEventStatusBadge(events[2], mockNow)
    expect(badge.label).toBe('Completed')
  })

  it('4. filters events by status', () => {
    const filtered = filterEvents(events, 'Active', '', mockNow)
    expect(filtered.length).toBe(1)
    expect(filtered[0].id).toBe(2)
  })

  it('5. filters events by event_type_id', () => {
    const filtered = filterEvents(events, '', 10, mockNow)
    expect(filtered.length).toBe(2)
  })

  it('6. filters events simultaneously by status and event_type_id', () => {
    const filtered = filterEvents(events, 'Scheduled', 10, mockNow)
    expect(filtered.length).toBe(1)
    expect(filtered[0].id).toBe(1)
  })

  it('7. returns empty list if no events match combined criteria', () => {
    const filtered = filterEvents(events, 'Completed', 10, mockNow)
    expect(filtered.length).toBe(0)
  })
})
