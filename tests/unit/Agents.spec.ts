import { describe, it, expect } from 'vitest'

describe('Agents Page Filtering & Regional Unique Set Computation', () => {
  function getUniqueRegions(agents: { region?: string }[]) {
    const regions = agents.map(a => a.region).filter(Boolean) as string[]
    return Array.from(new Set(regions))
  }

  function filterAgentsByRegion(agents: any[], selectedRegion: string) {
    if (!selectedRegion) return agents
    return agents.filter(a => a.region === selectedRegion)
  }

  function validateAgentForm(form: { name: string }) {
    if (!form.name.trim()) return 'Agent name is required.'
    return ''
  }

  const mockAgents = [
    { id: 1, name: 'Nairobi Agent 1', region: 'Nairobi', registration_no: 'AG-101' },
    { id: 2, name: 'Nairobi Agent 2', region: 'Nairobi', registration_no: 'AG-102' },
    { id: 3, name: 'Mombasa Agent', region: 'Mombasa', registration_no: 'AG-201' },
    { id: 4, name: 'Unassigned Agent', region: '', registration_no: null }
  ]

  it('1. extracts unique set of regions properly', () => {
    const regions = getUniqueRegions(mockAgents)
    expect(regions).toEqual(['Nairobi', 'Mombasa'])
    expect(regions.length).toBe(2)
  })

  it('2. filters agents list by selected region', () => {
    const filtered = filterAgentsByRegion(mockAgents, 'Nairobi')
    expect(filtered.length).toBe(2)
    expect(filtered[0].id).toBe(1)
  })

  it('3. returns full list when region filter is empty', () => {
    const filtered = filterAgentsByRegion(mockAgents, '')
    expect(filtered.length).toBe(4)
  })

  it('4. validates empty agent name error', () => {
    const err = validateAgentForm({ name: '   ' })
    expect(err).toBe('Agent name is required.')
  })

  it('5. passes form validation for non-empty agent name', () => {
    const err = validateAgentForm({ name: 'Nairobi Central Agent' })
    expect(err).toBe('')
  })
})
