import { describe, it, expect } from 'vitest'

describe('Scannings Analytics & Service Breakdown Unit Tests', () => {
  // ── Helper 1: Compute Scan Statistics ──────────────────────────────────────
  function computeScanStatistics(logs: any[], servicesList: any[], masterServicesMap: Map<number, any>) {
    let totalScans = 0
    let totalCheckIns = 0
    let totalCheckOuts = 0
    let totalServiceScans = 0

    const uniqueAttendeesSet = new Set<string | number>()
    const attendeeLatestScanMap = new Map<string | number, any>()
    const serviceMap = new Map<string | number, { id: string | number; name: string; count: number }>()

    // 1. Pre-populate with configured event services
    for (const s of servicesList) {
      if (s && s.id !== undefined && s.id !== null) {
        const sId = Number(s.id)
        const masterObj = masterServicesMap.get(sId)
        const srvName = (s.name && !s.name.startsWith('Service #'))
          ? s.name
          : (masterObj?.name || s.name || `Service #${sId}`)

        serviceMap.set(sId, {
          id: s.id,
          name: srvName,
          count: 0,
        })
      }
    }

    // 2. Count from actual logs and dynamically discover any service in logs
    for (const l of logs) {
      totalScans++

      const regId = l.registration_id || l.registration?.id
      const qrIdentifier = l.qr_code || l.registration?.qr_code
      const attendeeKey = regId ? `id_${regId}` : (qrIdentifier ? `qr_${String(qrIdentifier).trim().toLowerCase()}` : null)

      if (attendeeKey) {
        const existingLatest = attendeeLatestScanMap.get(attendeeKey)
        if (!existingLatest) {
          attendeeLatestScanMap.set(attendeeKey, l)
        } else {
          const getLogTime = (logItem: any) => {
            if (logItem.created_at) {
              let p = String(logItem.created_at).trim().replace(' ', 'T')
              if (!/Z|[+-]\d{2}:?\d{2}$/i.test(p)) p += 'Z'
              const t = new Date(p).getTime()
              if (!isNaN(t)) return t
            }
            return Number(logItem.id) || 0
          }
          if (getLogTime(l) >= getLogTime(existingLatest)) {
            attendeeLatestScanMap.set(attendeeKey, l)
          }
        }
      }

      const sId = l.service_id ? Number(l.service_id) : (l.service?.id ? Number(l.service.id) : null)
      const masterObj = sId ? masterServicesMap.get(sId) : null
      const sName = (l.service?.name && !l.service.name.startsWith('Service #'))
        ? l.service.name
        : (l.service_name || masterObj?.name || (sId ? `Service #${sId}` : null))

      if (sId) {
        totalServiceScans++
        if (!serviceMap.has(sId)) {
          serviceMap.set(sId, {
            id: sId,
            name: sName || `Service #${sId}`,
            count: 0,
          })
        } else {
          const existing = serviceMap.get(sId)!
          if (existing.name.startsWith('Service #') && sName && !sName.startsWith('Service #')) {
            existing.name = sName
          }
        }
        const srvItem = serviceMap.get(sId)!
        srvItem.count += 1
      } else if (l.scan_type === 'service') {
        totalServiceScans++
        const genericKey = sName || 'Service Access'
        if (!serviceMap.has(genericKey)) {
          serviceMap.set(genericKey, {
            id: genericKey,
            name: genericKey,
            count: 0,
          })
        }
        const srvItem = serviceMap.get(genericKey)!
        srvItem.count += 1
      } else if (l.scan_type === 'check_out') {
        totalCheckOuts++
      } else {
        totalCheckIns++
        if (attendeeKey) {
          uniqueAttendeesSet.add(attendeeKey)
        }
      }
    }

    let currentlyInside = 0
    for (const [key, latestLog] of attendeeLatestScanMap.entries()) {
      if (latestLog && latestLog.scan_type !== 'check_out' && uniqueAttendeesSet.has(key)) {
        currentlyInside++
      }
    }

    return {
      totalScans,
      totalCheckIns,
      uniqueAttendeesCount: uniqueAttendeesSet.size,
      currentlyInside,
      totalCheckOuts,
      totalServiceScans,
      services: Array.from(serviceMap.values()),
    }
  }

  // ── Helper 2: Resolve Log Service Name ────────────────────────────────────
  function getLogServiceName(log: any, servicesList: any[], masterServicesMap: Map<number, any>): string {
    if (!log) return '—'
    if (log.service?.name) return log.service.name
    if (log.service_name) return log.service_name
    const srvId = log.service_id ? Number(log.service_id) : (log.service?.id ? Number(log.service.id) : null)
    if (srvId) {
      const found = servicesList.find((s: any) => Number(s.id) === srvId)
      if (found?.name && !found.name.startsWith('Service #')) return found.name
      const masterObj = masterServicesMap.get(srvId)
      if (masterObj?.name) return masterObj.name
      if (found?.name) return found.name
      return `Service #${srvId}`
    }
    return '—'
  }

  // ── Helper 3: Filter Logs ──────────────────────────────────────────────────
  function filterLogs(logs: any[], selectedScanType: string, selectedServiceId: number | string, searchQuery = '') {
    let list = logs

    if (selectedServiceId) {
      const targetSrvId = Number(selectedServiceId)
      list = list.filter((l: any) => {
        const sId = l.service_id ? Number(l.service_id) : (l.service?.id ? Number(l.service.id) : null)
        return sId === targetSrvId
      })
    } else if (selectedScanType) {
      if (selectedScanType === 'service') {
        list = list.filter((l: any) => l.service_id || l.service || l.scan_type === 'service')
      } else {
        list = list.filter((l: any) => !l.service_id && !l.service && l.scan_type === selectedScanType)
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter((l: any) => {
        const name = (l.name || l.first_name || '').toLowerCase()
        const qr = (l.qr_code || '').toLowerCase()
        return name.includes(q) || qr.includes(q)
      })
    }

    return list
  }

  // ── Helper 4: Batch Range Calculator (Bulk Exporter) ───────────────────────
  function calculateBatchRanges(totalCount: number, batchSize = 1000) {
    if (totalCount <= batchSize) return []
    const ranges = []
    let start = 1
    while (start <= totalCount) {
      const end = Math.min(start + batchSize - 1, totalCount)
      ranges.push({
        index: ranges.length,
        label: `Passes ${start.toLocaleString()} – ${end.toLocaleString()} (${end - start + 1} QRs)`,
        startIndex: start - 1,
        endIndex: end,
        count: end - start + 1,
      })
      start += batchSize
    }
    return ranges
  }

  // ── Test Cases ─────────────────────────────────────────────────────────────

  describe('1. Scan Statistics Computation & Breakdown', () => {
    it('calculates accurate counts for check-ins, check-outs, and service claims', () => {
      const logs = [
        { id: 1, scan_type: 'check_in', qr_code: 'REG-1-001' },
        { id: 2, scan_type: 'check_in', qr_code: 'REG-1-002' },
        { id: 3, scan_type: 'service', service_id: 10, qr_code: 'REG-1-001' },
        { id: 4, scan_type: 'service', service_id: 10, qr_code: 'REG-1-002' },
        { id: 5, scan_type: 'service', service_id: 20, qr_code: 'REG-1-001' },
        { id: 6, scan_type: 'check_out', qr_code: 'REG-1-001' },
      ]

      const servicesList = [
        { id: 10, name: 'Lunch Buffet' },
        { id: 20, name: 'Welcome Kit' },
        { id: 30, name: 'Dinner' },
      ]

      const masterMap = new Map([
        [10, { id: 10, name: 'Lunch Buffet' }],
        [20, { id: 20, name: 'Welcome Kit' }],
        [30, { id: 30, name: 'Dinner' }],
      ])

      const stats = computeScanStatistics(logs, servicesList, masterMap)

      expect(stats.totalScans).toBe(6)
      expect(stats.totalCheckIns).toBe(2)
      expect(stats.uniqueAttendeesCount).toBe(2)
      expect(stats.currentlyInside).toBe(1) // REG-1-001 checked out, REG-1-002 still inside
      expect(stats.totalCheckOuts).toBe(1)
      expect(stats.totalServiceScans).toBe(3)

      const lunch = stats.services.find((s) => s.id === 10)
      const kit = stats.services.find((s) => s.id === 20)
      const dinner = stats.services.find((s) => s.id === 30)

      expect(lunch?.count).toBe(2)
      expect(kit?.count).toBe(1)
      expect(dinner?.count).toBe(0)
    })

    it('dynamically discovers services present only in scan logs even if servicesList is empty', () => {
      const logs = [
        { id: 1, scan_type: 'service', service_id: 5, service_name: 'Afternoon Tea' },
        { id: 2, scan_type: 'service', service_id: 5, service_name: 'Afternoon Tea' },
      ]

      const stats = computeScanStatistics(logs, [], new Map())

      expect(stats.services.length).toBe(1)
      expect(stats.services[0].name).toBe('Afternoon Tea')
      expect(stats.services[0].count).toBe(2)
    })
  })

  describe('2. Master Service Catalog Name Resolution', () => {
    it('resolves numeric service_id to human-readable name from masterServicesMap', () => {
      const masterMap = new Map([
        [2, { id: 2, name: 'VIP Lunch' }],
        [3, { id: 3, name: 'Conference Bag' }],
      ])

      const log = { id: 101, service_id: 2 }
      const resolved = getLogServiceName(log, [], masterMap)

      expect(resolved).toBe('VIP Lunch')
    })

    it('falls back to "Service #ID" if service is not found in master catalog', () => {
      const log = { id: 102, service_id: 99 }
      const resolved = getLogServiceName(log, [], new Map())

      expect(resolved).toBe('Service #99')
    })

    it('returns "—" for standard entry check-in without service', () => {
      const log = { id: 103, scan_type: 'check_in' }
      const resolved = getLogServiceName(log, [], new Map())

      expect(resolved).toBe('—')
    })
  })

  describe('3. Specific Service Filtering in Data Table', () => {
    const sampleLogs = [
      { id: 1, scan_type: 'check_in', qr_code: 'REG-1-001' },
      { id: 2, scan_type: 'service', service_id: 10, qr_code: 'REG-1-001' },
      { id: 3, scan_type: 'service', service_id: 20, qr_code: 'REG-1-002' },
      { id: 4, scan_type: 'service', service_id: 10, qr_code: 'REG-1-003' },
      { id: 5, scan_type: 'check_out', qr_code: 'REG-1-001' },
    ]

    it('filters strictly by specific service ID', () => {
      const filtered = filterLogs(sampleLogs, 'service', 10)
      expect(filtered.length).toBe(2)
      expect(filtered.every((l) => l.service_id === 10)).toBe(true)
    })

    it('filters by broad service scan type when no specific service is selected', () => {
      const filtered = filterLogs(sampleLogs, 'service', '')
      expect(filtered.length).toBe(3)
    })

    it('filters by check-ins only', () => {
      const filtered = filterLogs(sampleLogs, 'check_in', '')
      expect(filtered.length).toBe(1)
      expect(filtered[0].scan_type).toBe('check_in')
    })

    it('filters by check-outs only', () => {
      const filtered = filterLogs(sampleLogs, 'check_out', '')
      expect(filtered.length).toBe(1)
      expect(filtered[0].scan_type).toBe('check_out')
    })
  })

  describe('4. Bulk QR Code Exporter Batch Splitting (1,000 + 500 passes scenario)', () => {
    it('correctly creates 2 batches when expanding from 1,000 to 1,500 passes', () => {
      const totalPasses = 1500
      const batches = calculateBatchRanges(totalPasses, 1000)

      expect(batches.length).toBe(2)

      // Batch 1: first 1000 passes
      expect(batches[0].label).toContain('1 – 1,000')
      expect(batches[0].startIndex).toBe(0)
      expect(batches[0].endIndex).toBe(1000)
      expect(batches[0].count).toBe(1000)

      // Batch 2: the new 500 passes
      expect(batches[1].label).toContain('1,001 – 1,500')
      expect(batches[1].startIndex).toBe(1000)
      expect(batches[1].endIndex).toBe(1500)
      expect(batches[1].count).toBe(500)
    })

    it('returns empty array when total passes is within a single batch (<= 1000)', () => {
      const batches = calculateBatchRanges(500, 1000)
      expect(batches.length).toBe(0)
    })
  })
})
