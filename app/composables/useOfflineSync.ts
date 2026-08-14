import { ref, onMounted } from 'vue';
import { dbStore } from '~/utils/db';
import { apiPath } from '~/utils/api';

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

// Get or initialize global state on window to guarantee 100% singleton behavior
// even if the bundler re-evaluates the module scope or splits code in Dev mode.
function getGlobalSyncState() {
  if (import.meta.client) {
    if (!(window as any).__kongamano_offline_sync__) {
      (window as any).__kongamano_offline_sync__ = {
        isOnline: ref(navigator.onLine),
        queue: ref<QueuedAction[]>([]),
        isSyncing: ref(false),
        lastSyncTime: ref<string | null>(null),
        listenersInitialized: false,
      };
    }
    return (window as any).__kongamano_offline_sync__;
  }
  // Server-side fallback state
  return {
    isOnline: ref(true),
    queue: ref<QueuedAction[]>([]),
    isSyncing: ref(false),
    lastSyncTime: ref<string | null>(null),
    listenersInitialized: false,
  };
}

export function useOfflineSync() {
  const syncState = getGlobalSyncState();
  const isOnline = syncState.isOnline;
  const queue = syncState.queue;
  const isSyncing = syncState.isSyncing;
  const lastSyncTime = syncState.lastSyncTime;

  const push = usePush(); // Notivue notification engine
  const token = useCookie('token');

  // Load queue from IndexedDB
  async function loadQueue() {
    if (import.meta.client) {
      const stored = await dbStore.get(STORAGE_KEY);
      if (Array.isArray(stored)) {
        queue.value = stored;
      } else {
        queue.value = [];
      }
    }
  }

  // Save queue to IndexedDB
  async function saveQueue() {
    if (import.meta.client) {
      await dbStore.set(STORAGE_KEY, JSON.parse(JSON.stringify(queue.value)));
    }
  }

  // Process all queued items when online
  async function processQueue() {
    // Ground truth online check
    if (import.meta.client && typeof navigator !== 'undefined') {
      isOnline.value = navigator.onLine;
    }

    if (!isOnline.value || isSyncing.value || queue.value.length === 0) {
      return;
    }

    isSyncing.value = true;
    const itemsToProcess = [...queue.value];
    let successCount = 0;
    let failCount = 0;

    for (const item of itemsToProcess) {
      try {
        // ── Conflict Detection ──────────────────
        // If updating or deleting, and the client queued body contains updated_at,
        // check if the server has a newer modification to prevent silent data loss.
        if ((item.method === 'PUT' || item.method === 'DELETE') && item.body && item.body.updated_at) {
          try {
            const serverItem = await $fetch<any>(apiPath(item.url), {
              headers: {
                ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
                'Content-Type': 'application/json',
                Accept: 'application/json',
              },
            });
            const serverUpdatedAt = serverItem?.data?.updated_at || serverItem?.updated_at;
            if (serverUpdatedAt && serverUpdatedAt !== item.body.updated_at) {
              console.warn(`[Sync Conflict] Skipping ${item.label} to prevent data loss. Server: ${serverUpdatedAt}, Client: ${item.body.updated_at}`);
              push.error({
                title: 'Sync Conflict',
                message: `"${item.label}" was edited by someone else on the server. Action skipped.`,
              });

              // Remove conflicted action to unblock queue
              queue.value = queue.value.filter((q) => q.id !== item.id);
              await saveQueue();
              failCount++;
              continue;
            }
          } catch (e) {
            console.error('Failed to run conflict check fetch (ignoring):', e);
          }
        }

        await $fetch(apiPath(item.url), {
          method: item.method,
          body: item.body,
          headers: {
            ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        });

        // Remove successfully synced item from shared queue
        queue.value = queue.value.filter((q) => q.id !== item.id);
        await saveQueue();
        successCount++;
      } catch (err: any) {
        console.error(`Failed to sync queued action [${item.label}]:`, err);
        const statusCode = err?.status || err?.statusCode;

        if (statusCode === 401 || statusCode === 403) {
          // Authentication issue — keep in queue so scans are not lost when session expires
          push.error({
            title: 'Authentication Required',
            message: 'Session expired or not authorized. Please log in to sync offline scans.',
          });
          item.retryCount = (item.retryCount || 0) + 1;
          failCount++;
        } else if (statusCode === 400 || statusCode === 422) {
          // Permanent logical/validation errors - discard to avoid blocking the queue
          push.error({
            title: `Sync Failed: ${item.label}`,
            message: err?.data?.message || 'Data validation failed on the server. Action discarded.',
          });
          queue.value = queue.value.filter((q) => q.id !== item.id);
          await saveQueue();
        } else {
          // Temporary server/network errors - keep in queue for future retry
          item.retryCount = (item.retryCount || 0) + 1;
          failCount++;
        }
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

    // Check navigator.onLine as the ground truth
    const currentlyOnline = import.meta.client ? navigator.onLine : true;
    isOnline.value = currentlyOnline;

    if (currentlyOnline) {
      try {
        const response = await $fetch<any>(apiPath(options.url), {
          method,
          body: options.body,
          headers: {
            ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        });
        return { success: true, data: response };
      } catch (err: any) {
        // Only fallback to queue if it's a true network disconnection error
        // (no status code, status 0, or navigator is offline).
        // Let server errors (500, 502) or validation errors (422) propagate normally.
        const isNetworkError = !currentlyOnline || !err?.status || err?.status === 0 || err?.message?.includes('fetch failed');
        if (isNetworkError) {
          isOnline.value = false;
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
  async function queueItem(url: string, method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', body: any, label: string) {
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
    await saveQueue();

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
  async function init() {
    if (import.meta.client) {
      isOnline.value = navigator.onLine;
      await loadQueue();

      if (!syncState.listenersInitialized) {
        syncState.listenersInitialized = true;

        window.addEventListener('online', () => {
          const wasOffline = !isOnline.value;
          isOnline.value = true;
          if (wasOffline) {
            push.info({ title: 'Online', message: 'Connection restored. Processing offline queue...' });
          }
          processQueue();
        });

        window.addEventListener('offline', () => {
          isOnline.value = false;
          push.warning({ title: 'Offline Mode', message: 'Network connection lost. Actions will be queued locally.' });
        });

        // Periodic heartbeat check in case browser missed the online event
        setInterval(() => {
          if (navigator.onLine) {
            isOnline.value = true;
            if (queue.value.length > 0 && !isSyncing.value) {
              processQueue();
            }
          }
        }, 15000);
      }

      // Auto-trigger sync on mount if online & pending items exist
      if (isOnline.value && queue.value.length > 0 && !isSyncing.value) {
        processQueue();
      }
    }
  }

  onMounted(async () => {
    await init();
  });

  const pendingCount = computed(() => queue.value.length);

  return {
    isOnline,
    queue,
    isSyncing,
    lastSyncTime,
    pendingCount,
    executeOrQueue,
    processQueue,
  };
}
