<template>
  <div class="notification-registrations-page d-flex flex-column min-vh-100">
    <!-- Page Header -->
    <div class="page-header d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
      <div class="d-flex align-items-center gap-3">
        <div class="header-icon-box">
          <i class="bi bi-envelope-check-fill"></i>
        </div>
        <div>
          <h2 class="page-heading">Notification Registrations</h2>
          <p class="page-subheading">Link scheduled notifications to registered delegates.</p>
        </div>
      </div>
      <button class="btn-create" @click="openCreateModal">
        <i class="bi bi-plus-lg fs-6"></i>
        <span>Add Registration</span>
      </button>
    </div>

    <!-- Filter Bar -->
    <div class="filter-bar card border-0 shadow-sm rounded-4 p-3 mb-4">
      <div class="d-flex align-items-center flex-wrap gap-3">
        <label class="filter-label mb-0">
          <i class="bi bi-funnel-fill me-1"></i>
          Filter by
        </label>
        <select
          v-model="notificationFilter"
          class="form-select form-select-sm filter-select"
          :disabled="dropdownLoading"
        >
          <option :value="''">All Notifications</option>
          <option v-for="n in notificationsList" :key="n.id" :value="n.id">
            {{ getNotificationOptionLabel(n) }}
          </option>
        </select>
        <select
          v-model="registrationFilter"
          class="form-select form-select-sm filter-select"
          :disabled="dropdownLoading"
        >
          <option :value="''">All Delegates</option>
          <option v-for="r in registrationsList" :key="r.id" :value="r.id">
            {{ getRegistrationName(r) }}
          </option>
        </select>
        <button
          v-if="notificationFilter || registrationFilter"
          class="btn btn-link btn-sm text-muted text-decoration-none p-0"
          @click="clearFilters"
        >
          Clear filters
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
            <th>Notification</th>
            <th>Delegate</th>
            <th>Contact</th>
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
                    {{ getNotificationTitle(item.notification_id) }}
                  </span>
                  <small class="text-muted fs-8">
                    {{ getNotificationDate(item.notification_id) }}
                  </small>
                </div>
              </div>
            </td>
            <td>
              <div class="delegate-cell">
                <span class="delegate-avatar">{{ getInitials(item.registration_id) }}</span>
                <span class="fw-semibold text-slate-800 fs-7">{{ getRegistrationNameById(item.registration_id) }}</span>
              </div>
            </td>
            <td>
              <span class="text-slate-600 fs-7">
                <i class="bi bi-telephone-fill text-green-600 me-1 fs-8"></i>
                {{ getRegistrationContact(item.registration_id) }}
              </span>
            </td>
            <td>
              <span class="text-slate-600 fs-7">{{ item.created_at ? formatDate(item.created_at) : '—' }}</span>
            </td>
            <td class="text-end">
              <div class="action-btns">
                <button class="btn-icon-action btn-view" @click="openViewModal(item)" title="View Details">
                  <i class="bi bi-eye-fill"></i>
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

    <!-- Create Modal -->
    <CommonModal
      v-model="showModal"
      title="Add Notification Registration"
      icon="bi-plus-circle-fill"
      size="md"
    >
      <form @submit.prevent="handleSubmit">
        <div class="mb-3">
          <label class="form-label fw-semibold text-slate-700">Notification <span class="text-danger">*</span></label>
          <select
            v-model="form.notification_id"
            class="form-select py-2 rounded-3"
            :disabled="dropdownLoading"
            required
            autofocus
          >
            <option value="" disabled>Select a notification</option>
            <option v-for="n in notificationsList" :key="n.id" :value="n.id">
              {{ getNotificationOptionLabel(n) }}
            </option>
          </select>
          <small v-if="dropdownLoading" class="text-muted fs-8 d-block mt-1">Loading notifications...</small>
        </div>

        <div class="mb-4">
          <label class="form-label fw-semibold text-slate-700">Delegate Registration <span class="text-danger">*</span></label>
          <select
            v-model="form.registration_id"
            class="form-select py-2 rounded-3"
            :disabled="dropdownLoading"
            required
          >
            <option value="" disabled>Select a delegate</option>
            <option v-for="r in registrationsList" :key="r.id" :value="r.id">
              {{ getRegistrationName(r) }} — {{ r.phone || r.email || `#${r.id}` }}
            </option>
          </select>
        </div>

        <div v-if="formError" class="invalid-feedback d-block mb-3">{{ formError }}</div>

        <div class="modal-footer-row">
          <button type="button" class="btn-cancel" @click="showModal = false">Cancel</button>
          <button type="submit" class="btn-submit" :disabled="crud.saving.value">
            <span v-if="crud.saving.value" class="spinner-border spinner-border-sm me-2"></span>
            Add Registration
          </button>
        </div>
      </form>
    </CommonModal>

    <!-- View Details Modal -->
    <CommonModal
      v-model="showViewModal"
      title="Notification Registration Details"
      icon="bi-envelope-check-fill"
      size="md"
    >
      <div v-if="viewingItem" class="p-1">
        <div class="d-flex align-items-center gap-3 p-3 bg-light rounded-3 mb-3">
          <div class="header-icon-box shadow-2xs">
            <i class="bi bi-bell-fill"></i>
          </div>
          <div>
            <h6 class="fw-bold text-slate-900 mb-0.5">{{ getNotificationTitle(viewingItem.notification_id) }}</h6>
            <span class="badge bg-green-subtle text-green-700 border border-green-200 rounded-pill px-2.5 py-1 fs-8 fw-bold">
              {{ getNotificationDate(viewingItem.notification_id) }}
            </span>
          </div>
        </div>

        <div class="row g-3 text-slate-700 fs-7 mb-3">
          <div class="col-6">
            <span class="text-muted d-block fs-8">Delegate</span>
            <span class="fw-semibold">{{ getRegistrationNameById(viewingItem.registration_id) }}</span>
          </div>
          <div class="col-6">
            <span class="text-muted d-block fs-8">Contact</span>
            <span class="fw-semibold">{{ getRegistrationContact(viewingItem.registration_id) || '—' }}</span>
          </div>
          <div class="col-6">
            <span class="text-muted d-block fs-8">Email</span>
            <span class="fw-semibold">{{ getRegistrationEmail(viewingItem.registration_id) || '—' }}</span>
          </div>
          <div class="col-6">
            <span class="text-muted d-block fs-8">Status</span>
            <span class="role-pill">{{ getRegistrationStatus(viewingItem.registration_id) }}</span>
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
      title="Delete Notification Registration"
      icon="bi-exclamation-triangle-fill"
      variant="danger"
      size="sm"
    >
      <div class="text-center">
        <p class="text-slate-700 fs-6 mb-1">
          Are you sure you want to remove
          <strong>{{ deletingItem ? getRegistrationNameById(deletingItem.registration_id) : '' }}</strong>
          from this notification?
        </p>
        <p class="text-muted fs-7 mb-4">This action cannot be undone.</p>
        <div class="modal-footer-row justify-content-center">
          <button class="btn-cancel" @click="showDeleteModal = false">Cancel</button>
          <button class="btn-danger-confirm" @click="handleDelete" :disabled="crud.saving.value">
            <span v-if="crud.saving.value" class="spinner-border spinner-border-sm me-2"></span>
            Yes, Remove
          </button>
        </div>
      </div>
    </CommonModal>
  </div>
