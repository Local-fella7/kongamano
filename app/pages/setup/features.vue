<template>
  <div class="features-page">
    <!-- Page Header -->
    <div class="page-header d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
      <div class="d-flex align-items-center gap-3">
        <div class="header-icon-box">
          <i class="bi bi-toggles"></i>
        </div>
        <div>
          <h2 class="page-heading">System Features & Modules</h2>
          <p class="page-subheading">Manage available module features, their group, and the actions that can be granted to user roles.</p>
        </div>
      </div>
      <button class="btn-create" @click="openCreate">
        <i class="bi bi-plus-lg fs-6"></i>
        <span>New Feature</span>
      </button>
    </div>

    <!-- Reusable Data Table -->
    <CommonDataTable
      v-model:searchQuery="crud.searchQuery.value"
      v-model:currentPage="crud.currentPage.value"
      v-model:perPage="crud.perPage.value"
      :loading="crud.loading.value"
      :totalCount="crud.filteredItems.value.length"
      :totalPages="crud.totalPages.value"
      :startIndex="crud.startIndex.value"
      :endIndex="crud.endIndex.value"
    >
      <table class="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Feature / Module Name</th>
            <th>Feature Group</th>
            <th>Actions Defined</th>
            <th>Created At</th>
            <th class="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in crud.paginatedItems.value" :key="item.id">
            <td class="row-index">{{ (crud.currentPage.value - 1) * crud.perPage.value + index + 1 }}</td>
            <td>
              <div class="item-name-cell">
                <span class="item-badge">
                  <i class="bi bi-box-seam"></i>
                </span>
                <span class="fw-semibold text-slate-900">{{ item.name }}</span>
              </div>
            </td>
            <td class="fs-7">
              <span v-if="groupName(item.feature_group_id)" class="badge bg-green-subtle text-green-700 rounded-pill px-2-5 py-1-5 fs-8">
                {{ groupName(item.feature_group_id) }}
              </span>
              <span v-else class="text-muted fs-8">— Ungrouped</span>
            </td>
            <td class="fs-7">
              <span class="badge bg-slate-100 text-slate-700 rounded-pill px-2-5 py-1-5 fs-8">
                {{ actionsForFeature(item.id).length }}
              </span>
            </td>
            <td class="text-muted fs-7">{{ item.created_at ? formatDate(item.created_at) : '—' }}</td>
            <td class="text-end">
              <div class="action-btns">
                <button class="btn-icon-action btn-manage-actions" @click="openManageActions(item)" title="Manage Actions">
                  <i class="bi bi-lightning-charge-fill"></i>
                </button>
                <button class="btn-icon-action btn-view" @click="openView(item)" title="View Details">
                  <i class="bi bi-eye-fill"></i>
                </button>
                <button class="btn-icon-action btn-edit" @click="openEdit(item)" title="Edit">
                  <i class="bi bi-pencil-fill"></i>
                </button>
                <button class="btn-icon-action btn-delete" @click="confirmDelete(item)" title="Delete">
                  <i class="bi bi-trash-fill"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </CommonDataTable>

    <!-- Manage Actions Modal -->
    <CommonModal
      v-model="showActionsModal"
      :title="`Manage Actions: ${managingFeature?.name || ''}`"
      icon="bi-lightning-charge-fill"
      size="md"
    >
      <div v-if="managingFeature">
        <div v-if="actionsLoading" class="text-center py-4">
          <div class="spinner-border spinner-border-sm text-success" role="status"></div>
        </div>

        <div v-else class="actions-modal-list">
          <div v-if="actionsForFeature(managingFeature.id).length === 0" class="text-muted fs-7 text-center py-4">
            No actions defined for this feature yet.
          </div>

          <div v-for="action in actionsForFeature(managingFeature.id)" :key="action.id" class="action-row">
            <template v-if="editingActionId === action.id">
              <input
                v-model="editingActionName"
                type="text"
                class="form-control form-control-sm"
                autofocus
                @keyup.enter="saveEditAction(action)"
                @keyup.esc="editingActionId = null"
              />
              <button class="btn-icon-action btn-edit" title="Save" @click="saveEditAction(action)">
                <i class="bi bi-check-lg"></i>
              </button>
              <button class="btn-icon-action btn-view" title="Cancel" @click="editingActionId = null">
                <i class="bi bi-x-lg"></i>
              </button>
            </template>
            <template v-else>
              <span class="action-name">
                <i class="bi bi-dot"></i>{{ action.name }}
              </span>
              <button class="btn-icon-action btn-edit" title="Edit" @click="startEditAction(action)">
                <i class="bi bi-pencil-fill"></i>
              </button>
              <button class="btn-icon-action btn-delete" title="Delete" @click="deleteAction(action)">
                <i class="bi bi-trash-fill"></i>
              </button>
            </template>
          </div>

          <!-- Add Action Row -->
          <div class="action-row action-row--add">
            <input
              v-model="newActionName"
              type="text"
              class="form-control form-control-sm"
              placeholder="New action name, e.g. Export, Approve..."
              @keyup.enter="addAction(managingFeature.id)"
            />
            <button class="btn-icon-action btn-edit" title="Add Action" :disabled="!newActionName.trim()" @click="addAction(managingFeature.id)">
              <i class="bi bi-plus-lg"></i>
            </button>
          </div>
        </div>

        <div class="mt-4 text-end">
          <button class="btn-cancel" @click="showActionsModal = false">Close</button>
        </div>
      </div>
    </CommonModal>

    <!-- Create / Edit Modal -->
    <CommonModal
      v-model="showModal"
      :title="editingItem ? 'Edit Feature' : 'New Feature'"
      :icon="editingItem ? 'bi-pencil-square' : 'bi-plus-circle-fill'"
    >
      <form @submit.prevent="handleSubmit">
        <div class="mb-3">
          <label class="form-label fw-semibold text-slate-700">Feature Name <span class="text-danger">*</span></label>
          <input
            v-model="form.name"
            type="text"
            class="form-control"
            :class="{ 'is-invalid': formError }"
            placeholder="e.g. Scannings, Reports, Payments, Users"
            required
            autofocus
          />
          <div v-if="formError" class="invalid-feedback d-block mt-1">{{ formError }}</div>
        </div>

        <div class="mb-4">
          <label class="form-label fw-semibold text-slate-700">Feature Group</label>
          <select v-model="form.feature_group_id" class="form-select">
            <option :value="null">— Ungrouped —</option>
            <option v-for="g in featureGroups" :key="g.id" :value="g.id">{{ g.name }}</option>
          </select>
        </div>

        <div class="modal-footer-row">
          <button type="button" class="btn-cancel" @click="showModal = false">Cancel</button>
          <button type="submit" class="btn-submit" :disabled="crud.saving.value">
            <span v-if="crud.saving.value" class="spinner-border spinner-border-sm me-2"></span>
            {{ editingItem ? 'Save Changes' : 'Create Feature' }}
          </button>
        </div>
      </form>
    </CommonModal>

    <!-- View Details Modal -->
    <CommonModal
      v-model="showViewModal"
      title="Feature Details"
      icon="bi-box-seam"
      size="sm"
    >
      <div v-if="viewingItem" class="p-1">
        <div class="d-flex align-items-center gap-3 p-3 bg-light rounded-3 mb-3">
          <div class="feature-badge" style="width: 40px; height: 40px; font-size: 1.1rem;">
            <i class="bi bi-box-seam"></i>
          </div>
          <div>
            <h6 class="fw-bold text-slate-900 mb-0">{{ viewingItem.name }}</h6>
          </div>
        </div>

        <div class="row g-2 text-slate-700 fs-7">
          <div class="col-6">
            <span class="text-muted d-block fs-8">Feature Group</span>
            <span class="fw-semibold">{{ groupName(viewingItem.feature_group_id) || '— Ungrouped' }}</span>
          </div>
          <div class="col-6">
            <span class="text-muted d-block fs-8">Created At</span>
            <span class="fw-semibold">{{ viewingItem.created_at ? formatDate(viewingItem.created_at) : '—' }}</span>
          </div>
          <div class="col-6">
            <span class="text-muted d-block fs-8">Updated At</span>
            <span class="fw-semibold">{{ viewingItem.updated_at ? formatDate(viewingItem.updated_at) : '—' }}</span>
          </div>
        </div>

        <div class="mt-4 text-end">
          <button class="btn-cancel" @click="showViewModal = false">Close</button>
        </div>
      </div>
    </CommonModal>

    <!-- Delete Confirm Modal -->
    <CommonModal
      v-model="showDeleteModal"
      title="Delete Feature"
      icon="bi-exclamation-triangle-fill"
      variant="danger"
      size="sm"
    >
      <div class="text-center">
        <p class="text-slate-700 fs-6 mb-1">
          Are you sure you want to delete <strong>{{ deletingItem?.name }}</strong>?
        </p>
        <p class="text-muted fs-7 mb-4">This action cannot be undone.</p>
        <div class="modal-footer-row justify-content-center">
          <button class="btn-cancel" @click="showDeleteModal = false">Cancel</button>
          <button class="btn-danger-confirm" @click="handleDelete" :disabled="crud.saving.value">
            <span v-if="crud.saving.value" class="spinner-border spinner-border-sm me-2"></span>
            Yes, Delete
          </button>
        </div>
      </div>
    </CommonModal>
  </div>
