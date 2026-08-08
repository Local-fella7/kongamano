<template>
  <div class="feature-groups-page">
    <!-- Page Header -->
    <div class="page-header d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
      <div class="d-flex align-items-center gap-3">
        <div class="header-icon-box">
          <i class="bi bi-diagram-3-fill"></i>
        </div>
        <div>
          <h2 class="page-heading">Feature Groups</h2>
          <p class="page-subheading">Organize system features into logical groups for the RBAC permission structure.</p>
        </div>
      </div>
      <button class="btn-create" @click="openCreate">
        <i class="bi bi-plus-lg fs-6"></i>
        <span>New Feature Group</span>
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
            <th>Feature Group Name</th>
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
                  <i class="bi bi-diagram-3-fill"></i>
                </span>
                <span class="fw-semibold text-slate-900">{{ item.name }}</span>
              </div>
            </td>
            <td class="text-muted fs-7">{{ item.created_at ? formatDate(item.created_at) : '—' }}</td>
            <td class="text-end">
              <div class="action-btns">
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

    <!-- Create / Edit Modal -->
    <CommonModal
      v-model="showModal"
      :title="editingItem ? 'Edit Feature Group' : 'New Feature Group'"
      :icon="editingItem ? 'bi-pencil-square' : 'bi-plus-circle-fill'"
    >
      <form @submit.prevent="handleSubmit">
        <div class="mb-4">
          <label class="form-label fw-semibold text-slate-700">Group Name <span class="text-danger">*</span></label>
          <input
            v-model="form.name"
            type="text"
            class="form-control"
            :class="{ 'is-invalid': formError }"
            placeholder="e.g. Finance, Operations, Administration"
            required
            autofocus
          />
          <div v-if="formError" class="invalid-feedback d-block mt-1">{{ formError }}</div>
        </div>

        <div class="modal-footer-row">
          <button type="button" class="btn-cancel" @click="showModal = false">Cancel</button>
          <button type="submit" class="btn-submit" :disabled="crud.saving.value">
            <span v-if="crud.saving.value" class="spinner-border spinner-border-sm me-2"></span>
            {{ editingItem ? 'Save Changes' : 'Create Feature Group' }}
          </button>
        </div>
      </form>
    </CommonModal>

    <!-- View Details Modal -->
    <CommonModal
      v-model="showViewModal"
      title="Feature Group Details"
      icon="bi-diagram-3-fill"
      size="sm"
    >
      <div v-if="viewingItem" class="p-1">
        <div class="d-flex align-items-center gap-3 p-3 bg-light rounded-3 mb-3">
          <div class="item-badge" style="width: 40px; height: 40px; font-size: 1.1rem;">
            <i class="bi bi-diagram-3-fill"></i>
          </div>
          <div>
            <h6 class="fw-bold text-slate-900 mb-0">{{ viewingItem.name }}</h6>
          </div>
        </div>

        <div class="row g-2 text-slate-700 fs-7">
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
      title="Delete Feature Group"
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
import type { FeatureGroup } from '~/types/feature-group';

definePageMeta({ layout: 'default' });

const crud = useCrudApi<FeatureGroup>({ endpoint: '/api/feature-groups', dataKey: 'feature_groups' });

// Modal state
const showModal = ref(false);
const showViewModal = ref(false);
const showDeleteModal = ref(false);
const viewingItem = ref<FeatureGroup | null>(null);
const editingItem = ref<FeatureGroup | null>(null);
const deletingItem = ref<FeatureGroup | null>(null);

function openView(item: FeatureGroup) {
  viewingItem.value = item;
  showViewModal.value = true;
}

const form = reactive({ name: '' });
const formError = ref('');

function openCreate() {
  editingItem.value = null;
  form.name = '';
  formError.value = '';
  showModal.value = true;
}

function openEdit(item: FeatureGroup) {
  editingItem.value = item;
  form.name = item.name;
  formError.value = '';
  showModal.value = true;
}

async function handleSubmit() {
  if (!form.name.trim()) {
    formError.value = 'Feature group name is required.';
    return;
  }
  formError.value = '';

  let success = false;
  if (editingItem.value) {
    success = await crud.updateItem(
      editingItem.value.id,
      { name: form.name },
      `Feature group "${form.name}" updated successfully.`
    );
  } else {
    success = await crud.createItem(
      { name: form.name },
      `Feature group "${form.name}" created successfully.`
    );
  }

  if (success) {
    showModal.value = false;
    form.name = '';
  }
}

function confirmDelete(item: FeatureGroup) {
  deletingItem.value = item;
  showDeleteModal.value = true;
}

async function handleDelete() {
  if (!deletingItem.value) return;
  const success = await crud.deleteItem(
    deletingItem.value.id,
    `Feature group "${deletingItem.value.name}" has been removed.`
  );
  if (success) {
    showDeleteModal.value = false;
    deletingItem.value = null;
  }
}

onMounted(() => {
  crud.fetchItems();
});
</script>

<style scoped>
.feature-groups-page {
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

.btn-edit:hover {
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
</style>
