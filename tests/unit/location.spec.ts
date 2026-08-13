import { describe, it, expect } from 'vitest'
import { extractLocationList } from '../../app/utils/location'

describe('extractLocationList utility tests', () => {
  it('1. returns empty array for null input', () => {
    expect(extractLocationList(null, 'regions')).toEqual([])
  })

  it('2. returns empty array for undefined input', () => {
    expect(extractLocationList(undefined, 'regions')).toEqual([])
  })

  it('3. extracts regions array from res.data.regions', () => {
    const res = { data: { regions: ['Dar es Salaam', 'Dodoma', 'Mwanza'] } }
    expect(extractLocationList(res, 'regions')).toEqual(['Dar es Salaam', 'Dodoma', 'Mwanza'])
  })

  it('4. extracts districts from res.data.districts', () => {
    const res = { data: { districts: ['Ilala', 'Kinondoni', 'Temeke'] } }
    expect(extractLocationList(res, 'districts')).toEqual(['Ilala', 'Kinondoni', 'Temeke'])
  })

  it('5. extracts wards from res.data.wards', () => {
    const res = { data: { wards: ['Magomeni', 'Kijitonyama'] } }
    expect(extractLocationList(res, 'wards')).toEqual(['Magomeni', 'Kijitonyama'])
  })

  it('6. extracts from direct array (no .data wrapper)', () => {
    const res = ['Arusha', 'Kilimanjaro']
    expect(extractLocationList(res, 'regions')).toEqual(['Arusha', 'Kilimanjaro'])
  })

  it('7. extracts from top-level key when res.data is missing', () => {
    const res = { regions: ['Morogoro', 'Tanga'] }
    expect(extractLocationList(res, 'regions')).toEqual(['Morogoro', 'Tanga'])
  })

  it('8. maps object items using .name property', () => {
    const res = { data: { regions: [{ name: 'Dodoma' }, { name: 'Mwanza' }] } }
    expect(extractLocationList(res, 'regions')).toEqual(['Dodoma', 'Mwanza'])
  })

  it('9. maps object items using .title property when .name is absent', () => {
    const res = { data: { regions: [{ title: 'Lindi' }, { title: 'Ruvuma' }] } }
    expect(extractLocationList(res, 'regions')).toEqual(['Lindi', 'Ruvuma'])
  })

  it('10. maps object items using .code property when .name and .title are absent', () => {
    const res = { data: { regions: [{ code: 'DAR' }, { code: 'DSM' }] } }
    expect(extractLocationList(res, 'regions')).toEqual(['DAR', 'DSM'])
  })

  it('11. filters out empty strings from result', () => {
    const res = { data: { regions: [{ name: 'Dodoma' }, {}, { name: '' }] } }
    const result = extractLocationList(res, 'regions')
    expect(result).toEqual(['Dodoma'])
  })

  it('12. handles mixed string and object array items', () => {
    const res = { data: { regions: ['Tabora', { name: 'Singida' }] } }
    expect(extractLocationList(res, 'regions')).toEqual(['Tabora', 'Singida'])
  })

  it('13. returns empty array when res.data exists but the key is not an array', () => {
    const res = { data: { regions: 'not-an-array' } }
    expect(extractLocationList(res, 'regions')).toEqual([])
  })

  it('14. returns empty array when res.data is empty object', () => {
    const res = { data: {} }
    expect(extractLocationList(res, 'districts')).toEqual([])
  })

  it('15. ignores non-string, non-object primitive items (e.g. numbers)', () => {
    const res = { data: { regions: [42, null, 'Arusha'] } }
    const result = extractLocationList(res, 'regions')
    // numbers and null map to '' → filtered out; 'Arusha' remains
    expect(result).toEqual(['Arusha'])
  })
})
