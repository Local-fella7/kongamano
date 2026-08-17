import { defineEventHandler, readBody, createError } from 'h3';
import { localHubStore } from '../../utils/localHubStore';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const eventId = Number(body?.event_id);

  if (!eventId || isNaN(eventId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'event_id is required to preload offline data',
    });
  }

  const config = useRuntimeConfig(event);
  const apiBase = config.apiBase.replace(/\/+$/, '');
  const authHeader = getHeader(event, 'authorization');

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(authHeader ? { Authorization: authHeader } : {}),
  };

  try {
    // 1. Fetch Event Info, Registrations, and Services in parallel from Cloud API
    const [eventRes, regRes, srvRes] = await Promise.all([
      $fetch<any>(`${apiBase}/api/events/${eventId}`, { headers }).catch((e) => {
        console.warn('Failed to fetch event detail, trying list fallback:', e?.message);
        return $fetch<any>(`${apiBase}/api/events`, { headers }).catch(() => null);
      }),
      $fetch<any>(`${apiBase}/api/registrations?event_id=${eventId}`, { headers }).catch((e) => {
        console.error('Failed to fetch registrations:', e);
        return null;
      }),
      $fetch<any>(`${apiBase}/api/event-services?event_id=${eventId}`, { headers }).catch((e) => {
        console.warn('Failed to fetch services:', e);
        return null;
      }),
    ]);

    let eventInfo = eventRes?.data?.event || eventRes?.data;
    if (Array.isArray(eventInfo)) {
      eventInfo = eventInfo.find((e: any) => Number(e.id) === eventId);
    } else if (Array.isArray(eventRes?.data?.events)) {
      eventInfo = eventRes.data.events.find((e: any) => Number(e.id) === eventId);
    }

    const attendees = Array.isArray(regRes?.data?.registrations)
      ? regRes.data.registrations
      : (Array.isArray(regRes?.data) ? regRes.data : []);

    const rawServices = Array.isArray(srvRes?.data?.event_services)
      ? srvRes.data.event_services
      : (Array.isArray(srvRes?.data) ? srvRes.data : []);

    const services = rawServices.map((es: any) => ({
      id: es.service_id || es.service?.id || es.id,
      name: es.name || es.service?.name || `Service #${es.service_id || es.id}`,
      start_time: es.start_time || es.service?.start_time || null,
      end_time: es.end_time || es.service?.end_time || null,
      requires_scan: es.requires_scan !== undefined ? es.requires_scan : (es.service?.requires_scan ?? true),
      description: es.description || es.service?.description || '',
    }));

    const snapshot = localHubStore.savePreloadedEvent(
      eventId,
      eventInfo || { id: eventId, name: `Event #${eventId}` },
      attendees,
      services
    );

    return {
      success: true,
      message: `Successfully preloaded ${attendees.length} attendees and ${services.length} services for ${eventInfo?.name || `Event #${eventId}`}.`,
      data: snapshot,
    };
  } catch (err: any) {
    console.error('Error preloading event on Local Hub:', err);
    throw createError({
      statusCode: 502,
      statusMessage: `Failed to download event from cloud server: ${err?.message || 'Network error'}`,
    });
  }
});
