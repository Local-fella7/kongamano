import { describe, it, expect, beforeEach } from 'vitest';
import { localHubStore } from '../../server/utils/localHubStore';

describe('Local Hub Storage & Router-Free Station Tests', () => {
  const sampleEventId = 999;
  const sampleAttendees = [
    { id: 101, first_name: 'David', last_name: 'Mwakasege', qr_code: 'REG-999-101', registration_number: 'REG-999-101' },
    { id: 102, first_name: 'Grace', last_name: 'Massawe', qr_code: 'REG-999-102', registration_number: 'REG-999-102' },
  ];
  const sampleServices = [
    { id: 1, name: 'Breakfast', requires_scan: true },
    { id: 2, name: 'Lunch', requires_scan: true },
  ];

  beforeEach(() => {
    localHubStore.clearPreloadedData(sampleEventId);
  });

  describe('1. Network IP & Hub Info Resolution', () => {
    it('resolves local network IPs for tablet hotspot connections', () => {
      const ips = localHubStore.getLocalIPs();
      expect(Array.isArray(ips)).toBe(true);
      expect(ips.length).toBeGreaterThan(0);
      expect(typeof ips[0]).toBe('string');
    });

    it('returns structured hub information with tablet connection URL', () => {
      const info = localHubStore.getHubInfo();
      expect(info.is_local_hub).toBe(true);
      expect(info.tablet_connect_url).toContain(':3000/scan');
    });
  });

  describe('2. Event Preload Snapshot Management', () => {
    it('saves and retrieves preloaded event snapshot with delegates and services', () => {
      localHubStore.savePreloadedEvent(
        sampleEventId,
        { id: sampleEventId, name: 'Arusha Kongamano 2026' },
        sampleAttendees,
        sampleServices
      );

      const snapshot = localHubStore.getPreloadedEvent(sampleEventId);
      expect(snapshot).not.toBeNull();
      expect(snapshot?.event_id).toBe(sampleEventId);
      expect(snapshot?.total_attendees).toBe(2);
      expect(snapshot?.attendees.length).toBe(2);
      expect(snapshot?.services.length).toBe(2);
    });
  });

  describe('3. Local Scan Recording & Cross-Device Duplicate Detection', () => {
    beforeEach(() => {
      localHubStore.savePreloadedEvent(
        sampleEventId,
        { id: sampleEventId, name: 'Arusha Kongamano 2026' },
        sampleAttendees,
        sampleServices
      );
    });

    it('records check-in from Tablet 1 and populates delegate name and pending sync state', () => {
      const result = localHubStore.recordLocalScan({
        qr_code: 'REG-999-101',
        scan_type: 'check_in',
        event_id: sampleEventId,
        station_ip: '192.168.137.15', // Tablet 1 IP
      });

      expect(result.success).toBe(true);
      expect(result.data.registration_id).toBe(101);
      expect(result.data.registration.first_name).toBe('David');
      expect(result.data.synced_to_cloud).toBe(false);
      expect(result.duplicate).toBe(false);
    });

    it('detects duplicate check-in when Tablet 2 attempts to scan the same QR code', () => {
      // Tablet 1 scans
      localHubStore.recordLocalScan({
        qr_code: 'REG-999-101',
        scan_type: 'check_in',
        event_id: sampleEventId,
        station_ip: '192.168.137.15',
      });

      // Tablet 2 scans same QR code
      const result2 = localHubStore.recordLocalScan({
        qr_code: 'REG-999-101',
        scan_type: 'check_in',
        event_id: sampleEventId,
        station_ip: '192.168.137.22', // Tablet 2 IP
      });

      expect(result2.success).toBe(true);
      expect(result2.duplicate).toBe(true);
      expect(result2.message).toContain('already checked in');
    });

    it('records service scan without triggering entry duplicate', () => {
      const result = localHubStore.recordLocalScan({
        qr_code: 'REG-999-101',
        scan_type: 'service',
        service_id: 1,
        event_id: sampleEventId,
      });

      expect(result.success).toBe(true);
      expect(result.data.service_id).toBe(1);
      expect(result.duplicate).toBe(false);
    });
  });

  describe('4. Cloud Sync Tracking', () => {
    it('marks locally recorded scans as synced after cloud upload', () => {
      const scan = localHubStore.recordLocalScan({
        qr_code: 'REG-999-102',
        scan_type: 'check_in',
        event_id: sampleEventId,
      });

      const pendingBefore = localHubStore.getPendingCloudSyncScans(sampleEventId);
      expect(pendingBefore.some((s) => s.id === scan.data.id)).toBe(true);

      localHubStore.markScansSynced([scan.data.id]);

      const pendingAfter = localHubStore.getPendingCloudSyncScans(sampleEventId);
      expect(pendingAfter.some((s) => s.id === scan.data.id)).toBe(false);
    });
  });
});
