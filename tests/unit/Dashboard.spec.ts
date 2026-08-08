import { describe, it, expect } from 'vitest'

describe('Dashboard Page Statistics & Analytics Calculations', () => {
  function updateGreeting(hour: number) {
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  function calculateActiveEventsCount(events: any[], now: Date) {
    return events.filter(e => {
      const endStr = (e.date_to || e.end_date || '').replace(' ', 'T')
      const end = endStr ? new Date(endStr) : null
      return !end || isNaN(end.getTime()) || now <= end
    }).length
  }

  function calculateTotalRevenue(payments: any[]) {
    return payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  }

  function calculateGenderBreakdown(registrations: any[]) {
    let male = 0, female = 0, unspecified = 0
    registrations.forEach(r => {
      const g = (r.gender || '').trim().toLowerCase()
      if (g === 'male' || g === 'm') male++
      else if (g === 'female' || g === 'f') female++
      else unspecified++
    })
    return { male, female, unspecified }
  }

  it('1. computes morning greeting correctly', () => {
    expect(updateGreeting(9)).toBe('Good morning')
  })

  it('2. computes afternoon greeting correctly', () => {
    expect(updateGreeting(14)).toBe('Good afternoon')
  })

  it('3. computes evening greeting correctly', () => {
    expect(updateGreeting(19)).toBe('Good evening')
  })

  it('4. computes total revenue sum from payments array accurately', () => {
    const payments = [{ amount: '1000' }, { amount: 2500 }, { amount: null }]
    expect(calculateTotalRevenue(payments)).toBe(3500)
  })

  it('5. filters active events accurately based on target date', () => {
    const now = new Date('2026-08-03')
    const events = [
      { id: 1, end_date: '2026-08-10' },
      { id: 2, end_date: '2026-07-01' }
    ]
    expect(calculateActiveEventsCount(events, now)).toBe(1)
  })

  it('6. calculates gender ratio breakdown correctly', () => {
    const regs = [
      { gender: 'Male' },
      { gender: 'm' },
      { gender: 'Female' },
      { gender: '' }
    ]
    const breakdown = calculateGenderBreakdown(regs)
    expect(breakdown.male).toBe(2)
    expect(breakdown.female).toBe(1)
    expect(breakdown.unspecified).toBe(1)
  })
})
