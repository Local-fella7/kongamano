import { dbStore } from './db';

export async function cachedFetch<T = any>(url: string, opts?: any): Promise<T> {
  const cacheKey = `kongamano_get_cache_${url}`;

  // Serve cached version immediately if client-side and offline
  if (import.meta.client && !navigator.onLine) {
    const cached = await dbStore.get(cacheKey);
    if (cached) {
      return cached;
    }
  }

  // Get token client-side from document.cookie safely without Nuxt composables
  let tokenVal = '';
  if (import.meta.client) {
    const match = document.cookie.match(new RegExp('(^| )token=([^;]*)'));
    if (match) {
      tokenVal = match[2];
    }
  }

  try {
    const res = await $fetch<T>(url, {
      ...opts,
      headers: {
        ...(tokenVal ? { Authorization: `Bearer ${tokenVal}` } : {}),
        Accept: 'application/json',
        ...opts?.headers,
      },
    });

    // Save success response to local cache
    if (import.meta.client && res) {
      await dbStore.set(cacheKey, res);
    }
    return res;
  } catch (err) {
    // If online server returned an error, clear cache so stale state is never served
    if (import.meta.client && navigator.onLine) {
      await dbStore.delete(cacheKey);
    } else if (import.meta.client) {
      const cached = await dbStore.get(cacheKey);
      if (cached) {
        return cached;
      }
    }
    throw err;
  }
}
