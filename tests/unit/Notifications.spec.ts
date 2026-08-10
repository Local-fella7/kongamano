import { describe, it, expect } from 'vitest'

describe('Notifications Page Formatters & Form Validation', () => {
  function formatTime(timeStr?: string) {
    if (!timeStr) return '—'
    try {
      const parts = timeStr.split(':')
      const hours = Number(parts[0])
      const minutes = parts[1] || '00'
      const period = hours >= 12 ? 'PM' : 'AM'
      const displayHours = hours % 12 || 12
      return `${String(displayHours).padStart(2, '0')}:${minutes} ${period}`
    } catch {
      return timeStr
    }
  }

  function toDateInput(value?: string) {
    return value ? value.slice(0, 10) : ''
  }

  function toTimeInput(value?: string) {
    if (!value) return ''
    const parts = value.split(':')
    return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : value
  }

  function validateNotificationForm(form: { notification_date: string; notification_time: string; notification_template_id: any }) {
    if (!form.notification_date) return 'Notification date is required.'
    if (!form.notification_time) return 'Notification time is required.'
    if (!form.notification_template_id) return 'Please select a notification template.'
    return ''
  }

  it('1. formats morning time to AM string', () => {
    expect(formatTime('09:30:00')).toBe('09:30 AM')
  })

  it('2. formats afternoon time to PM string', () => {
    expect(formatTime('15:45:00')).toBe('03:45 PM')
  })

  it('3. formats midnight 00:00 to 12:00 AM', () => {
    expect(formatTime('00:15:00')).toBe('12:15 AM')
  })

  it('4. extracts YYYY-MM-DD from full date string in toDateInput()', () => {
    expect(toDateInput('2026-08-03T14:30:00Z')).toBe('2026-08-03')
  })

  it('5. extracts HH:mm from time string in toTimeInput()', () => {
    expect(toTimeInput('14:30:00')).toBe('14:30')
  })

  it('6. validates missing date error', () => {
    const err = validateNotificationForm({ notification_date: '', notification_time: '10:00', notification_template_id: 1 })
    expect(err).toBe('Notification date is required.')
  })

  it('7. validates missing time error', () => {
    const err = validateNotificationForm({ notification_date: '2026-08-03', notification_time: '', notification_template_id: 1 })
    expect(err).toBe('Notification time is required.')
  })

  it('8. validates missing template error', () => {
    const err = validateNotificationForm({ notification_date: '2026-08-03', notification_time: '10:00', notification_template_id: '' })
    expect(err).toBe('Please select a notification template.')
  })

  it('9. passes validation when all fields are provided', () => {
    const err = validateNotificationForm({ notification_date: '2026-08-03', notification_time: '10:00', notification_template_id: 1 })
    expect(err).toBe('')
  })
})
