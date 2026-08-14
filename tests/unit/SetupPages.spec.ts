import { describe, it, expect } from 'vitest'

describe('Setup System Pages Form & Payload Validation', () => {
  function validateSimpleNameForm(name: string, entityLabel: string) {
    if (!name.trim()) return `${entityLabel} name is required.`
    return ''
  }

  function validateServiceForm(form: { name: string; cost?: any }) {
    if (!form.name.trim()) return 'Service name is required.'
    if (form.cost !== undefined && form.cost !== '' && Number(form.cost) < 0) return 'Cost cannot be negative.'
    return ''
  }

  function validateAccommodationForm(form: { name: string; capacity?: any }) {
    if (!form.name.trim()) return 'Accommodation name is required.'
    if (form.capacity !== undefined && form.capacity !== '' && Number(form.capacity) <= 0) return 'Capacity must be greater than zero.'
    return ''
  }

  function validateNotificationTemplateForm(form: { name: string; title: string; content?: string }) {
    if (!form.name.trim() || !form.title.trim() || !form.content?.trim()) {
      return 'Name, title, and content are all required.'
    }
    return ''
  }

  it('1. validates empty role name error', () => {
    expect(validateSimpleNameForm('', 'Role')).toBe('Role name is required.')
  })

  it('2. passes valid role name', () => {
    expect(validateSimpleNameForm('Admin', 'Role')).toBe('')
  })

  it('3. validates empty event type name error', () => {
    expect(validateSimpleNameForm('', 'Event type')).toBe('Event type name is required.')
  })

  it('4. validates negative cost in service form', () => {
    expect(validateServiceForm({ name: 'VIP Lunch', cost: -100 })).toBe('Cost cannot be negative.')
  })

  it('5. passes valid service form', () => {
    expect(validateServiceForm({ name: 'VIP Lunch', cost: 5000 })).toBe('')
  })

  it('6. validates invalid capacity in accommodation form', () => {
    expect(validateAccommodationForm({ name: 'Deluxe Room', capacity: 0 })).toBe('Capacity must be greater than zero.')
  })

  it('7. passes valid accommodation form', () => {
    expect(validateAccommodationForm({ name: 'Deluxe Room', capacity: 4 })).toBe('')
  })

  it('8. validates missing content in notification template form', () => {
    expect(validateNotificationTemplateForm({ name: 'welcome', title: 'Welcome', content: '' })).toBe('Name, title, and content are all required.')
  })

  it('9. passes valid notification template form with content', () => {
    expect(validateNotificationTemplateForm({ name: 'welcome', title: 'Welcome', content: 'Hello {{first_name}}' })).toBe('')
  })
})
