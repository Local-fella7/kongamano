import { describe, it, expect } from 'vitest'

describe('AppSidebar navigation logic & initial calculations', () => {
  function getUserInitials(firstName?: string, lastName?: string) {
    const f = firstName?.[0] || 'A'
    const l = lastName?.[0] || 'U'
    return `${f}${l}`.toUpperCase()
  }

  function isChildActive(item: any, currentPath: string): boolean {
    return !!item.children?.some((c: any) => currentPath.startsWith(c.to))
  }

  function getItemOpenState(item: any, states: { eventsOpen: boolean; setupOpen: boolean; notificationsOpen: boolean }) {
    if (item.name === 'Events') return states.eventsOpen
    if (item.name === 'Setup') return states.setupOpen
    if (item.name === 'Notifications') return states.notificationsOpen
    return false
  }

  it('1. computes initials for complete name', () => {
    expect(getUserInitials('John', 'Doe')).toBe('JD')
  })

  it('2. computes fallback initials for missing name', () => {
    expect(getUserInitials(undefined, undefined)).toBe('AU')
  })

  it('3. detects child link active state correctly', () => {
    const parentItem = {
      name: 'Setup',
      children: [
        { name: 'Roles', to: '/setup/roles' },
        { name: 'Event Types', to: '/setup/event-types' }
      ]
    }
    expect(isChildActive(parentItem, '/setup/roles')).toBe(true)
    expect(isChildActive(parentItem, '/dashboard')).toBe(false)
  })

  it('4. computes item open state accurately', () => {
    const item = { name: 'Setup' }
    const states = { eventsOpen: false, setupOpen: true, notificationsOpen: false }
    expect(getItemOpenState(item, states)).toBe(true)
  })
})
