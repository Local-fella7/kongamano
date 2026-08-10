import { describe, it, expect } from 'vitest'

describe('OfflineSyncBanner display conditions', () => {
  function shouldDisplayBanner(isOnline: boolean, queueLength: number, isSyncing: boolean) {
    return !isOnline || queueLength > 0 || isSyncing
  }

  function getBannerStatus(isOnline: boolean, queueLength: number, isSyncing: boolean) {
    if (!isOnline) return 'OFFLINE'
    if (isSyncing) return 'SYNCING'
    if (queueLength > 0) return 'PENDING_QUEUE'
    return 'HIDDEN'
  }

  it('1. displays banner when user is offline', () => {
    expect(shouldDisplayBanner(false, 0, false)).toBe(true)
    expect(getBannerStatus(false, 0, false)).toBe('OFFLINE')
  })

  it('2. displays banner when online but has pending items', () => {
    expect(shouldDisplayBanner(true, 3, false)).toBe(true)
    expect(getBannerStatus(true, 3, false)).toBe('PENDING_QUEUE')
  })

  it('3. displays banner when online and syncing', () => {
    expect(shouldDisplayBanner(true, 2, true)).toBe(true)
    expect(getBannerStatus(true, 2, true)).toBe('SYNCING')
  })

  it('4. hides banner when online with 0 pending items and not syncing', () => {
    expect(shouldDisplayBanner(true, 0, false)).toBe(false)
    expect(getBannerStatus(true, 0, false)).toBe('HIDDEN')
  })
})
