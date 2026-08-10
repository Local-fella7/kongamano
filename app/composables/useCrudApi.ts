import { ref, computed } from 'vue';

export interface CrudOptions<T> {
  endpoint: string; // e.g. '/api/roles'
  dataKey?: string; // e.g. 'roles' if response is { data: { roles: [...] } }
  searchFields?: (keyof T)[]; // restrict search matching to these fields instead of all fields
}

export function useCrudApi<T extends { id: number | string }>(options: CrudOptions<T>) {
  const push = usePush();
  const token = useCookie<string | null>('token');

  const { executeOrQueue } = useOfflineSync();

  const items = ref<T[]>([]) as Ref<T[]>;
  const loading = ref(false);
  const saving = ref(false);
  const searchQuery = ref('');
  const currentPage = ref(1);
  const perPage = ref(10);
  const error = ref<string | null>(null);

  function authHeaders() {
    return {
      Authorization: `Bearer ${token.value}`,
      Accept: 'application/json',
    };
  }

  // ── Fetch All ──────────────────────────────────────
  async function fetchItems(params?: Record<string, any>) {
    loading.value = true;
    error.value = null;
    try {
      const res = await cachedFetch<any>(options.endpoint, {
        params,
        headers: authHeaders(),
      });

      let rawList: T[] = [];
      if (options.dataKey && Array.isArray(res?.data?.[options.dataKey])) {
        rawList = res.data[options.dataKey];
      } else if (Array.isArray(res?.data)) {
        rawList = res.data;
      } else if (Array.isArray(res)) {
        rawList = res;
      }

      items.value = rawList;
    } catch (err: any) {
      console.error(`[CRUD ${options.endpoint}] Fetch error:`, err);
      error.value = err?.data?.message || 'Failed to load data.';
      // Only show error notification if we are online (so we don't alert spam while offline)
      if (import.meta.client && navigator.onLine) {
        push.error({ title: 'Error', message: error.value });
      }
    } finally {
      loading.value = false;
    }
  }

  // ── Create ─────────────────────────────────────────
  async function createItem(payload: Record<string, any>, successMsg = 'Item created successfully.') {
    saving.value = true;
    error.value = null;
    try {
      const entity = options.dataKey ? (options.dataKey.endsWith('s') ? options.dataKey.slice(0, -1) : options.dataKey) : 'item';
      const label = `Create ${entity.charAt(0).toUpperCase() + entity.slice(1)}`;

      const res = await executeOrQueue({
        url: options.endpoint,
        method: 'POST',
        body: payload,
        label,
      });

      if (res.queued) {
        return true;
      }

      push.success({ title: 'Success', message: successMsg });
      await fetchItems();
      return true;
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to create item.';
      push.error({ title: 'Error', message: error.value });
      return false;
    } finally {
      saving.value = false;
    }
  }

  // ── Update ─────────────────────────────────────────
  async function updateItem(id: number | string, payload: Record<string, any>, successMsg = 'Item updated successfully.') {
    saving.value = true;
    error.value = null;
    try {
      const entity = options.dataKey ? (options.dataKey.endsWith('s') ? options.dataKey.slice(0, -1) : options.dataKey) : 'item';
      const label = `Update ${entity.charAt(0).toUpperCase() + entity.slice(1)} #${id}`;

      // Extract original updated_at from memory for offline conflict detection
      const baseItem = items.value.find((i: any) => String(i.id) === String(id));
      const bodyWithMetadata = {
        ...payload,
        ...(baseItem?.updated_at ? { updated_at: baseItem.updated_at } : {}),
      };

      const res = await executeOrQueue({
        url: `${options.endpoint}/${id}`,
        method: 'PUT',
        body: bodyWithMetadata,
        label,
      });

      if (res.queued) {
        return true;
      }

      push.success({ title: 'Success', message: successMsg });
      await fetchItems();
      return true;
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to update item.';
      push.error({ title: 'Error', message: error.value });
      return false;
    } finally {
      saving.value = false;
    }
  }

  // ── Delete ─────────────────────────────────────────
  async function deleteItem(id: number | string, successMsg = 'Item deleted successfully.') {
    saving.value = true;
    error.value = null;
    try {
      const entity = options.dataKey ? (options.dataKey.endsWith('s') ? options.dataKey.slice(0, -1) : options.dataKey) : 'item';
      const label = `Delete ${entity.charAt(0).toUpperCase() + entity.slice(1)} #${id}`;

      // Extract original updated_at from memory for offline conflict detection
      const baseItem = items.value.find((i: any) => String(i.id) === String(id));

      const res = await executeOrQueue({
        url: `${options.endpoint}/${id}`,
        method: 'DELETE',
        body: baseItem?.updated_at ? { updated_at: baseItem.updated_at } : undefined,
        label,
      });

      if (res.queued) {
        return true;
      }

      push.success({ title: 'Deleted', message: successMsg });
      await fetchItems();
      return true;
    } catch (err: any) {
      error.value = err?.data?.message || 'Failed to delete item.';
      push.error({ title: 'Error', message: error.value });
      return false;
    } finally {
      saving.value = false;
    }
  }

  // ── Filtering & Pagination ─────────────────────────
  const filteredItems = computed(() => {
    let list = [...items.value];
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim();
      list = list.filter((item: any) => {
        const values = options.searchFields
          ? options.searchFields.map((field) => item[field])
          : Object.values(item);
        return values.some((val) => val && String(val).toLowerCase().includes(q));
      });
    }
    // Sort descending by ID
    list.sort((a, b) => Number(b.id) - Number(a.id));
    return list;
  });

  const totalPages = computed(() => Math.ceil(filteredItems.value.length / perPage.value) || 1);
  const startIndex = computed(() => (currentPage.value - 1) * perPage.value);
  const endIndex = computed(() => startIndex.value + perPage.value);
  const paginatedItems = computed(() => filteredItems.value.slice(startIndex.value, endIndex.value));

  watch([searchQuery, perPage], () => {
    currentPage.value = 1;
  });

  return {
    items,
    loading,
    saving,
    error,
    searchQuery,
    currentPage,
    perPage,
    filteredItems,
    paginatedItems,
    totalPages,
    startIndex,
    endIndex,
    fetchItems,
    createItem,
    updateItem,
    deleteItem,
  };
}