</template>

<script setup lang="ts">
import type { Feature } from '~/types/feature';
import type { FeatureGroup } from '~/types/feature-group';
import type { Action } from '~/types/action';

definePageMeta({ layout: 'default' });

const push = usePush();
const { executeOrQueue } = useOfflineSync();

const crud = useCrudApi<Feature>({ endpoint: '/api/features', dataKey: 'features' });

// ── Feature Groups (for the select) ──────────────────
const featureGroups = ref<FeatureGroup[]>([]);

async function fetchFeatureGroups() {
  try {
    const res = await cachedFetch<any>('/api/feature-groups');
    featureGroups.value = Array.isArray(res?.data?.feature_groups)
      ? res.data.feature_groups
      : (Array.isArray(res?.data) ? res.data : []);
  } catch (err) {
    console.error('Failed to load feature groups:', err);
  }
}

function groupName(groupId?: number | null): string {
  if (!groupId) return '';
  const found = featureGroups.value.find((g) => g.id === groupId);
  return found ? found.name : '';
}

// ── Actions (inline management per feature) ──────────
const actions = ref<Action[]>([]);
const actionsLoading = ref(false);
const showActionsModal = ref(false);
const managingFeature = ref<Feature | null>(null);

async function fetchActions() {
  actionsLoading.value = true;
  try {
    const res = await cachedFetch<any>('/api/actions');
    actions.value = Array.isArray(res?.data?.actions)
      ? res.data.actions
      : (Array.isArray(res?.data) ? res.data : []);
  } catch (err) {
    console.error('Failed to load actions:', err);
  } finally {
    actionsLoading.value = false;
  }
}

