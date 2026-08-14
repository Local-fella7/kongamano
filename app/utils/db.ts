const DB_NAME = 'kongamano_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'keyval';

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!import.meta.client) {
      return reject(new Error('IndexedDB is only available on client-side'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const dbStore = {
  async get(key: string): Promise<any> {
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error('IndexedDB get error:', e);
      return null;
    }
  },

  async set(key: string, val: any): Promise<void> {
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        // Deep clone to strip out any Vue/Nuxt reactive proxies or non-serializable fields
        const cleanVal = JSON.parse(JSON.stringify(val));
        const request = store.put(cleanVal, key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error('IndexedDB set error:', e);
    }
  },

  async delete(key: string): Promise<void> {
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error('IndexedDB delete error:', e);
    }
  },

  async getAll(): Promise<{ key: string; value: any }[]> {
    try {
      const db = await getDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const results: { key: string; value: any }[] = [];
        const request = store.openCursor();
        request.onsuccess = (event: any) => {
          const cursor = event.target.result;
          if (cursor) {
            results.push({ key: cursor.key, value: cursor.value });
            cursor.continue();
          } else {
            resolve(results);
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error('IndexedDB getAll error:', e);
      return [];
    }
  },

  async cacheRegistrations(eventId: number | string, registrations: any[]): Promise<void> {
    await this.set(`registrations_cache_${eventId}`, registrations);
  },

  async getCachedRegistrations(eventId: number | string): Promise<any[] | null> {
    return await this.get(`registrations_cache_${eventId}`);
  },

  async getAllCachedRegistrations(): Promise<any[]> {
    const all = await this.getAll();
    const regCaches = all.filter((item) => String(item.key).startsWith('registrations_cache_'));
    const combined: any[] = [];
    for (const item of regCaches) {
      if (Array.isArray(item.value)) {
        combined.push(...item.value);
      }
    }
    return combined;
  },

  async cacheScanLogs(eventId: number | string, logs: any[]): Promise<void> {
    await this.set(`scannings_cache_${eventId}`, logs);
  },

  async getCachedScanLogs(eventId: number | string): Promise<any[] | null> {
    return await this.get(`scannings_cache_${eventId}`);
  },

  async getAllCachedScanLogs(): Promise<any[]> {
    const all = await this.getAll();
    const logCaches = all.filter((item) => String(item.key).startsWith('scannings_cache_'));
    const combined: any[] = [];
    for (const item of logCaches) {
      if (Array.isArray(item.value)) {
        combined.push(...item.value);
      }
    }
    return combined;
  },

  async cacheEventServices(eventId: number | string, services: any[]): Promise<void> {
    await this.set(`services_cache_${eventId}`, services);
  },

  async getCachedEventServices(eventId: number | string): Promise<any[] | null> {
    return await this.get(`services_cache_${eventId}`);
  },

  async getAllCachedEventServices(): Promise<any[]> {
    const all = await this.getAll();
    const srvCaches = all.filter((item) => String(item.key).startsWith('services_cache_'));
    const combined: any[] = [];
    for (const item of srvCaches) {
      if (Array.isArray(item.value)) {
        combined.push(...item.value);
      }
    }
    return combined;
  }
};