</template>

<script setup lang="ts">
import type { NotificationRegistration } from '~/types/notification-registration';

definePageMeta({ layout: 'default' });

const token = useCookie<string | null>('token');

const crud = useCrudApi<NotificationRegistration>({
  endpoint: '/api/notification-registrations',
  dataKey: 'notification_registrations',
});

// Dropdown / filter data
const notificationsList = ref<any[]>([]);
const registrationsList = ref<any[]>([]);
const dropdownLoading = ref(false);
const notificationFilter = ref<number | ''>('');
const registrationFilter = ref<number | ''>('');

watch([notificationFilter, registrationFilter], () => {
  const params: Record<string, any> = {};
  if (notificationFilter.value) params.notification_id = notificationFilter.value;
  if (registrationFilter.value) params.registration_id = registrationFilter.value;
  crud.fetchItems(Object.keys(params).length ? params : undefined);
});

function clearFilters() {
  notificationFilter.value = '';
  registrationFilter.value = '';
}

async function fetchDropdownData() {
  dropdownLoading.value = true;
  try {
    const headers = { Authorization: `Bearer ${token.value}`, Accept: 'application/json' };
    const [notifRes, regRes] = await Promise.all([
      $fetch<any>('/api/notifications', { headers }),
      $fetch<any>('/api/registrations', { headers }),
    ]);
    notificationsList.value = Array.isArray(notifRes?.data?.notifications)
      ? notifRes.data.notifications
      : (Array.isArray(notifRes?.data) ? notifRes.data : []);
    registrationsList.value = Array.isArray(regRes?.data?.registrations)
      ? regRes.data.registrations
      : (Array.isArray(regRes?.data) ? regRes.data : []);
  } catch (err) {
    console.error('Failed to load notification registration dropdown data:', err);
  } finally {
    dropdownLoading.value = false;
  }
}

