import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, computed } from 'vue'

describe('useCrudApi filtering and pagination logic', () => {
  const items = ref([
    { id: 1, name: 'Alpha', email: 'alpha@test.com' },
    { id: 2, name: 'Beta', email: 'beta@test.com' },
    { id: 3, name: 'Gamma', email: 'gamma@test.com' },
    { id: 4, name: 'Delta', email: 'delta@test.com' },
    { id: 5, name: 'Epsilon', email: 'epsilon@test.com' }
  ])
  const searchQuery = ref('')
  const currentPage = ref(1)
  const perPage = ref(2)

  const filteredItems = computed(() => {
    let list = [...items.value]
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim()
      list = list.filter((item: any) =>
        Object.values(item).some(
          (val) => val && String(val).toLowerCase().includes(q)
        )
      )
    }
    list.sort((a, b) => Number(b.id) - Number(a.id))
    return list
  })

  const totalPages = computed(() => Math.ceil(filteredItems.value.length / perPage.value) || 1)
  const startIndex = computed(() => (currentPage.value - 1) * perPage.value)
  const endIndex = computed(() => startIndex.value + perPage.value)
  const paginatedItems = computed(() => filteredItems.value.slice(startIndex.value, endIndex.value))

  beforeEach(() => {
    searchQuery.value = ''
    currentPage.value = 1
    perPage.value = 2
  })

  it('1. sorts items descending by ID', () => {
    expect(filteredItems.value[0].id).toBe(5)
    expect(filteredItems.value[4].id).toBe(1)
  })

  it('2. filters items matching search query accurately', () => {
    searchQuery.value = 'gamma'
    expect(filteredItems.value.length).toBe(1)
    expect(filteredItems.value[0].name).toBe('Gamma')
  })

  it('3. calculates total pages correctly based on perPage setting', () => {
    expect(totalPages.value).toBe(3)
    perPage.value = 5
    expect(totalPages.value).toBe(1)
  })

  it('4. computes startIndex and endIndex correctly', () => {
    expect(startIndex.value).toBe(0)
    expect(endIndex.value).toBe(2)
    currentPage.value = 2
    expect(startIndex.value).toBe(2)
    expect(endIndex.value).toBe(4)
  })

  it('5. paginates list slice accurately per page', () => {
    expect(paginatedItems.value.length).toBe(2)
    expect(paginatedItems.value[0].id).toBe(5)
    expect(paginatedItems.value[1].id).toBe(4)
  })

  it('6. returns page 2 paginated items accurately', () => {
    currentPage.value = 2
    expect(paginatedItems.value[0].id).toBe(3)
    expect(paginatedItems.value[1].id).toBe(2)
  })

  it('7. returns empty list when search yields no match', () => {
    searchQuery.value = 'nonexistent'
    expect(filteredItems.value.length).toBe(0)
    expect(paginatedItems.value.length).toBe(0)
    expect(totalPages.value).toBe(1)
  })

  it('8. case insensitive search matching email domain', () => {
    searchQuery.value = '@TEST.COM'
    expect(filteredItems.value.length).toBe(5)
  })
})
