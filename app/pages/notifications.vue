<template>
  <div class="notifications-page d-flex flex-column min-vh-100">
    <!-- Page Header -->
    <div class="page-header d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
      <div class="d-flex align-items-center gap-3">
        <div class="header-icon-box">
          <i class="bi bi-bell-fill"></i>
        </div>
        <div>
          <h2 class="page-heading">Notifications</h2>
          <p class="page-subheading">Schedule automated notifications and link them to registered delegates.</p>
        </div>
      </div>
      <button class="btn-create" @click="openCreateModal">
        <i class="bi bi-plus-lg fs-6"></i>
        <span>New Notification</span>
      </button>
    </div>

    <!-- Template Filter Bar -->
    <div class="filter-bar card border-0 shadow-sm rounded-4 p-3 mb-4">
      <div class="d-flex align-items-center flex-wrap gap-3">
        <label class="filter-label mb-0">
          <i class="bi bi-funnel-fill me-1"></i>
          Filter by Template
        </label>
        <select
          v-model="templateFilter"
          class="form-select form-select-sm filter-select"
          :disabled="templatesLoading"
        >
          <option :value="''">All Templates</option>
          <option v-for="tpl in templatesList" :key="tpl.id" :value="tpl.id">
            {{ tpl.title || tpl.name }}
          </option>
        </select>
        <button
          v-if="templateFilter"
          class="btn btn-link btn-sm text-muted text-decoration-none p-0"
          @click="templateFilter = ''"
        >
          Clear filter
        </button>
      </div>
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
            <th>Template</th>
            <th>Notification Date</th>
            <th>Time</th>
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
                  <i class="bi bi-bell-fill"></i>
                </span>
                <div>
                  <span class="fw-semibold text-slate-900 fs-7 d-block">
                    {{ getTemplateTitle(item) }}
                  </span>
                  <!-- <small class="text-muted fs-8">#{{ item.notification_template_id }}</small> -->
                </div>
              </div>
            </td>
            <td>
              <span class="fw-medium text-slate-800 fs-7">
                <i class="bi bi-calendar-event-fill text-green-600 me-1 fs-8"></i>
                {{ item.notification_date ? formatDate(item.notification_date) : '—' }}
              </span>
            </td>
            <td>
              <span class="fw-medium text-slate-800 fs-7">
                <i class="bi bi-clock-fill text-green-600 me-1 fs-8"></i>
                {{ item.notification_time ? formatTime(item.notification_time) : '—' }}
              </span>
            </td>
            <td>
              <span class="text-slate-600 fs-7">{{ item.created_at ? formatDate(item.created_at) : '—' }}</span>
            </td>
            <td class="text-end">
              <div class="action-btns">
                <button class="btn-icon-action btn-view" @click="openViewModal(item)" title="View Notification Details">
                  <i class="bi bi-eye-fill"></i>
                </button>
                <button class="btn-icon-action btn-edit" @click="openEditModal(item)" title="Edit Notification">
                  <i class="bi bi-pencil-fill"></i>
                </button>
                <button class="btn-icon-action btn-delete" @click="confirmDelete(item)" title="Delete Notification">
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
      :title="editingId ? 'Edit Notification' : 'New Notification'"
      :icon="editingId ? 'bi-pencil-square' : 'bi-plus-circle-fill'"
      size="md"
    >
      <form @submit.prevent="handleSubmit">
        <div class="mb-3">
          <label class="form-label fw-semibold text-slate-700">Notification Template <span class="text-danger">*</span></label>
          <select
            v-model="form.notification_template_id"
            class="form-select py-2 rounded-3"
            :disabled="templatesLoading"
            required
            autofocus
          >
            <option value="" disabled>Select a template</option>
            <option v-for="tpl in templatesList" :key="tpl.id" :value="tpl.id">
              {{ tpl.title || tpl.name }}
            </option>
          </select>
          <small v-if="templatesLoading" class="text-muted fs-8 d-block mt-1">Loading templates...</small>
        </div>

        <div class="row g-3 mb-4">
          <div class="col-12 col-md-6">
            <label class="form-label fw-semibold text-slate-700">Notification Date <span class="text-danger">*</span></label>
            <CommonDatePicker
              v-model="form.notification_date"
              placeholder="Select a date"
            />
          </div>
          <div class="col-12 col-md-6">
            <label class="form-label fw-semibold text-slate-700">Notification Time <span class="text-danger">*</span></label>
            <input
              v-model="form.notification_time"
              type="time"
              class="form-control py-2 rounded-3"
              required
            />
          </div>
        </div>

        <div v-if="formError" class="invalid-feedback d-block mb-3">{{ formError }}</div>

        <div class="modal-footer-row">
          <button type="button" class="btn-cancel" @click="showModal = false">Cancel</button>
          <button type="submit" class="btn-submit" :disabled="crud.saving.value">
            <span v-if="crud.saving.value" class="spinner-border spinner-border-sm me-2"></span>
            {{ editingId ? 'Update Notification' : 'Create Notification' }}
          </button>
        </div>
      </form>
    </CommonModal>

    <!-- View Notification Details Modal -->
    <CommonModal
      v-model="showViewModal"
      title="Notification Details"
      icon="bi-bell-fill"
      size="md"
    >
      <div v-if="viewingItem" class="p-1">
        <div class="d-flex align-items-center gap-3 p-3 bg-light rounded-3 mb-3">
          <div class="header-icon-box shadow-2xs">
            <i class="bi bi-bell-fill"></i>
          </div>
          <div>
            <h6 class="fw-bold text-slate-900 mb-0.5">{{ getTemplateTitle(viewingItem) }}</h6>
            <span class="badge bg-green-subtle text-green-700 border border-green-200 rounded-pill px-2.5 py-1 fs-8 fw-bold">
              Scheduled Notification
            </span>
          </div>
        </div>

        <div class="row g-3 text-slate-700 fs-7 mb-3">
          <div class="col-6">
            <span class="text-muted d-block fs-8">Notification Date</span>
            <span class="fw-semibold">{{ viewingItem.notification_date ? formatDate(viewingItem.notification_date) : '—' }}</span>
          </div>
          <div class="col-6">
            <span class="text-muted d-block fs-8">Notification Time</span>
            <span class="fw-semibold">{{ viewingItem.notification_time ? formatTime(viewingItem.notification_time) : '—' }}</span>
          </div>
        </div>

        <div class="row g-2 text-slate-700 fs-8 border-top pt-3">
          <div class="col-6">
            <span class="text-muted d-block">Created At</span>
            <span class="fw-semibold">{{ viewingItem.created_at ? formatDate(viewingItem.created_at) : '—' }}</span>
          </div>
          <div class="col-6">
            <span class="text-muted d-block">Updated At</span>
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
      title="Delete Notification"
      icon="bi-exclamation-triangle-fill"
      variant="danger"
      size="sm"
    >
      <div class="text-center">
        <p class="text-slate-700 fs-6 mb-1">
          Are you sure you want to delete this notification scheduled for
          <strong>{{ deletingItem?.notification_date ? formatDate(deletingItem.notification_date) : '—' }}</strong>?
        </p>
        <p class="text-muted fs-7 mb-4">This action cannot be undone.</p>
        <div class="modal-footer-row justify-content-center">
          <button class="btn-cancel" @click="showDeleteModal = false">Cancel</button>
          <button class="btn-danger-confirm" @click="handleDelete" :disabled="crud.saving.value">
            <span v-if="crud.saving.value" class="spinner-border spinner-border-sm me-2"></span>
            Delete Notification
          </button>
        </div>
      </div>
    </CommonModal>
  </div>