// Notification helpers
function getNotificationById(id: number) {
  return notificationsList.value.find((n) => n.id === id);
}

function getNotificationOptionLabel(n: any) {
  const templateTitle = n.notification_template?.title || n.notification_template?.name || `Template #${n.notification_template_id}`;
  return `${templateTitle} · ${n.notification_date || ''}`;
}

function getNotificationTitle(notificationId: number) {
  const n = getNotificationById(notificationId);
  if (!n) return `Notification #${notificationId}`;
  return n.notification_template?.title || n.notification_template?.name || `Template #${n.notification_template_id}`;
}

function getNotificationDate(notificationId: number) {
  const n = getNotificationById(notificationId);
  return n?.notification_date ? formatDate(n.notification_date) : '—';
}

// Registration helpers
function getRegistrationById(regId: number) {
  return registrationsList.value.find((r) => r.id === regId);
}

function getRegistrationName(reg: any) {
  if (!reg) return '';
  const f = reg.first_name || '';
  const l = reg.last_name || '';
  return `${f} ${l}`.trim() || `Registration #${reg.id}`;
}

function getRegistrationNameById(regId: number) {
  return getRegistrationName(getRegistrationById(regId)) || `Registration #${regId}`;
}

function getRegistrationContact(regId: number) {
  return getRegistrationById(regId)?.phone || '—';
}

function getRegistrationEmail(regId: number) {
  return getRegistrationById(regId)?.email || '—';
}

function getRegistrationStatus(regId: number) {
  return getRegistrationById(regId)?.status || '—';
}

function getInitials(regId: number) {
  const reg = getRegistrationById(regId);
  const f = reg?.first_name?.[0] || 'D';
  const l = reg?.last_name?.[0] || '';
  return `${f}${l}`.toUpperCase();
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-KE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// Modal state
const showModal = ref(false);
const showViewModal = ref(false);
const showDeleteModal = ref(false);
const viewingItem = ref<NotificationRegistration | null>(null);
const deletingItem = ref<NotificationRegistration | null>(null);

const form = reactive({
  notification_id: '' as number | '',
  registration_id: '' as number | '',
});
const formError = ref('');

function openCreateModal() {
  form.notification_id = notificationsList.value[0]?.id || '';
  form.registration_id = registrationsList.value[0]?.id || '';
  formError.value = '';
  showModal.value = true;
}

function openViewModal(item: NotificationRegistration) {
  viewingItem.value = item;
  showViewModal.value = true;
}

function confirmDelete(item: NotificationRegistration) {
  deletingItem.value = item;
  showDeleteModal.value = true;
}

async function handleSubmit() {
  if (!form.notification_id) {
    formError.value = 'Please select a notification.';
    return;
  }
  if (!form.registration_id) {
    formError.value = 'Please select a delegate registration.';
    return;
  }
  formError.value = '';

  const success = await crud.createItem(
    {
      notification_id: Number(form.notification_id),
      registration_id: Number(form.registration_id),
    },
    'Delegate added to notification successfully.'
  );

  if (success) {
    showModal.value = false;
  }
}

async function handleDelete() {
  if (!deletingItem.value) return;
  const success = await crud.deleteItem(deletingItem.value.id, 'Delegate removed from notification.');
  if (success) {
    showDeleteModal.value = false;
    deletingItem.value = null;
  }
}

onMounted(() => {
  crud.fetchItems();
  fetchDropdownData();
});
</script>

<style scoped>
.notification-registrations-page {
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
  max-width: 240px;
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

.delegate-cell {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.delegate-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--green-500);
  color: #fff;
  font-weight: 700;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.role-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  background: var(--green-50);
  color: var(--green-700);
  font-size: 0.75rem;
  font-weight: 600;
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
