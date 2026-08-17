import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Offline Session Persistence (Q1) & Unique Attendee Deduplication (Q3)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 1. OFFLINE SESSION PERSISTENCE (Q1)
  // ══════════════════════════════════════════════════════════════════════════
  describe('1. Offline Auth Middleware & LocalStorage Token Resilience', () => {
    function runAuthMiddleware(options: {
      toPath: string;
      cookieToken: string | null;
      cookieRoleId: number | null;
      lsToken?: string | null;
      lsRoleId?: string | null;
      isOnline: boolean;
      queryRedirect?: string;
      queryCode?: string;
    }) {
      const { toPath, cookieToken, cookieRoleId, lsToken, lsRoleId, isOnline, queryRedirect, queryCode } = options;

      const tokenRef = { value: cookieToken };
      const roleIdRef = { value: cookieRoleId };

      let activeToken = tokenRef.value;
      let activeRoleId = roleIdRef.value;

      // Simulate client-side hydration from localStorage
      if (!activeToken && lsToken) {
        activeToken = lsToken.trim();
        tokenRef.value = activeToken; // Re-sync cookie
      }
      if ((activeRoleId === null || activeRoleId === undefined) && lsRoleId) {
        activeRoleId = parseInt(lsRoleId, 10);
        roleIdRef.value = activeRoleId; // Re-sync cookie
      }

      const isAdmin = activeRoleId === 1;

      // 1. Not authenticated guard
      if (!activeToken && toPath !== '/login' && toPath !== '/forgot-password') {
        // Offline guard on scan station: do not redirect
        if (!isOnline && (toPath === '/scan' || toPath === '/scannings')) {
          return { allowed: true, syncedCookie: tokenRef.value, syncedRoleId: roleIdRef.value };
        }

        let targetPath = toPath;
        if (toPath === '/scannings' && queryCode) {
          targetPath = `/scan?code=${encodeURIComponent(queryCode)}`;
        }
        return { redirect: { path: '/login', query: { redirect: targetPath } } };
      }

      // 2. Badge Scan Interceptor
      if (toPath === '/scannings' && queryCode) {
        return { redirect: `/scan?code=${queryCode}` };
      }

      // 3. Authenticated on login/forgot-password
      if (activeToken && (toPath === '/login' || toPath === '/forgot-password')) {
        if (queryRedirect) {
          if (queryRedirect.startsWith('/scannings?code=')) {
            const code = queryRedirect.split('/scannings?code=')[1];
            return { redirect: `/scan?code=${code}` };
          }
          if (isAdmin || queryRedirect.startsWith('/scan') || queryRedirect.startsWith('/scannings')) {
            return { redirect: queryRedirect };
          }
        }
        return { redirect: isAdmin ? '/' : '/scan' };
      }

      // 4. Non-admin accessing protected pages
      if (activeToken && !isAdmin && toPath !== '/scannings' && toPath !== '/scan') {
        return { redirect: '/scan' };
      }

      return { allowed: true, syncedCookie: tokenRef.value, syncedRoleId: roleIdRef.value };
    }

    it('re-hydrates session token from localStorage when cookie is empty on page refresh', () => {
      const res = runAuthMiddleware({
        toPath: '/scan',
        cookieToken: null,
        cookieRoleId: null,
        lsToken: 'offline_persisted_jwt_token',
        lsRoleId: '2',
        isOnline: true,
      });

      expect(res.allowed).toBe(true);
      expect(res.syncedCookie).toBe('offline_persisted_jwt_token');
      expect(res.syncedRoleId).toBe(2);
    });

    it('prevents redirecting offline scanner to /login when completely offline without initial token', () => {
      const res = runAuthMiddleware({
        toPath: '/scan',
        cookieToken: null,
        cookieRoleId: null,
        lsToken: null,
        lsRoleId: null,
        isOnline: false,
      });

      expect(res.allowed).toBe(true);
      expect(res.redirect).toBeUndefined();
    });

    it('redirects to /login when online and no token exists in cookies or localStorage', () => {
      const res = runAuthMiddleware({
        toPath: '/scan',
        cookieToken: null,
        cookieRoleId: null,
        lsToken: null,
        lsRoleId: null,
        isOnline: true,
      });

      expect(res.redirect).toEqual({ path: '/login', query: { redirect: '/scan' } });
    });

    it('correctly gates non-admin operators to /scan even when restored from localStorage', () => {
      const res = runAuthMiddleware({
        toPath: '/users',
        cookieToken: null,
        cookieRoleId: null,
        lsToken: 'scanner_token',
        lsRoleId: '2', // Non-admin
        isOnline: true,
      });

      expect(res.redirect).toBe('/scan');
    });

    it('allows admin operators to access admin routes when restored from localStorage', () => {
      const res = runAuthMiddleware({
        toPath: '/users',
        cookieToken: null,
        cookieRoleId: null,
        lsToken: 'admin_token',
        lsRoleId: '1', // Admin
        isOnline: true,
      });

      expect(res.allowed).toBe(true);
      expect(res.redirect).toBeUndefined();
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 2. UNIQUE ATTENDEE DEDUPLICATION & METRICS (Q3)
  // ══════════════════════════════════════════════════════════════════════════
  describe('2. Unique Attendee Deduplication & Real-Time Presence Metrics', () => {
    function computeScanStatistics(logs: any[], servicesList: any[] = []) {
      let totalScans = 0;
      let totalCheckIns = 0;
      let totalCheckOuts = 0;
      let totalServiceScans = 0;

      const uniqueAttendeesSet = new Set<string | number>();
      const attendeeLatestScanMap = new Map<string | number, any>();
      const serviceMap = new Map<string | number, { id: string | number; name: string; count: number }>();

      for (const s of servicesList) {
        if (s && s.id !== undefined && s.id !== null) {
          const sId = Number(s.id);
          serviceMap.set(sId, { id: s.id, name: s.name || `Service #${s.id}`, count: 0 });
        }
      }

      for (const l of logs) {
        totalScans++;

        const regId = l.registration_id || l.registration?.id;
        const qrIdentifier = l.qr_code || l.registration?.qr_code;
        const attendeeKey = regId ? `id_${regId}` : (qrIdentifier ? `qr_${String(qrIdentifier).trim().toLowerCase()}` : null);

        if (attendeeKey) {
          const existingLatest = attendeeLatestScanMap.get(attendeeKey);
          if (!existingLatest) {
            attendeeLatestScanMap.set(attendeeKey, l);
          } else {
            const getLogTime = (logItem: any) => {
              if (logItem.created_at) {
                let p = String(logItem.created_at).trim().replace(' ', 'T');
                if (!/Z|[+-]\d{2}:?\d{2}$/i.test(p)) p += 'Z';
                const t = new Date(p).getTime();
                if (!isNaN(t)) return t;
              }
              return Number(logItem.id) || 0;
            };
            if (getLogTime(l) >= getLogTime(existingLatest)) {
              attendeeLatestScanMap.set(attendeeKey, l);
            }
          }
        }

        const sId = l.service_id ? Number(l.service_id) : (l.service?.id ? Number(l.service.id) : null);
        const sName = l.service?.name || l.service_name || (sId ? `Service #${sId}` : null);

        if (sId) {
          totalServiceScans++;
          if (!serviceMap.has(sId)) {
            serviceMap.set(sId, { id: sId, name: sName || `Service #${sId}`, count: 0 });
          }
          serviceMap.get(sId)!.count += 1;
        } else if (l.scan_type === 'service') {
          totalServiceScans++;
          const genericKey = sName || 'Service Access';
          if (!serviceMap.has(genericKey)) {
            serviceMap.set(genericKey, { id: genericKey, name: genericKey, count: 0 });
          }
          serviceMap.get(genericKey)!.count += 1;
        } else if (l.scan_type === 'check_out') {
          totalCheckOuts++;
        } else {
          totalCheckIns++;
          if (attendeeKey) {
            uniqueAttendeesSet.add(attendeeKey);
          }
        }
      }

      let currentlyInside = 0;
      for (const [key, latestLog] of attendeeLatestScanMap.entries()) {
        if (latestLog && latestLog.scan_type !== 'check_out' && uniqueAttendeesSet.has(key)) {
          currentlyInside++;
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
      };
    }

    it('counts single delegate with multiple re-entries as 1 Unique Attendee', () => {
      // Scenario: Delegate #101 checks in, claims lunch, checks out, and checks in again (re-entry)
      const logs = [
        { id: 4, registration_id: 101, qr_code: 'REG-1-101', scan_type: 'check_in' },     // Latest action: re-entry
        { id: 3, registration_id: 101, qr_code: 'REG-1-101', scan_type: 'check_out' },
        { id: 2, registration_id: 101, qr_code: 'REG-1-101', scan_type: 'service', service_id: 1 },
        { id: 1, registration_id: 101, qr_code: 'REG-1-101', scan_type: 'check_in' },     // Morning check-in
      ];

      const stats = computeScanStatistics(logs);

      expect(stats.totalScans).toBe(4);
      expect(stats.totalCheckIns).toBe(2);             // 2 check-in transactions
      expect(stats.uniqueAttendeesCount).toBe(1);      // 1 unique attendee
      expect(stats.currentlyInside).toBe(1);           // Delegate is currently inside
      expect(stats.totalCheckOuts).toBe(1);
      expect(stats.totalServiceScans).toBe(1);
    });

    it('reflects currentlyInside as 0 when attendee has checked out', () => {
      const logs = [
        { id: 2, registration_id: 102, qr_code: 'REG-1-102', scan_type: 'check_out' },
        { id: 1, registration_id: 102, qr_code: 'REG-1-102', scan_type: 'check_in' },
      ];

      const stats = computeScanStatistics(logs);

      expect(stats.totalScans).toBe(2);
      expect(stats.totalCheckIns).toBe(1);
      expect(stats.uniqueAttendeesCount).toBe(1);      // Attended today
      expect(stats.currentlyInside).toBe(0);           // Not inside right now
      expect(stats.totalCheckOuts).toBe(1);
    });

    it('correctly aggregates complex multi-attendee event logs', () => {
      const logs = [
        // Delegate A: currently inside
        { id: 7, registration_id: 1, qr_code: 'REG-1-001', scan_type: 'check_in' },
        // Delegate B: checked out
        { id: 6, registration_id: 2, qr_code: 'REG-1-002', scan_type: 'check_out' },
        { id: 5, registration_id: 2, qr_code: 'REG-1-002', scan_type: 'service', service_id: 10 },
        { id: 4, registration_id: 2, qr_code: 'REG-1-002', scan_type: 'check_in' },
        // Delegate C: currently inside (morning check-in + service)
        { id: 3, registration_id: 3, qr_code: 'REG-1-003', scan_type: 'service', service_id: 10 },
        { id: 2, registration_id: 3, qr_code: 'REG-1-003', scan_type: 'check_in' },
        // Delegate D: never checked in, only scanned QR matching identifier
        { id: 1, qr_code: 'BADGE-999', scan_type: 'check_in' },
      ];

      const stats = computeScanStatistics(logs);

      expect(stats.totalScans).toBe(7);
      expect(stats.totalCheckIns).toBe(4);
      expect(stats.uniqueAttendeesCount).toBe(4); // A, B, C, D
      expect(stats.currentlyInside).toBe(3);      // A, C, D (B checked out)
      expect(stats.totalCheckOuts).toBe(1);
      expect(stats.totalServiceScans).toBe(2);
    });
  });
});