</template>

<script setup lang="ts">
import type { Notification } from '~/types/notification';
import type { NotificationTemplate } from '~/types/notification-template';

definePageMeta({ layout: 'default' });

const token = useCookie<string | null>('token');

const crud = useCrudApi<Notification>({
  endpoint: '/api/notifications',
  dataKey: 'notifications',
});

// Template dropdown / filter
const templatesList = ref<NotificationTemplate[]>([]);
const templatesLoading = ref(false);
const templateFilter = ref<number | ''>('');

watch(templateFilter, (val) => {
  crud.fetchItems(val ? { notification_template_id: val } : undefined);
});

async function fetchTemplates() {
  templatesLoading.value = true;
  try {
    const headers = { Authorization: `Bearer ${token.value}`, Accept: 'application/json' };
    const res = await $fetch<any>('/api/notification-templates', { headers });
    templatesList.value = Array.isArray(res?.data?.notification_templates)
      ? res.data.notification_templates
      : (Array.isArray(res?.data) ? res.data : []);
  } catch (err) {
    console.error('Failed to load notification templates:', err);
  } finally {
    templatesLoading.value = false;
  }
}

// Modal state
const showModal = ref(false);
const showViewModal = ref(false);
const showDeleteModal = ref(false);
const editingId = ref<number | null>(null);
const viewingItem = ref<Notification | null>(null);
const deletingItem = ref<Notification | null>(null);

