import { defineEventHandler, readBody, createError } from 'h3';
import { localHubStore } from '../../utils/localHubStore';

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}));
  const eventId = body?.event_id ? Number(body.event_id) : undefined;

  const pendingScans = localHubStore.getPendingCloudSyncScans(eventId);
  if (pendingScans.length === 0) {
    return {
      success: true,
      message: 'All local scans are already synced with the cloud server.',
      synced_count: 0,
    };
  }

  const config = useRuntimeConfig(event);
  const apiBase = config.apiBase.replace(/\/+$/, '');
  const authHeader = getHeader(event, 'authorization');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(authHeader ? { Authorization: authHeader } : {}),
  };

  const syncedIds: (string | number)[] = [];
  const errors: { id: string | number; error: string }[] = [];

  for (const scan of pendingScans) {
    try {
      const endpoint = `${apiBase}/api/events/${scan.event_id}/scannings`;
      const validBackendScanType = scan.scan_type === 'check_out' ? 'check_out' : 'check_in';

      const payload: Record<string, any> = {
        qr_code: scan.qr_code,
        scan_type: validBackendScanType,
        event_id: scan.event_id,
      };
      if (scan.service_id) {
        payload.service_id = scan.service_id;
      }

      await $fetch(endpoint, {
        method: 'POST',
        body: payload,
        headers,
      });

      syncedIds.push(scan.id);
    } catch (err: any) {
      // If 409 or already recorded, mark as synced to prevent blocking queue
      const status = err?.status || err?.statusCode;
      if (status === 409 || status === 422) {
        syncedIds.push(scan.id);
      } else {
        errors.push({ id: scan.id, error: err?.data?.message || err?.message || 'Failed' });
      }
    }
  }

  if (syncedIds.length > 0) {
    localHubStore.markScansSynced(syncedIds);
  }

  return {
    success: true,
    message: `Synced ${syncedIds.length} of ${pendingScans.length} scans to cloud.`,
    synced_count: syncedIds.length,
    failed_count: errors.length,
    errors,
  };
});
