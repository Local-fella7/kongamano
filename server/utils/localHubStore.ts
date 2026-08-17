import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

export interface LocalScanRecord {
  id: string | number;
  qr_code: string;
  scan_type: 'check_in' | 'service' | 'check_out';
  service_id?: number | null;
  event_id: number;
  registration_id?: number | null;
  registration?: any;
  created_at: string;
  synced_to_cloud: boolean;
  station_ip?: string;
  operator_id?: number | null;
}

export interface PreloadedEventSnapshot {
  event_id: number;
  event_info: any;
  attendees: any[];
  services: any[];
  preloaded_at: string;
  total_attendees: number;
}

interface HubStorageSchema {
  preloaded_events: Record<number, PreloadedEventSnapshot>;
  local_scans: LocalScanRecord[];
  active_event_id: number | null;
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const STORE_FILE = path.join(DATA_DIR, 'local_hub_store.json');

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readStore(): HubStorageSchema {
  ensureDataDirectory();
  if (!fs.existsSync(STORE_FILE)) {
    const initial: HubStorageSchema = {
      preloaded_events: {},
      local_scans: [],
      active_event_id: null,
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(STORE_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {
      preloaded_events: {},
      local_scans: [],
      active_event_id: null,
    };
  }
}

function writeStore(data: HubStorageSchema) {
  ensureDataDirectory();
  fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export const localHubStore = {
  // Get Local Network IP addresses of the laptop (e.g. 192.168.137.1 or 192.168.1.50)
  getLocalIPs(): string[] {
    const ips: string[] = [];
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      const ifaceList = interfaces[name];
      if (!ifaceList) continue;
      for (const iface of ifaceList) {
        // Skip internal loopback (127.0.0.1) and non-IPv4 addresses
        if (iface.family === 'IPv4' && !iface.internal) {
          ips.push(iface.address);
        }
      }
    }
    return ips.length > 0 ? ips : ['127.0.0.1'];
  },

  getHubInfo() {
    const store = readStore();
    const ips = this.getLocalIPs();
    const primaryIp = ips[0] || 'localhost';
    const activeEvent = store.active_event_id ? store.preloaded_events[store.active_event_id] : null;
    const pendingScans = store.local_scans.filter((s) => !s.synced_to_cloud);

    return {
      is_local_hub: true,
      ips,
      primary_ip: primaryIp,
      port: 3000,
      tablet_connect_url: `http://${primaryIp}:3000/scan`,
      active_event_id: store.active_event_id,
      active_event_name: activeEvent?.event_info?.name || (activeEvent ? `Event #${activeEvent.event_id}` : null),
      preloaded_events_count: Object.keys(store.preloaded_events).length,
      preloaded_events: Object.values(store.preloaded_events).map((e) => ({
        event_id: e.event_id,
        name: e.event_info?.name || `Event #${e.event_id}`,
        attendees_count: e.total_attendees,
        services_count: e.services?.length || 0,
        preloaded_at: e.preloaded_at,
      })),
      total_local_scans: store.local_scans.length,
      pending_cloud_sync_count: pendingScans.length,
      last_updated: new Date().toISOString(),
    };
  },

  savePreloadedEvent(eventId: number, eventInfo: any, attendees: any[], services: any[]) {
    const store = readStore();
    const snapshot: PreloadedEventSnapshot = {
      event_id: Number(eventId),
      event_info: eventInfo || { id: eventId, name: `Event #${eventId}` },
      attendees: Array.isArray(attendees) ? attendees : [],
      services: Array.isArray(services) ? services : [],
      preloaded_at: new Date().toISOString(),
      total_attendees: Array.isArray(attendees) ? attendees.length : 0,
    };

    store.preloaded_events[Number(eventId)] = snapshot;
    store.active_event_id = Number(eventId);
    writeStore(store);
    return snapshot;
  },

  getPreloadedEvent(eventId: number): PreloadedEventSnapshot | null {
    const store = readStore();
    return store.preloaded_events[Number(eventId)] || null;
  },

  recordLocalScan(payload: {
    qr_code: string;
    scan_type: 'check_in' | 'service' | 'check_out';
    service_id?: number | null;
    event_id: number;
    station_ip?: string;
  }): { success: boolean; data: LocalScanRecord; message: string; duplicate?: boolean } {
    const store = readStore();
    const eventId = Number(payload.event_id);
    const eventSnapshot = store.preloaded_events[eventId];

    // Attempt to match delegate from preloaded snapshot
    let attendeeRecord: any = null;
    if (eventSnapshot && Array.isArray(eventSnapshot.attendees)) {
      const cleanCode = String(payload.qr_code).trim().toLowerCase();
      attendeeRecord = eventSnapshot.attendees.find((a: any) => {
        const idStr = String(a.id || '');
        const qr = String(a.qr_code || '').trim().toLowerCase();
        const regNum = String(a.registration_number || '').trim().toLowerCase();
        const fullCode = `reg-${eventId}-${idStr}`.toLowerCase();
        return qr === cleanCode || idStr === cleanCode || regNum === cleanCode || fullCode === cleanCode;
      });
    }

    // Check duplicate check-in today
    const existingLogs = store.local_scans.filter(
      (s) => s.event_id === eventId && String(s.qr_code).trim().toLowerCase() === String(payload.qr_code).trim().toLowerCase()
    );

    let isDuplicateCheckIn = false;
    if (payload.scan_type === 'check_in' && !payload.service_id) {
      const lastScan = existingLogs[0]; // Newest first
      if (lastScan && lastScan.scan_type === 'check_in') {
        isDuplicateCheckIn = true;
      }
    }

    const newScanRecord: LocalScanRecord = {
      id: `hub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      qr_code: payload.qr_code,
      scan_type: payload.scan_type,
      service_id: payload.service_id ? Number(payload.service_id) : null,
      event_id: eventId,
      registration_id: attendeeRecord?.id ? Number(attendeeRecord.id) : null,
      registration: attendeeRecord || null,
      created_at: new Date().toISOString(),
      synced_to_cloud: false,
      station_ip: payload.station_ip || 'local-station',
    };

    // Prepend (newest first)
    store.local_scans.unshift(newScanRecord);
    writeStore(store);

    const attendeeName = attendeeRecord
      ? `${attendeeRecord.first_name || ''} ${attendeeRecord.last_name || ''}`.trim() || 'Delegate'
      : payload.qr_code;

    return {
      success: true,
      data: newScanRecord,
      duplicate: isDuplicateCheckIn,
      message: isDuplicateCheckIn
        ? `Attendee ${attendeeName} was already checked in.`
        : `Scan recorded on Local Hub for ${attendeeName}`,
    };
  },

  getLocalScans(eventId?: number): LocalScanRecord[] {
    const store = readStore();
    if (eventId) {
      return store.local_scans.filter((s) => s.event_id === Number(eventId));
    }
    return store.local_scans;
  },

  getPendingCloudSyncScans(eventId?: number): LocalScanRecord[] {
    const store = readStore();
    return store.local_scans.filter((s) => !s.synced_to_cloud && (!eventId || s.event_id === Number(eventId)));
  },

  markScansSynced(scanIds: (string | number)[]) {
    const store = readStore();
    const idSet = new Set(scanIds.map(String));
    for (const scan of store.local_scans) {
      if (idSet.has(String(scan.id))) {
        scan.synced_to_cloud = true;
      }
    }
    writeStore(store);
  },

  clearPreloadedData(eventId?: number) {
    const store = readStore();
    if (eventId) {
      delete store.preloaded_events[Number(eventId)];
      if (store.active_event_id === Number(eventId)) {
        store.active_event_id = null;
      }
    } else {
      store.preloaded_events = {};
      store.active_event_id = null;
    }
    writeStore(store);
  },
};
