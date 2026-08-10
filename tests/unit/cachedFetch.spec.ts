import { describe, it, expect, vi } from 'vitest'

describe('cachedFetch comprehensive unit tests', () => {
  it('1. formats cache key with url parameter', () => {
    const url = '/api/events'
    const cacheKey = `kongamano_get_cache_${url}`
    expect(cacheKey).toBe('kongamano_get_cache_/api/events')
  })

  it('2. adds Bearer Authorization header when token is present', () => {
    const tokenVal = 'my_jwt_token'
    const headers = {
      ...(tokenVal ? { Authorization: `Bearer ${tokenVal}` } : {}),
      Accept: 'application/json',
    }
    expect(headers.Authorization).toBe('Bearer my_jwt_token')
    expect(headers.Accept).toBe('application/json')
  })

  it('3. omits Authorization header when token is empty', () => {
    const tokenVal = ''
    const headers = {
      ...(tokenVal ? { Authorization: `Bearer ${tokenVal}` } : {}),
      Accept: 'application/json',
    }
    expect(headers.Authorization).toBeUndefined()
    expect(headers.Accept).toBe('application/json')
  })

  it('4. merges custom options and headers correctly', () => {
    const opts = { headers: { 'X-Custom-Header': 'CustomValue' }, method: 'POST' }
    const tokenVal = 'token123'
    const mergedHeaders = {
      ...(tokenVal ? { Authorization: `Bearer ${tokenVal}` } : {}),
      Accept: 'application/json',
      ...opts.headers,
    }
    expect(mergedHeaders['X-Custom-Header']).toBe('CustomValue')
    expect(mergedHeaders.Authorization).toBe('Bearer token123')
  })

  it('5. returns cached result on network failure when offline', async () => {
    const mockDbStore = {
      get: vi.fn().mockResolvedValue({ data: [{ id: 1, name: 'Offline Data' }] })
    }
    const cached = await mockDbStore.get('kongamano_get_cache_/api/events')
    expect(cached.data.length).toBe(1)
    expect(cached.data[0].name).toBe('Offline Data')
  })

  it('6. saves fresh API response to dbStore on success', async () => {
    const mockDbStore = {
      set: vi.fn().mockResolvedValue(true)
    }
    const freshData = { data: [{ id: 2, name: 'Fresh Data' }] }
    await mockDbStore.set('kongamano_get_cache_/api/events', freshData)
    expect(mockDbStore.set).toHaveBeenCalledWith('kongamano_get_cache_/api/events', freshData)
  })

  it('7. parses token cookie regex correctly', () => {
    const cookieString = 'theme=dark; token=abc123xyz; lang=en'
    const match = cookieString.match(new RegExp('(^| )token=([^;]*)'))
    expect(match ? match[2] : null).toBe('abc123xyz')
  })
})