function actionsForFeature(featureId: number): Action[] {
  return actions.value.filter((a) => a.feature_id === featureId);
}

function openManageActions(feature: Feature) {
  managingFeature.value = feature;
  newActionName.value = '';
  editingActionId.value = null;
  showActionsModal.value = true;
}

const newActionName = ref('');

async function addAction(featureId: number) {
  const name = newActionName.value.trim();
  if (!name) return;

  try {
    await executeOrQueue({
      url: '/api/actions',
      method: 'POST',
      body: { feature_id: featureId, name },
      label: `Create Action "${name}"`,
    });
    push.success({ title: 'Success', message: `Action "${name}" added.` });
    newActionName.value = '';
    await fetchActions();
  } catch (err: any) {
    push.error({ title: 'Error', message: err?.data?.message || 'Failed to add action.' });
  }
}

const editingActionId = ref<number | null>(null);
const editingActionName = ref('');

function startEditAction(action: Action) {
  editingActionId.value = action.id;
  editingActionName.value = action.name;
}

async function saveEditAction(action: Action) {
  const name = editingActionName.value.trim();
  if (!name) return;

  try {
    await executeOrQueue({
      url: `/api/actions/${action.id}`,
      method: 'PUT',
      body: { feature_id: action.feature_id, name },
      label: `Update Action #${action.id}`,
    });
    push.success({ title: 'Success', message: `Action updated to "${name}".` });
    editingActionId.value = null;
    await fetchActions();
  } catch (err: any) {
    push.error({ title: 'Error', message: err?.data?.message || 'Failed to update action.' });
  }
}

async function deleteAction(action: Action) {
  try {
    await executeOrQueue({
      url: `/api/actions/${action.id}`,
      method: 'DELETE',
      label: `Delete Action #${action.id}`,
    });
    push.success({ title: 'Deleted', message: `Action "${action.name}" removed.` });
    await fetchActions();
  } catch (err: any) {
    push.error({ title: 'Error', message: err?.data?.message || 'Failed to delete action.' });
  }
}

// ── Feature CRUD Modals ───────────────────────────────
const showModal = ref(false);
const showViewModal = ref(false);
const showDeleteModal = ref(false);
const viewingItem = ref<Feature | null>(null);
const editingItem = ref<Feature | null>(null);
const deletingItem = ref<Feature | null>(null);

function openView(item: Feature) {
  viewingItem.value = item;
  showViewModal.value = true;
}

const form = reactive<{ name: string; feature_group_id: number | null }>({
  name: '',
  feature_group_id: null,
});
const formError = ref('');

function openCreate() {
  editingItem.value = null;
  form.name = '';
  form.feature_group_id = null;
  formError.value = '';
  showModal.value = true;
}

function openEdit(item: Feature) {
  editingItem.value = item;
  form.name = item.name;
  form.feature_group_id = item.feature_group_id ?? null;
  formError.value = '';
  showModal.value = true;
}

