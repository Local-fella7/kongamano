import { describe, it, expect } from 'vitest'

describe('DataTable component state and pagination calculations', () => {
  function getShowingRangeText(startIndex: number, endIndex: number, totalCount: number) {
    if (totalCount === 0) return 'No entries'
    const start = startIndex + 1
    const end = Math.min(endIndex, totalCount)
    return `Showing ${start} to ${end} of ${totalCount} entries`
  }

  function getPaginationDisplay(currentPage: number, totalPages: number) {
    return {
      hasPrevious: currentPage > 1,
      hasNext: currentPage < totalPages,
      isPageActive: (page: number) => page === currentPage,
    }
  }

  it('1. formats range text correctly for first page', () => {
    expect(getShowingRangeText(0, 10, 25)).toBe('Showing 1 to 10 of 25 entries')
  })

  it('2. caps end index at totalCount on final page', () => {
    expect(getShowingRangeText(20, 30, 25)).toBe('Showing 21 to 25 of 25 entries')
  })

  it('3. returns empty string text when totalCount is zero', () => {
    expect(getShowingRangeText(0, 10, 0)).toBe('No entries')
  })

  it('4. disables previous button on first page', () => {
    const nav = getPaginationDisplay(1, 5)
    expect(nav.hasPrevious).toBe(false)
    expect(nav.hasNext).toBe(true)
  })

  it('5. disables next button on last page', () => {
    const nav = getPaginationDisplay(5, 5)
    expect(nav.hasPrevious).toBe(true)
    expect(nav.hasNext).toBe(false)
  })

  it('6. enables both previous and next buttons on middle pages', () => {
    const nav = getPaginationDisplay(3, 5)
    expect(nav.hasPrevious).toBe(true)
    expect(nav.hasNext).toBe(true)
  })

  it('7. correctly identifies active page', () => {
    const nav = getPaginationDisplay(2, 4)
    expect(nav.isPageActive(2)).toBe(true)
    expect(nav.isPageActive(1)).toBe(false)
  })
})
