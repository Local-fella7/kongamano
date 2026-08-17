import { defineEventHandler, getQuery } from 'h3';
import { localHubStore } from '~/server/utils/localHubStore';

export default defineEventHandler((event) => {
  const query = getQuery(event);
  const eventId = query.event_id ? Number(query.event_id) : undefined;
  const scans = localHubStore.getLocalScans(eventId);

  return {
    success: true,
    data: {
      scannings: scans,
      total: scans.length,
    },
  };
});
