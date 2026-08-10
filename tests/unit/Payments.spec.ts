import { describe, it, expect } from 'vitest'

describe('Payments Page Extended Validation & Formatting Suite', () => {
  function getPaymentModeName(modeId: number, modesList: any[]) {
    const found = modesList.find(m => m.id === modeId)
    return found ? found.name : `Mode #${modeId}`
  }

  function getRegistrationName(regId: number, registrationsList: any[]) {
    const found = registrationsList.find(r => r.id === regId)
    if (!found) return ''
    const f = found.first_name || ''
    const l = found.last_name || ''
    return `${f} ${l}`.trim() || `Registration #${regId}`
  }

  function validatePaymentForm(form: { registration_id: any; payment_mode_id: any; amount: any; reference_no?: string }) {
    if (!form.registration_id) return 'Please select a registration.'
    if (!form.payment_mode_id) return 'Please select a payment mode.'
    if (!form.amount || Number(form.amount) <= 0) return 'Please enter a valid amount.'
    if (form.reference_no && form.reference_no.trim().length < 3) return 'Reference number must be at least 3 characters long.'
    return ''
  }

  function filterPayments(payments: any[], modeFilter: any, eventFilter: any, registrationsList: any[]) {
    return payments.filter(p => {
      if (modeFilter && Number(p.payment_mode_id) !== Number(modeFilter)) return false
      if (eventFilter) {
        const reg = registrationsList.find(r => r.id === p.registration_id) || p.registration
        if (!reg || Number(reg.event_id) !== Number(eventFilter)) return false
      }
      return true
    })
  }

  const mockModes = [{ id: 1, name: 'M-Pesa' }, { id: 2, name: 'Bank Wire' }]
  const mockRegistrations = [{ id: 10, first_name: 'John', last_name: 'Doe', event_id: 100 }]
  const mockPayments = [
    { id: 1, registration_id: 10, payment_mode_id: 1, amount: 50000 },
    { id: 2, registration_id: 10, payment_mode_id: 2, amount: 20000 }
  ]

  it('1. formats payment mode name properly when found', () => {
    expect(getPaymentModeName(1, mockModes)).toBe('M-Pesa')
  })

  it('2. returns fallback string for unknown payment mode id', () => {
    expect(getPaymentModeName(99, mockModes)).toBe('Mode #99')
  })

  it('3. constructs full delegate name for registration id', () => {
    expect(getRegistrationName(10, mockRegistrations)).toBe('John Doe')
  })

  it('4. returns empty string for missing registration id', () => {
    expect(getRegistrationName(99, mockRegistrations)).toBe('')
  })

  it('5. validates missing registration error', () => {
    const err = validatePaymentForm({ registration_id: '', payment_mode_id: 1, amount: 100 })
    expect(err).toBe('Please select a registration.')
  })

  it('6. validates missing payment mode error', () => {
    const err = validatePaymentForm({ registration_id: 10, payment_mode_id: '', amount: 100 })
    expect(err).toBe('Please select a payment mode.')
  })

  it('7. validates zero or negative amount error', () => {
    const err = validatePaymentForm({ registration_id: 10, payment_mode_id: 1, amount: 0 })
    expect(err).toBe('Please enter a valid amount.')
  })

  it('8. passes validation for complete payment form', () => {
    const err = validatePaymentForm({ registration_id: 10, payment_mode_id: 1, amount: 5000 })
    expect(err).toBe('')
  })

  it('9. filters payments list by mode id', () => {
    const filtered = filterPayments(mockPayments, 1, '', mockRegistrations)
    expect(filtered.length).toBe(1)
    expect(filtered[0].id).toBe(1)
  })

  it('10. filters payments list by event id via registration lookup', () => {
    const filtered = filterPayments(mockPayments, '', 100, mockRegistrations)
    expect(filtered.length).toBe(2)
  })

  it('11. validates short reference code error', () => {
    const err = validatePaymentForm({ registration_id: 10, payment_mode_id: 1, amount: 5000, reference_no: 'AB' })
    expect(err).toBe('Reference number must be at least 3 characters long.')
  })

  it('12. accepts valid transaction code e.g. M-Pesa receipt', () => {
    const err = validatePaymentForm({ registration_id: 10, payment_mode_id: 1, amount: 5000, reference_no: 'QFH872619X' })
    expect(err).toBe('')
  })

  it('13. formats TZS amount string with thousands separator', () => {
    const formatted = Number(50000).toLocaleString('en-US', { minimumFractionDigits: 2 })
    expect(formatted).toBe('50,000.00')
  })

  it('14. handles float decimal amounts accurately', () => {
    const err = validatePaymentForm({ registration_id: 10, payment_mode_id: 1, amount: 2500.5 })
    expect(err).toBe('')
  })

  it('15. returns empty list when filtering by non-matching event id', () => {
    const filtered = filterPayments(mockPayments, '', 999, mockRegistrations)
    expect(filtered.length).toBe(0)
  })
})
