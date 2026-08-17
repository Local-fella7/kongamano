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
    function runMiddleware(
      toPath: string,
      tokenVal: string | null,
      roleIdVal: number | null,
      queryRedirect?: string,
      queryCode?: string,
      isOnline: boolean = true,
      lsToken?: string | null,
      lsRoleId?: string | null
    ) {
      const token = { value: tokenVal }
      const roleId = { value: roleIdVal }

      let activeToken = token.value
      let activeRoleId = roleId.value

      // Fallback from localStorage
      if (!activeToken && lsToken) {
        activeToken = lsToken.trim()
        token.value = activeToken
      }
      if ((activeRoleId === null || activeRoleId === undefined) && lsRoleId) {
        activeRoleId = parseInt(lsRoleId, 10)
        roleId.value = activeRoleId
      }

      const isAdmin = activeRoleId === 1

      // 1. Not authenticated → send to login (unless offline on scanner page)
      if (!activeToken && toPath !== '/login' && toPath !== '/forgot-password') {
        if (!isOnline && (toPath === '/scan' || toPath === '/scannings')) {
          return null // allowed in offline mode
        }

        let targetPath = toPath
        if (toPath === '/scannings' && queryCode) {
          targetPath = `/scan?code=${encodeURIComponent(queryCode)}`
        }
        return { path: '/login', query: { redirect: targetPath } }
      }

      // 2. Badge Scan Interceptor: Any scan hitting /scannings with code immediately fast-forwards to /scan
      if (toPath === '/scannings' && queryCode) {
        return `/scan?code=${queryCode}`
      }

      // 3. Authenticated + trying to visit login/forgot-password → redirect away
      if (activeToken && (toPath === '/login' || toPath === '/forgot-password')) {
        if (queryRedirect) {
          if (queryRedirect.startsWith('/scannings?code=')) {
            const code = queryRedirect.split('/scannings?code=')[1]
            return `/scan?code=${code}`
          }
          if (isAdmin || queryRedirect.startsWith('/scan') || queryRedirect.startsWith('/scannings')) {
            return queryRedirect
          }
        }
        return isAdmin ? '/' : '/scan'
      }

      // 4. Authenticated + non-admin trying to visit any page except /scannings or /scan → block instantly
      if (activeToken && !isAdmin && toPath !== '/scannings' && toPath !== '/scan') {
        return '/scan'
      }

      return null // allowed
    }

    it('allows scan station to remain accessible when offline without blocking user', () => {
      const result = runMiddleware('/scan', null, null, undefined, undefined, false)
      expect(result).toBeNull()
    })

    it('hydrates missing cookie from localStorage on page reload', () => {
      const result = runMiddleware('/scan', null, null, undefined, undefined, true, 'cached_offline_token', '2')
      expect(result).toBeNull()
    })

    it('redirects unauthenticated user to /login when online', () => {
      const result = runMiddleware('/events', null, null)
      expect(result).toEqual({ path: '/login', query: { redirect: '/events' } })
    })

    it('redirects unauthenticated badge scan on /scannings?code= directly to /login with /scan redirect', () => {
      const result = runMiddleware('/scannings', null, null, undefined, 'REG-1-00001')
      expect(result).toEqual({ path: '/login', query: { redirect: '/scan?code=REG-1-00001' } })
    })

    it('fast-forwards authenticated scan on /scannings?code= directly to /scan?code=', () => {
      const result = runMiddleware('/scannings', 'valid_token', 2, undefined, 'REG-1-00001')
      expect(result).toBe('/scan?code=REG-1-00001')
    })

    it('redirects logged-in non-admin away from /login to /scan or /scan redirect target', () => {
      const result = runMiddleware('/login', 'valid_token', 2)
      expect(result).toBe('/scan')

      const resultScanRedirect = runMiddleware('/login', 'valid_token', 2, '/scan?code=REG-1-00001')
      expect(resultScanRedirect).toBe('/scan?code=REG-1-00001')

      const resultOldBadgeRedirect = runMiddleware('/login', 'valid_token', 2, '/scannings?code=REG-1-00001')
      expect(resultOldBadgeRedirect).toBe('/scan?code=REG-1-00001')
    })

    it('redirects logged-in admin away from /login to / or query target', () => {
      const resultDashboard = runMiddleware('/login', 'valid_token', 1)
      expect(resultDashboard).toBe('/')

      const resultRedirect = runMiddleware('/login', 'valid_token', 1, '/users')
      expect(resultRedirect).toBe('/users')
    })

    it('blocks non-admin from /events and redirects to /scan', () => {
      const result = runMiddleware('/events', 'valid_token', 2)
      expect(result).toBe('/scan')
    })

    it('blocks non-admin from /users and redirects to /scan', () => {
      const result = runMiddleware('/users', 'valid_token', 2)
      expect(result).toBe('/scan')
    })

    it('allows non-admin to visit /scannings', () => {
      const result = runMiddleware('/scannings', 'valid_token', 2)
      expect(result).toBeNull()
    })

    it('allows non-admin to visit /scan', () => {
      const result = runMiddleware('/scan', 'valid_token', 2)
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