const form = reactive({
  notification_date: '',
  notification_time: '',
  notification_template_id: '' as number | '',
});
const formError = ref('');

function getTemplateTitle(item: Notification) {
  const tpl = item.notification_template || templatesList.value.find((t) => t.id === item.notification_template_id);
  return tpl?.title || tpl?.name || `Template #${item.notification_template_id}`;
}

function formatTime(timeStr?: string) {
  if (!timeStr) return '—';
  try {
    const parts = timeStr.split(':');
    const hours = Number(parts[0]);
    const minutes = parts[1] || '00';
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${String(displayHours).padStart(2, '0')}:${minutes} ${period}`;
  } catch {
    return timeStr;
  }
}

function toDateInput(value?: string) {
  return value ? value.slice(0, 10) : '';
}

function toTimeInput(value?: string) {
  if (!value) return '';
  const parts = value.split(':');
  return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : value;
}

function openCreateModal() {
  editingId.value = null;
  form.notification_date = '';
  form.notification_time = '';
  form.notification_template_id = '';
  formError.value = '';
  showModal.value = true;
}

function openEditModal(item: Notification) {
  editingId.value = item.id;
  form.notification_date = toDateInput(item.notification_date);
  form.notification_time = toTimeInput(item.notification_time);
  form.notification_template_id = item.notification_template_id;
  formError.value = '';
  showModal.value = true;
}

function openViewModal(item: Notification) {
  viewingItem.value = item;
  showViewModal.value = true;
}

function confirmDelete(item: Notification) {
  deletingItem.value = item;
  showDeleteModal.value = true;
}

async function handleSubmit() {
  if (!form.notification_date) {
    formError.value = 'Notification date is required.';
    return;
  }
  if (!form.notification_time) {
    formError.value = 'Notification time is required.';
    return;
  }
  if (!form.notification_template_id) {
    formError.value = 'Please select a notification template.';
    return;
  }
  formError.value = '';

  const payload: Record<string, any> = {
    notification_date: form.notification_date,
    notification_time: `${form.notification_time}:00`,
    notification_template_id: Number(form.notification_template_id),
  };

  let success = false;
  if (editingId.value) {
    success = await crud.updateItem(editingId.value, payload, 'Notification updated successfully.');
  } else {
    success = await crud.createItem(payload, 'Notification created successfully.');
  }

  if (success) {
    showModal.value = false;
  }
}

async function handleDelete() {
  if (!deletingItem.value) return;
  const success = await crud.deleteItem(deletingItem.value.id, 'Notification deleted successfully.');
  if (success) {
    showDeleteModal.value = false;
    deletingItem.value = null;
  }
}

onMounted(() => {
  crud.fetchItems();
  fetchTemplates();
});
</script>

<style scoped>
.notifications-page {
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

.filter-bar {
  background: #fff;
}

.filter-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--slate-700);
}

.filter-select {
  max-width: 260px;
  border-radius: 9px;
  border-color: var(--color-border);
  font-size: 0.85rem;
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

.bg-green-subtle { background-color: var(--green-50); }
.text-green-700 { color: var(--green-700); }
.border-green-200 { border-color: var(--green-200) !important; }

@media (max-width: 767.98px) {
  .filter-select {
    max-width: 100%;
    width: 100%;
  }
}
</style>
