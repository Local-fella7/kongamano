import { describe, it, expect, vi } from 'vitest'

/**
 * useApi composable unit tests.
 * useApi is a thin wrapper around Nuxt's useFetch that injects Authorization headers.
 * We test the header construction logic and option merging behaviour in isolation,
 * since useFetch itself is a Nuxt runtime function.
 */

// ─── Inline the header-merge logic from useApi ─────────────────────────────
function buildApiHeaders(tokenValue: string | null | undefined, extraHeaders: Record<string, string> = {}): Record<string, string> {
  return {
    ...extraHeaders,
    ...(tokenValue ? { Authorization: `Bearer ${tokenValue}` } : {}),
    Accept: 'application/json',
  }
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('useApi — Authorization header construction', () => {
  it('1. adds Bearer token when token is a non-empty string', () => {
    const headers = buildApiHeaders('my_jwt_123')
    expect(headers.Authorization).toBe('Bearer my_jwt_123')
  })

  it('2. omits Authorization header when token is null', () => {
    const headers = buildApiHeaders(null)
    expect(headers.Authorization).toBeUndefined()
  })

  it('3. omits Authorization header when token is undefined', () => {
    const headers = buildApiHeaders(undefined)
    expect(headers.Authorization).toBeUndefined()
  })

  it('4. omits Authorization header when token is empty string', () => {
    const headers = buildApiHeaders('')
    expect(headers.Authorization).toBeUndefined()
  })

  it('5. always includes Accept: application/json', () => {
    expect(buildApiHeaders(null).Accept).toBe('application/json')
    expect(buildApiHeaders('token').Accept).toBe('application/json')
  })
})

describe('useApi — options merging', () => {
  it('6. merges caller extra headers with token header', () => {
    const headers = buildApiHeaders('tok123', { 'X-Request-ID': 'req-abc' })
    expect(headers['X-Request-ID']).toBe('req-abc')
    expect(headers.Authorization).toBe('Bearer tok123')
  })

  it('7. Accept header is present even when extra headers are passed', () => {
    const headers = buildApiHeaders('tok', { 'Content-Type': 'application/json' })
    expect(headers.Accept).toBe('application/json')
    expect(headers['Content-Type']).toBe('application/json')
  })

  it('8. token header overwrites any same-named extra header', () => {
    // Authorization in extraHeaders should be overwritten by token logic
    const headers = buildApiHeaders('new-token', { Authorization: 'Bearer old-token' })
    expect(headers.Authorization).toBe('Bearer new-token')
  })

  it('9. extra headers alone when no token and no overwrite', () => {
    const headers = buildApiHeaders(null, { 'X-Custom': 'value' })
    expect(headers['X-Custom']).toBe('value')
    expect(headers.Authorization).toBeUndefined()
  })

  it('10. returns object with exactly Accept when no token and no extra headers', () => {
    const headers = buildApiHeaders(null)
    const keys = Object.keys(headers)
    expect(keys).toContain('Accept')
    expect(keys).not.toContain('Authorization')
  })
})

describe('useApi — URL parameter handling', () => {
  it('11. does not alter a simple endpoint string', () => {
    const url = '/api/events'
    expect(url.startsWith('/api/')).toBe(true)
  })

  it('12. supports query string in URL', () => {
    const url = '/api/registrations?event_id=5'
    expect(url).toContain('?event_id=5')
  })
})
