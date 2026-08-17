import { defineEventHandler, proxyRequest, readBody, getQuery } from 'h3';
import { localHubStore } from '~/server/utils/localHubStore';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const apiBase = config.apiBase.replace(/\/+$/, '');
  const targetUrl = `${apiBase}${event.path}`;
  const method = event.method;
  const path = event.path || '';

  try {
    return await proxyRequest(event, targetUrl);
  } catch (err: any) {
    // When cloud server is unreachable (0% internet at venue), serve from Local Hub fallback
    console.warn(`[Local Hub Proxy Fallback] Cloud request failed for ${method} ${path}:`, err?.message);

    // 1. Handling Scan Recording POST (/api/events/:id/scannings)
    if (method === 'POST' && path.includes('/scannings')) {
      try {
        const body = await readBody(event);
        const match = path.match(/\/events\/(\d+)\/scannings/i);
        const eventId = match ? parseInt(match[1], 10) : Number(body?.event_id || 1);

        const result = localHubStore.recordLocalScan({
          qr_code: body?.qr_code,
          scan_type: body?.scan_type || 'check_in',
          service_id: body?.service_id,
          event_id: eventId,
          station_ip: getRequestIP(event, { xForwardedFor: true }) || 'local-tablet',
        });

        return {
          success: true,
          message: result.message,
          data: result.data,
          duplicate: result.duplicate,
          local_hub: true,
        };
      } catch (localErr: any) {
        return {
          success: false,
          message: localErr?.message || 'Failed to record scan on Local Hub',
          local_hub: true,
        };
      }
    }

    // 2. Handling Scan Logs GET (/api/scannings or /api/events/:id/scannings)
    if (method === 'GET' && path.includes('/scannings')) {
      const query = getQuery(event);
      const match = path.match(/\/events\/(\d+)\/scannings/i);
      const eventId = match ? parseInt(match[1], 10) : (query.event_id ? Number(query.event_id) : undefined);
      const localScans = localHubStore.getLocalScans(eventId);

      return {
        success: true,
        data: {
          scannings: localScans,
          total: localScans.length,
        },
        local_hub: true,
      };
    }

    // 3. Handling Registrations GET (/api/registrations)
    if (method === 'GET' && path.includes('/registrations')) {
      const query = getQuery(event);
      const eventId = Number(query.event_id || 1);
      const snapshot = localHubStore.getPreloadedEvent(eventId);

      return {
        success: true,
        data: {
          registrations: snapshot?.attendees || [],
          total: snapshot?.attendees?.length || 0,
        },
        local_hub: true,
      };
    }

    // 4. Handling Event Services GET (/api/event-services)
    if (method === 'GET' && path.includes('/event-services')) {
      const query = getQuery(event);
      const eventId = Number(query.event_id || 1);
      const snapshot = localHubStore.getPreloadedEvent(eventId);

      return {
        success: true,
        data: {
          event_services: snapshot?.services || [],
          total: snapshot?.services?.length || 0,
        },
        local_hub: true,
      };
    }

    // 5. Handling Events List GET (/api/events)
    if (method === 'GET' && (path === '/api/events' || path.startsWith('/api/events?'))) {
      const hubInfo = localHubStore.getHubInfo();
      const events = hubInfo.preloaded_events.map((e) => ({
        id: e.event_id,
        name: e.name,
        total_registrations: e.attendees_count,
        services_count: e.services_count,
      }));

      return {
        success: true,
        data: {
          events,
          total: events.length,
        },
        local_hub: true,
      };
    }

    // If no local fallback applies, rethrow the original error
    throw err;
  }
});