async function handleSubmit() {
  if (!form.name.trim()) {
    formError.value = 'Feature name is required.';
    return;
  }
  formError.value = '';

  const payload = {
    name: form.name,
    feature_group_id: form.feature_group_id,
  };

  let success = false;
  if (editingItem.value) {
    success = await crud.updateItem(
      editingItem.value.id,
      payload,
      `Feature "${form.name}" updated successfully.`
    );
  } else {
    success = await crud.createItem(
      payload,
      `Feature "${form.name}" created successfully.`
    );
  }

  if (success) {
    showModal.value = false;
    form.name = '';
  }
}

function confirmDelete(item: Feature) {
  deletingItem.value = item;
  showDeleteModal.value = true;
}

async function handleDelete() {
  if (!deletingItem.value) return;
  const success = await crud.deleteItem(
    deletingItem.value.id,
    `Feature "${deletingItem.value.name}" has been removed.`
  );
  if (success) {
    showDeleteModal.value = false;
    deletingItem.value = null;
  }
}

onMounted(() => {
  crud.fetchItems();
  fetchFeatureGroups();
  fetchActions();
});
</script>

<style scoped>
.features-page {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 120px);
}

.header-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--green-50);
  color: var(--green-500);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  box-shadow: inset 0 0 0 1px rgba(46, 125, 34, 0.15);
}

.page-heading {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--slate-900);
  margin: 0;
}

.page-subheading {
  font-size: 0.82rem;
  color: var(--slate-500);
  margin: 0.2rem 0 0;
}

.btn-create {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--green-500);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 0.55rem 1.2rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.18s;
}

.btn-create:hover {
  background: var(--green-600);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead tr {
  background: var(--green-50);
  border-bottom: 1.5px solid var(--green-100);
}

.data-table th {
  padding: 0.85rem 1.25rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--green-700);
}

.data-table td {
  padding: 0.9rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
  font-size: 0.875rem;
  color: var(--slate-700);
  vertical-align: middle;
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.data-table tbody tr:hover {
  background: var(--green-50);
}

.row-index {
  color: var(--slate-300);
  font-size: 0.8rem;
  width: 40px;
}

.item-name-cell {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.item-badge {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--green-50);
  color: var(--green-500);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.action-btns {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: flex-end;
}

.btn-icon-action {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.18s;
  background: transparent;
  flex-shrink: 0;
}

.btn-icon-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-view {
  border: 1.5px solid var(--slate-300);
  color: var(--slate-700);
}

.btn-view:hover {
  background: var(--slate-700);
  color: #fff;
  border-color: var(--slate-700);
}

.btn-edit {
  border: 1.5px solid var(--green-500);
  color: var(--green-600);
}

.btn-edit:hover:not(:disabled) {
  background: var(--green-500);
  color: #fff;
}

.btn-delete {
  border: 1.5px solid var(--red-500);
  color: var(--red-500);
}

.btn-delete:hover {
  background: var(--red-500);
  color: #fff;
}

.btn-manage-actions {
  border: 1.5px solid var(--slate-300);
  color: var(--slate-600);
}

.btn-manage-actions:hover {
  background: var(--slate-700);
  color: #fff;
  border-color: var(--slate-700);
}

.bg-slate-100 { background-color: var(--slate-100); }

.modal-footer-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
}

.btn-cancel {
  background: var(--slate-50);
  border: 1px solid var(--color-border);
  border-radius: 9px;
  padding: 0.5rem 1.1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--slate-700);
  cursor: pointer;
  transition: background 0.18s;
}

.btn-cancel:hover {
  background: var(--slate-100);
}

.btn-submit {
  background: var(--green-500);
  border: none;
  border-radius: 9px;
  padding: 0.5rem 1.3rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  transition: background 0.18s;
  display: inline-flex;
  align-items: center;
}

.btn-submit:hover:not(:disabled) {
  background: var(--green-600);
}

.btn-submit:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.btn-danger-confirm {
  background: var(--red-500);
  border: none;
  border-radius: 9px;
  padding: 0.5rem 1.3rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  transition: background 0.18s;
  display: inline-flex;
  align-items: center;
}

.btn-danger-confirm:hover:not(:disabled) {
  background: var(--red-700);
}

.btn-danger-confirm:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.bg-green-subtle { background-color: var(--green-50); }
.text-green-700 { color: var(--green-700); }
.px-2-5 { padding-left: 0.65rem; padding-right: 0.65rem; }
.py-1-5 { padding-top: 0.35rem; padding-bottom: 0.35rem; }

/* ── Manage Actions Modal ──────────────────────────── */
.actions-modal-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  max-height: 50vh;
  overflow-y: auto;
}

.action-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.action-row .form-control {
  flex: 1;
}

.action-name {
  flex: 1;
  font-size: 0.85rem;
  color: var(--slate-700);
  display: flex;
  align-items: center;
}

.action-row--add {
  margin-top: 0.25rem;
  padding-top: 0.5rem;
  border-top: 1px dashed var(--color-border);
}
</style>
