export interface QueuedAction {
  id: string;
  url: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body: any;
  label: string;
  createdAt: string;
  retryCount: number;
}

const STORAGE_KEY = 'kongamano_offline_queue';

export function useOfflineSync() {
  const isOnline = ref(true);
  const queue = ref<QueuedAction[]>([]);
  const isSyncing = ref(false);
  const lastSyncTime = ref<string | null>(null);

  const push = usePush(); // Notivue notification engine
  const token = useCookie('token');

  // Load queue from localStorage
  function loadQueue() {
    if (import.meta.client) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          queue.value = JSON.parse(raw);
        }
      } catch (err) {
        console.error('Failed to parse offline queue:', err);
        queue.value = [];
      }
    }
  }

  // Save queue to localStorage
  function saveQueue() {
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue.value));
    }
  }

  // Process all queued items when online
  async function processQueue() {
    if (!isOnline.value || isSyncing.value || queue.value.length === 0) {
      return;
    }

    isSyncing.value = true;
    const itemsToProcess = [...queue.value];
    let successCount = 0;
    let failCount = 0;

    for (const item of itemsToProcess) {
      try {
        await $fetch(item.url, {
          method: item.method,
          body: item.body,
          headers: {
            ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
            Accept: 'application/json',
          },
        });

        // Remove successfully synced item
        queue.value = queue.value.filter((q) => q.id !== item.id);
        saveQueue();
        successCount++;
      } catch (err: any) {
        console.error(`Failed to sync queued action [${item.label}]:`, err);
        item.retryCount = (item.retryCount || 0) + 1;
        failCount++;
        saveQueue();
      }
    }

    isSyncing.value = false;
    lastSyncTime.value = new Date().toLocaleTimeString();

    if (successCount > 0) {
      push.success({
        title: 'Offline Sync Complete',
        message: `Successfully synced ${successCount} queued item(s) to the server.`,
      });
    }

    if (failCount > 0) {
      push.warning({
        title: 'Sync Partial Failure',
        message: `${failCount} item(s) failed to sync and will retry on next connection.`,
      });
    }
  }

  // Execute request immediately if online, or queue if offline
  async function executeOrQueue(options: {
    url: string;
    method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: any;
    label: string;
  }): Promise<{ success: boolean; data?: any; queued?: boolean; message?: string }> {
    const method = options.method || 'POST';

    // If online, attempt direct network request
    if (isOnline.value) {
      try {
        const response = await $fetch<any>(options.url, {
          method,
          body: options.body,
          headers: {
            ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
            Accept: 'application/json',
          },
        });
        return { success: true, data: response };
      } catch (err: any) {
        // If request failed specifically due to network loss, fallback to queue
        if (!navigator.onLine || err?.message?.includes('fetch failed') || err?.name === 'FetchError') {
          return queueItem(options.url, method, options.body, options.label);
        }
        throw err;
      }
    } else {
      // Offline -> directly queue action
      return queueItem(options.url, method, options.body, options.label);
    }
  }

  // Internal helper to push item into queue
  function queueItem(url: string, method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', body: any, label: string) {
    const newItem: QueuedAction = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      url,
      method,
      body,
      label,
      createdAt: new Date().toISOString(),
      retryCount: 0,
    };

    queue.value.push(newItem);
    saveQueue();

    push.info({
      title: 'Action Queued Offline',
      message: `"${label}" was saved locally. It will auto-sync when connection is restored.`,
    });

    return {
      success: true,
      queued: true,
      message: `Action "${label}" queued offline.`,
    };
  }

  // Initialize listeners
  function init() {
    if (import.meta.client) {
      isOnline.value = navigator.onLine;
      loadQueue();

      window.addEventListener('online', () => {
        isOnline.value = true;
        push.info({ title: 'Online', message: 'Connection restored. Processing offline queue...' });
        processQueue();
      });

      window.addEventListener('offline', () => {
        isOnline.value = false;
        push.warning({ title: 'Offline Mode', message: 'Network connection lost. Actions will be queued locally.' });
      });

      // Auto-trigger sync on mount if online & pending items exist
      if (isOnline.value && queue.value.length > 0) {
        processQueue();
      }
    }
  }

  onMounted(() => {
    init();
  });

  return {
    isOnline,
    queue,
    isSyncing,
    lastSyncTime,
    executeOrQueue,
    processQueue,
  };
}
