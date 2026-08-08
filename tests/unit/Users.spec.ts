import { describe, it, expect } from 'vitest'

describe('Users Page Validation & Role Mapping', () => {
  function getInitials(user: { first_name?: string; last_name?: string }) {
    const f = user.first_name?.[0] || 'U'
    const l = user.last_name?.[0] || ''
    return `${f}${l}`.toUpperCase()
  }

  function getRoleName(roleId: number, roles: { id: number; name: string }[]) {
    return roles.find(role => role.id === roleId)?.name || '—'
  }

  function validateUserForm(form: { first_name: string; last_name: string; username: string; mobile: string; pin: string; role_id: any }, isEditing: boolean) {
    const errs: Record<string, string> = {}
    if (!form.first_name.trim()) errs.first_name = 'First name is required.'
    if (!form.last_name.trim()) errs.last_name = 'Last name is required.'
    if (!form.username.trim()) errs.username = 'Username is required.'
    if (!form.mobile.trim()) errs.mobile = 'Mobile number is required.'
    if (!isEditing && !form.pin.trim()) errs.pin = 'PIN is required for new users.'
    if (!form.role_id) errs.role_id = 'Please select a role.'
    return { isValid: Object.keys(errs).length === 0, errs }
  }

  const mockRoles = [{ id: 1, name: 'Super Admin' }, { id: 2, name: 'Agent' }]

  it('1. computes initials for user with first and last name', () => {
    expect(getInitials({ first_name: 'Bryson', last_name: 'Mmari' })).toBe('BM')
  })

  it('2. returns fallback initial for user with missing first name', () => {
    expect(getInitials({ first_name: '', last_name: '' })).toBe('U')
  })

  it('3. resolves role name accurately from roles list', () => {
    expect(getRoleName(1, mockRoles)).toBe('Super Admin')
  })

  it('4. returns fallback dash for non-existent role id', () => {
    expect(getRoleName(99, mockRoles)).toBe('—')
  })

  it('5. validates PIN is required when creating a new user', () => {
    const res = validateUserForm({ first_name: 'Bryson', last_name: 'Mmari', username: 'bry', mobile: '0769032050', pin: '', role_id: 1 }, false)
    expect(res.isValid).toBe(false)
    expect(res.errs.pin).toBe('PIN is required for new users.')
  })

  it('6. allows empty PIN when editing existing user', () => {
    const res = validateUserForm({ first_name: 'Bryson', last_name: 'Mmari', username: 'bry', mobile: '0769032050', pin: '', role_id: 1 }, true)
    expect(res.isValid).toBe(true)
  })

  it('7. validates missing required fields error messages', () => {
    const res = validateUserForm({ first_name: '', last_name: '', username: '', mobile: '', pin: '', role_id: '' }, false)
    expect(res.isValid).toBe(false)
    expect(res.errs.first_name).toBe('First name is required.')
    expect(res.errs.last_name).toBe('Last name is required.')
    expect(res.errs.username).toBe('Username is required.')
    expect(res.errs.mobile).toBe('Mobile number is required.')
    expect(res.errs.role_id).toBe('Please select a role.')
  })
})
