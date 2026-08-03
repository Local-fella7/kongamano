export async function cachedFetch<T = any>(url: string, opts?: any): Promise<T> {
  const cacheKey = `kongamano_get_cache_${url}`;

  // Serve cached version immediately if client-side and offline
  if (import.meta.client && !navigator.onLine) {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error('Failed to parse cached data for:', url, e);
      }
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
      localStorage.setItem(cacheKey, JSON.stringify(res));
    }
    return res;
  } catch (err) {
    // Fallback to cache if network call fails
    if (import.meta.client) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {
          console.error('Failed to parse cached fallback data for:', url, e);
        }
      }
    }
    throw err;
  }
}
