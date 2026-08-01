import { ref, computed } from 'vue';

export interface CrudOptions<T> {
  endpoint: string; // e.g. '/api/roles'
  dataKey?: string; // e.g. 'roles' if response is { data: { roles: [...] } }
}

export function useCrudApi<T extends { id: number | string }>(options: CrudOptions<T>) {
  const push = usePush();
  const token = useCookie<string | null>('token');

  const items = ref<T[]>([]) as Ref<T[]>;
  const loading = ref(false);
  const saving = ref(false);
  const searchQuery = ref('');
  const currentPage = ref(1);
  const perPage = ref(10);

  function authHeaders() {
    return {
      Authorization: `Bearer ${token.value}`,
      Accept: 'application/json',
    };
  }

  // ── Fetch All ──────────────────────────────────────
  async function fetchItems() {
    loading.value = true;
    try {
      const res = await $fetch<any>(options.endpoint, {
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
      push.error({ title: 'Error', message: err?.data?.message || 'Failed to load data.' });
    } finally {
      loading.value = false;
    }
  }

  // ── Create ─────────────────────────────────────────
  async function createItem(payload: Record<string, any>, successMsg = 'Item created successfully.') {
    saving.value = true;
    try {
      await $fetch(options.endpoint, {
        method: 'POST',
        body: payload,
        headers: authHeaders(),
      });
      push.success({ title: 'Success', message: successMsg });
      await fetchItems();
      return true;
    } catch (err: any) {
      push.error({ title: 'Error', message: err?.data?.message || 'Failed to create item.' });
      return false;
    } finally {
      saving.value = false;
    }
  }

  // ── Update ─────────────────────────────────────────
  async function updateItem(id: number | string, payload: Record<string, any>, successMsg = 'Item updated successfully.') {
    saving.value = true;
    try {
      await $fetch(`${options.endpoint}/${id}`, {
        method: 'PUT',
        body: payload,
        headers: authHeaders(),
      });
      push.success({ title: 'Success', message: successMsg });
      await fetchItems();
      return true;
    } catch (err: any) {
      push.error({ title: 'Error', message: err?.data?.message || 'Failed to update item.' });
      return false;
    } finally {
      saving.value = false;
    }
  }

  // ── Delete ─────────────────────────────────────────
  async function deleteItem(id: number | string, successMsg = 'Item deleted successfully.') {
    saving.value = true;
    try {
      await $fetch(`${options.endpoint}/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      push.success({ title: 'Deleted', message: successMsg });
      await fetchItems();
      return true;
    } catch (err: any) {
      push.error({ title: 'Error', message: err?.data?.message || 'Failed to delete item.' });
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
      list = list.filter((item: any) =>
        Object.values(item).some(
          (val) => val && String(val).toLowerCase().includes(q)
        )
      );
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
