import { describe, it, expect } from 'vitest'

describe('Profile Page Initials & Role Pill Computation', () => {
  function getInitials(profile: { first_name?: string; last_name?: string } | null) {
    if (!profile) return 'U'
    const f = profile.first_name?.[0] || ''
    const l = profile.last_name?.[0] || ''
    return `${f}${l}`.toUpperCase() || 'U'
  }

  function getRolePillText(profile: { role?: string; role_id?: number }) {
    if (profile.role) return profile.role
    if (profile.role_id) return `Role #${profile.role_id}`
    return 'System User'
  }

  it('1. computes initials for complete profile', () => {
    expect(getInitials({ first_name: 'John', last_name: 'Doe' })).toBe('JD')
  })

  it('2. returns U when profile is null', () => {
    expect(getInitials(null)).toBe('U')
  })

  it('3. uses profile role name if available', () => {
    expect(getRolePillText({ role: 'Super Admin', role_id: 1 })).toBe('Super Admin')
  })

  it('4. falls back to role ID string if role name is missing', () => {
    expect(getRolePillText({ role_id: 2 })).toBe('Role #2')
  })

  it('5. falls back to System User if both role and role_id are missing', () => {
    expect(getRolePillText({})).toBe('System User')
  })
})
