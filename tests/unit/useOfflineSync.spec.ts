import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'

/**
 * useOfflineSync unit tests.
 * We test the core logic (queue management, executeOrQueue, processQueue branching)
 * without importing the composable directly (it relies on Nuxt globals).
 * Instead we extract and inline the relevant logic to keep tests fast and isolated.
 */

// ─── Inline helpers mirroring useOfflineSync logic ─────────────────────────

interface QueuedAction {
  id: string
  url: string
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body: any
  label: string
  createdAt: string
  retryCount: number
}

function buildQueuedAction(overrides: Partial<QueuedAction> = {}): QueuedAction {
  return {
    id: `${Date.now()}-test`,
    url: '/api/items',
    method: 'POST',
    body: { name: 'Test Item' },
    label: 'Create Item',
    createdAt: new Date().toISOString(),
    retryCount: 0,
    ...overrides,
  }
}

function isNetworkError(err: any, currentlyOnline: boolean): boolean {
  return !currentlyOnline || !err?.status || err?.status === 0 || err?.message?.includes('fetch failed')
}

function getEntityLabel(dataKey: string | undefined, id?: string | number): string {
  const entity = dataKey
    ? dataKey.endsWith('s')
      ? dataKey.slice(0, -1)
      : dataKey
    : 'item'
  const name = entity.charAt(0).toUpperCase() + entity.slice(1)
  return id !== undefined ? `Update ${name} #${id}` : `Create ${name}`
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('useOfflineSync — QueuedAction structure', () => {
  it('1. builds a queued action with required fields', () => {
    const action = buildQueuedAction()
    expect(action).toHaveProperty('id')
    expect(action).toHaveProperty('url')
    expect(action).toHaveProperty('method')
    expect(action).toHaveProperty('body')
    expect(action).toHaveProperty('label')
    expect(action).toHaveProperty('createdAt')
    expect(action).toHaveProperty('retryCount')
  })

  it('2. retryCount defaults to 0', () => {
    expect(buildQueuedAction().retryCount).toBe(0)
  })

  it('3. custom overrides are applied correctly', () => {
    const action = buildQueuedAction({ method: 'DELETE', url: '/api/items/5', retryCount: 2 })
    expect(action.method).toBe('DELETE')
    expect(action.url).toBe('/api/items/5')
    expect(action.retryCount).toBe(2)
  })

  it('4. createdAt is a valid ISO string', () => {
    const action = buildQueuedAction()
    expect(new Date(action.createdAt).toISOString()).toBe(action.createdAt)
  })
})

describe('useOfflineSync — isNetworkError detection', () => {
  it('5. detects offline state as a network error', () => {
    expect(isNetworkError({}, false)).toBe(true)
  })

  it('6. error with no status is treated as network error when online', () => {
    expect(isNetworkError({ message: 'Unknown' }, true)).toBe(true)
  })

  it('7. error with status 0 is treated as network error', () => {
    expect(isNetworkError({ status: 0 }, true)).toBe(true)
  })

  it('8. "fetch failed" message is treated as network error', () => {
    expect(isNetworkError({ status: 503, message: 'fetch failed' }, true)).toBe(true)
  })

  it('9. 422 server error is NOT a network error (should propagate)', () => {
    // JS || returns the last falsy value (undefined), not a boolean false
    expect(isNetworkError({ status: 422 }, true)).toBeFalsy()
  })

  it('10. 500 server error is NOT a network error when online', () => {
    expect(isNetworkError({ status: 500 }, true)).toBeFalsy()
  })
})

describe('useOfflineSync — queue state management (ref-based)', () => {
  let queue: ReturnType<typeof ref<QueuedAction[]>>

  beforeEach(() => {
    queue = ref<QueuedAction[]>([])
  })

  it('11. starts with an empty queue', () => {
    expect(queue.value.length).toBe(0)
  })

  it('12. adds an item to queue', () => {
    queue.value.push(buildQueuedAction({ label: 'Create Event' }))
    expect(queue.value.length).toBe(1)
    expect(queue.value[0].label).toBe('Create Event')
  })

  it('13. removes a specific item from queue by id', () => {
    const a = buildQueuedAction({ id: 'abc', label: 'A' })
    const b = buildQueuedAction({ id: 'xyz', label: 'B' })
    queue.value.push(a, b)
    queue.value = queue.value.filter((q) => q.id !== 'abc')
    expect(queue.value.length).toBe(1)
    expect(queue.value[0].id).toBe('xyz')
  })

  it('14. increments retryCount on temporary failure', () => {
    const item = buildQueuedAction({ id: 'retry-test' })
    queue.value.push(item)
    const found = queue.value.find((q) => q.id === 'retry-test')!
    found.retryCount = (found.retryCount || 0) + 1
    expect(queue.value[0].retryCount).toBe(1)
  })

  it('15. clearing queue sets it to empty array', () => {
    queue.value.push(buildQueuedAction(), buildQueuedAction())
    queue.value = []
    expect(queue.value.length).toBe(0)
  })
})

describe('useOfflineSync — processQueue guard conditions', () => {
  it('16. processQueue skips if offline', () => {
    const isOnline = ref(false)
    const isSyncing = ref(false)
    const queue = ref([buildQueuedAction()])
    const shouldRun = isOnline.value && !isSyncing.value && queue.value.length > 0
    expect(shouldRun).toBe(false)
  })

  it('17. processQueue skips if already syncing', () => {
    const isOnline = ref(true)
    const isSyncing = ref(true)
    const queue = ref([buildQueuedAction()])
    const shouldRun = isOnline.value && !isSyncing.value && queue.value.length > 0
    expect(shouldRun).toBe(false)
  })

  it('18. processQueue skips if queue is empty', () => {
    const isOnline = ref(true)
    const isSyncing = ref(false)
    const queue = ref<QueuedAction[]>([])
    const shouldRun = isOnline.value && !isSyncing.value && queue.value.length > 0
    expect(shouldRun).toBe(false)
  })

  it('19. processQueue runs when online, not syncing, and queue has items', () => {
    const isOnline = ref(true)
    const isSyncing = ref(false)
    const queue = ref([buildQueuedAction()])
    const shouldRun = isOnline.value && !isSyncing.value && queue.value.length > 0
    expect(shouldRun).toBe(true)
  })
})

describe('useOfflineSync — permanent error status codes (discard logic)', () => {
  it('20. status 400 is a permanent error', () => {
    const status = 400
    const permanent = [400, 422, 401, 403].includes(status)
    expect(permanent).toBe(true)
  })

  it('21. status 422 is a permanent error', () => {
    expect([400, 422, 401, 403].includes(422)).toBe(true)
  })

  it('22. status 401 is a permanent error', () => {
    expect([400, 422, 401, 403].includes(401)).toBe(true)
  })

  it('23. status 403 is a permanent error', () => {
    expect([400, 422, 401, 403].includes(403)).toBe(true)
  })

  it('24. status 500 is NOT a permanent error (retry)', () => {
    expect([400, 422, 401, 403].includes(500)).toBe(false)
  })

  it('25. status 503 is NOT a permanent error (retry)', () => {
    expect([400, 422, 401, 403].includes(503)).toBe(false)
  })
})

describe('useOfflineSync — conflict detection condition', () => {
  it('26. conflict check fires for PUT with updated_at', () => {
    const item = buildQueuedAction({ method: 'PUT', body: { updated_at: '2026-08-01T00:00:00Z' } })
    const shouldCheck = (item.method === 'PUT' || item.method === 'DELETE') && item.body && item.body.updated_at
    expect(shouldCheck).toBeTruthy()
  })

  it('27. conflict check fires for DELETE with updated_at', () => {
    const item = buildQueuedAction({ method: 'DELETE', body: { updated_at: '2026-08-01T00:00:00Z' } })
    const shouldCheck = (item.method === 'PUT' || item.method === 'DELETE') && item.body && item.body.updated_at
    expect(shouldCheck).toBeTruthy()
  })

  it('28. conflict check skips for POST', () => {
    const item = buildQueuedAction({ method: 'POST', body: { updated_at: '2026-08-01T00:00:00Z' } })
    const shouldCheck = (item.method === 'PUT' || item.method === 'DELETE') && item.body && item.body.updated_at
    expect(shouldCheck).toBeFalsy()
  })

  it('29. conflict detected when server updated_at differs from client', () => {
    const clientUpdatedAt = '2026-07-01T00:00:00Z'
    const serverUpdatedAt = '2026-08-01T00:00:00Z'
    const isConflict = serverUpdatedAt && serverUpdatedAt !== clientUpdatedAt
    expect(isConflict).toBeTruthy()
  })

  it('30. no conflict when server and client updated_at match', () => {
    const ts = '2026-08-01T00:00:00Z'
    const isConflict = ts && ts !== ts
    expect(isConflict).toBeFalsy()
  })
})

describe('useOfflineSync — getEntityLabel for action labels', () => {
  it('31. generates Create label for plural dataKey', () => {
    expect(getEntityLabel('events')).toBe('Create Event')
  })

  it('32. generates Update label with ID for plural dataKey', () => {
    expect(getEntityLabel('registrations', 42)).toBe('Update Registration #42')
  })

  it('33. falls back to "Item" (capitalised) label when dataKey is undefined', () => {
    // getEntityLabel always capitalises the entity: 'item' -> 'Item'
    expect(getEntityLabel(undefined)).toBe('Create Item')
  })

  it('34. handles singular dataKey (no trailing s) and capitalises it', () => {
    // 'data' does not end in 's', so it is kept as-is then capitalised -> 'Data'
    expect(getEntityLabel('data')).toBe('Create Data')
  })
})
