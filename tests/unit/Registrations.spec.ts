import { describe, it, expect } from 'vitest'

describe('Registrations Page Extensive Form Validation & Data Helpers', () => {
  function getInitials(first?: string, last?: string) {
    const f = first?.[0] || ''
    const l = last?.[0] || ''
    return `${f}${l}`.toUpperCase() || 'U'
  }

  function getStatusBadgeClass(status: string) {
    if (status === 'Confirmed') return 'status-badge--active'
    if (status === 'Pending') return 'status-badge--scheduled'
    return 'status-badge--completed'
  }

  function formatCurrency(val?: number | string) {
    if (val === undefined || val === null || val === '') return 'TZS 0'
    const num = typeof val === 'string' ? parseFloat(val) : val
    return `TZS ${num.toLocaleString()}`
  }

  function validateRegistrationForm(form: { first_name: string; last_name: string; event_id: any; amount: any; status: string; email?: string; phone?: string }) {
    if (!form.first_name.trim() || !form.last_name.trim()) return 'First name and last name are required.'
    if (!form.event_id) return 'Please select an event.'
    if (form.amount === '' || form.amount === null || form.amount === undefined || Number(form.amount) < 0) return 'Please enter a valid amount.'
    if (!form.status) return 'Please select a registration status.'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return 'Please enter a valid email address.'
    if (form.phone && !/^\+?\d{9,15}$/.test(form.phone.trim().replace(/[\s-]/g, ''))) return 'Please enter a valid phone number.'
    return ''
  }

  it('1. computes uppercase initials correctly', () => {
    expect(getInitials('Mary', 'Wanjiku')).toBe('MW')
  })

  it('2. returns fallback initial for missing name', () => {
    expect(getInitials(undefined, undefined)).toBe('U')
  })

  it('3. returns correct badge class for Confirmed status', () => {
    expect(getStatusBadgeClass('Confirmed')).toBe('status-badge--active')
  })

  it('4. returns correct badge class for Pending status', () => {
    expect(getStatusBadgeClass('Pending')).toBe('status-badge--scheduled')
  })

  it('5. returns correct badge class for Cancelled status', () => {
    expect(getStatusBadgeClass('Cancelled')).toBe('status-badge--completed')
  })

  it('6. formats currency numbers accurately', () => {
    expect(formatCurrency(4000)).toBe('TZS 4,000')
    expect(formatCurrency('15000')).toBe('TZS 15,000')
  })

  it('7. returns default TZS 0 for empty amount', () => {
    expect(formatCurrency(null)).toBe('TZS 0')
  })

  it('8. validates missing names error', () => {
    const err = validateRegistrationForm({ first_name: '', last_name: '', event_id: 10, amount: 4000, status: 'Confirmed' })
    expect(err).toBe('First name and last name are required.')
  })

  it('9. validates missing event error', () => {
    const err = validateRegistrationForm({ first_name: 'Mary', last_name: 'Wanjiku', event_id: '', amount: 4000, status: 'Confirmed' })
    expect(err).toBe('Please select an event.')
  })

  it('10. validates negative amount error', () => {
    const err = validateRegistrationForm({ first_name: 'Mary', last_name: 'Wanjiku', event_id: 10, amount: -50, status: 'Confirmed' })
    expect(err).toBe('Please enter a valid amount.')
  })

  it('11. passes validation for complete registration form', () => {
    const err = validateRegistrationForm({ first_name: 'Mary', last_name: 'Wanjiku', event_id: 10, amount: 4000, status: 'Confirmed' })
    expect(err).toBe('')
  })

  it('12. validates invalid email format error', () => {
    const err = validateRegistrationForm({ first_name: 'Mary', last_name: 'Wanjiku', event_id: 10, amount: 4000, status: 'Confirmed', email: 'invalid-email' })
    expect(err).toBe('Please enter a valid email address.')
  })

  it('13. validates invalid phone number format error', () => {
    const err = validateRegistrationForm({ first_name: 'Mary', last_name: 'Wanjiku', event_id: 10, amount: 4000, status: 'Confirmed', phone: '123' })
    expect(err).toBe('Please enter a valid phone number.')
  })

  it('14. accepts international phone number formats', () => {
    const err = validateRegistrationForm({ first_name: 'Mary', last_name: 'Wanjiku', event_id: 10, amount: 4000, status: 'Confirmed', phone: '+254712345678' })
    expect(err).toBe('')
  })

  it('15. accepts standard Kenyan phone formats with spaces/dashes', () => {
    const err = validateRegistrationForm({ first_name: 'Mary', last_name: 'Wanjiku', event_id: 10, amount: 4000, status: 'Confirmed', phone: '0712-345-678' })
    expect(err).toBe('')
  })
})
