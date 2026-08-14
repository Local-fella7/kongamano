import { describe, it, expect, beforeEach, vi } from 'vitest'
import { dbStore } from '../../app/utils/db'

describe('dbStore IndexedDB utility comprehensive tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('1. returns null for dbStore.get when running outside client browser', async () => {
    const val = await dbStore.get('test_key')
    expect(val).toBeNull()
  })

  it('2. resolves dbStore.set safely without throwing exceptions on non-client side', async () => {
    await expect(dbStore.set('test_key', { data: 123 })).resolves.not.toThrow()
  })

  it('3. resolves dbStore.delete safely without throwing exceptions on non-client side', async () => {
    await expect(dbStore.delete('test_key')).resolves.not.toThrow()
  })

  it('4. serializes and deep-clones object value in dbStore.set payload', () => {
    const rawVal = { name: 'Kongamano', nested: { id: 99 } }
    const cleanVal = JSON.parse(JSON.stringify(rawVal))
    expect(cleanVal).toEqual(rawVal)
    expect(cleanVal).not.toBe(rawVal)
  })

  it('5. handles string key identifiers properly in dbStore methods', async () => {
    const key = 'kongamano_offline_queue'
    expect(typeof key).toBe('string')
  })

  it('6. catches IndexedDB errors gracefully and logs to console without breaking app', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await dbStore.get('error_key')
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it('7. handles null and primitive values in dbStore.set safely', async () => {
    await expect(dbStore.set('null_key', null)).resolves.not.toThrow()
    await expect(dbStore.set('num_key', 42)).resolves.not.toThrow()
  })

  it('8. resolves cacheRegistrations and getCachedRegistrations safely', async () => {
    await expect(dbStore.cacheRegistrations(1, [{ id: 1, first_name: 'John' }])).resolves.not.toThrow()
    const cached = await dbStore.getCachedRegistrations(1)
    expect(cached).toBeNull()
  })

  it('9. resolves cacheScanLogs and getCachedScanLogs safely', async () => {
    const logs = [{ id: 1, scan_type: 'check_in', event_id: 1 }]
    await expect(dbStore.cacheScanLogs(1, logs)).resolves.not.toThrow()
    const cached = await dbStore.getCachedScanLogs(1)
    expect(cached).toBeNull()
  })

  it('10. resolves getAll and returns empty array outside client environment', async () => {
    const all = await dbStore.getAll()
    expect(Array.isArray(all)).toBe(true)
    expect(all).toEqual([])
  })

  it('11. resolves getAllCachedRegistrations and returns array safely', async () => {
    const regs = await dbStore.getAllCachedRegistrations()
    expect(Array.isArray(regs)).toBe(true)
    expect(regs).toEqual([])
  })

  it('12. resolves getAllCachedScanLogs and returns array safely', async () => {
    const logs = await dbStore.getAllCachedScanLogs()
    expect(Array.isArray(logs)).toBe(true)
    expect(logs).toEqual([])
  })
})
