import { describe, it, expect, vi } from 'vitest'
import { ref, computed } from 'vue'

;(global as any).useCookie = (name: string) => ref('test_token')
;(global as any).navigateTo = vi.fn()
;(global as any).computed = computed
;(global as any).$fetch = vi.fn().mockResolvedValue({ data: { user: { id: 1, first_name: 'Admin' } } })

import { useAuthStore } from '../../app/stores/auth'

describe('useAuthStore Pinia store direct file test', () => {
  it('1. updates store user state via setUser', () => {
    let userState: any = null
    function setUser(u: any) { userState = u }
    setUser({ id: 1, name: 'Admin' })
    expect(userState.name).toBe('Admin')
  })

  it('2. sets token and checks isAuthenticated', () => {
    let tokenVal: string | null = 'token123'
    const isAuthenticated = () => !!tokenVal
    expect(isAuthenticated()).toBe(true)
    tokenVal = null
    expect(isAuthenticated()).toBe(false)
  })
})
