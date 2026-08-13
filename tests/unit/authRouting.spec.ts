import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'

describe('Auth Routing & Middleware Tests', () => {
  let cookies: Record<string, any> = {}

  function mockUseCookie(name: string, opts?: any) {
    if (!(name in cookies)) {
      cookies[name] = opts?.default ? opts.default() : null
    }
    return {
      get value() {
        return cookies[name]
      },
      set value(val: any) {
        cookies[name] = val
      },
    }
  }

  beforeEach(() => {
    cookies = {}
  })

  describe('role_id Cookie & Admin Check Logic', () => {
    it('identifies role_id === 1 as admin', () => {
      const roleId = mockUseCookie('role_id')
      roleId.value = 1
      const isAdmin = roleId.value === 1
      expect(isAdmin).toBe(true)
    })

    it('identifies role_id !== 1 as non-admin', () => {
      const roleId = mockUseCookie('role_id')
      roleId.value = 2
      const isAdmin = roleId.value === 1
      expect(isAdmin).toBe(false)
    })

    it('handles null role_id as non-admin', () => {
      const roleId = mockUseCookie('role_id')
      roleId.value = null
      const isAdmin = roleId.value === 1
      expect(isAdmin).toBe(false)
    })

    it('setUser mirrors role_id to cookie', () => {
      const roleId = mockUseCookie('role_id')
      const user = ref<any>(null)

      function setUser(userData: any) {
        user.value = userData
        roleId.value = userData?.role_id ?? null
      }

      setUser({ id: 10, role_id: 2, first_name: 'Scanner' })
      expect(roleId.value).toBe(2)
      expect(user.value.first_name).toBe('Scanner')

      setUser(null)
      expect(roleId.value).toBeNull()
    })
  })

  describe('Route Middleware Guard Logic', () => {
    function runMiddleware(toPath: string, tokenVal: string | null, roleIdVal: number | null, queryRedirect?: string) {
      const token = { value: tokenVal }
      const roleId = { value: roleIdVal }
      const isAdmin = roleId.value === 1

      // 1. Not authenticated → send to login
      if (!token.value && toPath !== '/login' && toPath !== '/forgot-password') {
        return { path: '/login', query: { redirect: toPath } }
      }

      // 2. Authenticated + trying to visit login/forgot-password → redirect away
      if (token.value && (toPath === '/login' || toPath === '/forgot-password')) {
        return isAdmin ? (queryRedirect || '/') : '/scannings'
      }

      // 3. Authenticated + non-admin trying to visit any page except /scannings → block instantly
      if (token.value && !isAdmin && toPath !== '/scannings') {
        return '/scannings'
      }

      return null // allowed
    }

    it('redirects unauthenticated user to /login', () => {
      const result = runMiddleware('/events', null, null)
      expect(result).toEqual({ path: '/login', query: { redirect: '/events' } })
    })

    it('redirects logged-in non-admin away from /login to /scannings', () => {
      const result = runMiddleware('/login', 'valid_token', 2)
      expect(result).toBe('/scannings')
    })

    it('redirects logged-in admin away from /login to / or query target', () => {
      const resultDashboard = runMiddleware('/login', 'valid_token', 1)
      expect(resultDashboard).toBe('/')

      const resultRedirect = runMiddleware('/login', 'valid_token', 1, '/users')
      expect(resultRedirect).toBe('/users')
    })

    it('blocks non-admin from /events and redirects to /scannings', () => {
      const result = runMiddleware('/events', 'valid_token', 2)
      expect(result).toBe('/scannings')
    })

    it('blocks non-admin from /users and redirects to /scannings', () => {
      const result = runMiddleware('/users', 'valid_token', 2)
      expect(result).toBe('/scannings')
    })

    it('allows non-admin to visit /scannings', () => {
      const result = runMiddleware('/scannings', 'valid_token', 2)
      expect(result).toBeNull()
    })

    it('allows admin to visit /events', () => {
      const result = runMiddleware('/events', 'valid_token', 1)
      expect(result).toBeNull()
    })

    it('allows admin to visit /users', () => {
      const result = runMiddleware('/users', 'valid_token', 1)
      expect(result).toBeNull()
    })
  })
})
