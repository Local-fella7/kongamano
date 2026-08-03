<template>
  <div class="registrations-page d-flex flex-column min-vh-100">
    <!-- Page Header -->
    <div class="page-header d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
      <div class="d-flex align-items-center gap-3">
        <div class="header-icon-box">
          <i class="bi bi-people-fill"></i>
        </div>
        <div>
          <h2 class="page-heading">Registrations</h2>
          <p class="page-subheading">Manage attendee event registrations, status updates, and delegate details.</p>
        </div>
      </div>
      <button class="btn-create" @click="openCreateModal">
        <i class="bi bi-plus-lg fs-6"></i>
        <span>New Registration</span>
      </button>
    </div>

    <!-- Reusable Data Table -->
    <CommonDataTable
      v-model:searchQuery="crud.searchQuery.value"
      v-model:currentPage="crud.currentPage.value"
      v-model:perPage="crud.perPage.value"
      :loading="crud.loading.value"
      :totalCount="filteredRegistrations.length"
      :totalPages="totalPages"
      :startIndex="startIndex"
      :endIndex="endIndex"
    >
      <template #filters>
        <!-- Status Filter Dropdown -->
        <select v-model="selectedStatusFilter" class="form-select form-select-sm rounded-pill py-2 px-3 border-slate-200 fs-8 shadow-2xs" style="max-width: 175px;">
          <option value="">All Statuses ({{ crud.items.value.length }})</option>
          <option value="Confirmed">Confirmed ({{ countByStatus('Confirmed') }})</option>
          <option value="Pending">Pending ({{ countByStatus('Pending') }})</option>
          <option value="Cancelled">Cancelled ({{ countByStatus('Cancelled') }})</option>
        </select>

        <!-- Event Filter Dropdown -->
        <select v-model="selectedEventFilter" class="form-select form-select-sm rounded-pill py-2 px-3 border-slate-200 fs-8 shadow-2xs" style="max-width: 175px;">
          <option value="">All Events</option>
          <option v-for="ev in eventsList" :key="ev.id" :value="ev.id">{{ ev.name }}</option>
        </select>

        <!-- Payment Mode Filter Dropdown -->
        <select v-model="selectedPaymentModeFilter" class="form-select form-select-sm rounded-pill py-2 px-3 border-slate-200 fs-8 shadow-2xs" style="max-width: 175px;">
          <option value="">All Payment Modes</option>
          <option v-for="pm in paymentModesList" :key="pm.id" :value="pm.id">{{ pm.name }}</option>
        </select>
      </template>

      <table class="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Delegate Name</th>
            <th>Contact Details</th>
            <th>Event</th>
            <th>Payment Mode</th>
            <th>Amount (TZS)</th>
            <th>Status</th>
            <th class="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(reg, index) in paginatedRegistrations" :key="reg.id">
            <td class="row-index">{{ startIndex + index }}</td>
            <td>
              <div class="d-flex align-items-center gap-2.5">
                <div class="user-initials-avatar">
                  {{ getInitials(reg.first_name, reg.last_name) }}
                </div>
                <div>
                  <span class="fw-bold text-slate-900 fs-7 d-block">{{ reg.first_name }} {{ reg.last_name }}</span>
                  <span class="fs-8 text-muted">{{ reg.gender || 'N/A' }}</span>
                </div>
              </div>
            </td>
            <td>
              <div class="fs-8">
                <span class="d-block text-slate-800 fw-medium">
                  <i class="bi bi-telephone-fill me-1 text-slate-400"></i>{{ reg.phone || '—' }}
                </span>
                <span class="d-block text-muted text-truncate" style="max-width: 180px;" :title="reg.email">
                  <i class="bi bi-envelope-fill me-1 text-slate-400"></i>{{ reg.email || '—' }}
                </span>
              </div>
            </td>
            <td>
              <span class="fw-semibold text-slate-800 fs-7">
                {{ reg.event?.name || getEventName(reg.event_id) }}
              </span>
            </td>
            <td>
              <span class="badge payment-mode-pill rounded-pill border px-3 py-1 fs-8 fw-semibold">
                <i class="bi bi-wallet2 me-1"></i>
                {{ reg.payment_mode?.name || getPaymentModeName(reg.payment_mode_id) }}
              </span>
            </td>
            <td>
              <span class="fw-bold text-slate-900 fs-7">
                {{ formatCurrency(reg.amount) }}
              </span>
            </td>
            <td>
              <span
                class="badge status-pill rounded-3 border d-inline-flex align-items-center gap-1.5"
                :class="getStatusBadgeClass(reg.status)"
              >
                <span class="status-dot"></span>
                <span>{{ reg.status }}</span>
              </span>
            </td>
            <td class="text-end">
              <div class="d-flex align-items-center justify-content-end gap-2">
                <button
                  class="btn btn-outline-secondary btn-sm rounded-3 fw-semibold fs-7 d-flex align-items-center justify-content-center py-2 px-2.5 shadow-2xs"
                  @click="openView(reg)"
                  title="View Registration"
                >
                  <i class="bi bi-eye-fill small-action-icon text-slate-700"></i>
                </button>

                <button
                  class="btn btn-outline-success btn-sm rounded-3 fw-semibold fs-7 d-flex align-items-center justify-content-center py-2 px-2.5 shadow-2xs"
                  @click="openEdit(reg)"
                  title="Edit Registration"
                >
                  <i class="bi bi-pencil-fill small-action-icon"></i>
                </button>

                <button
                  class="btn btn-outline-danger btn-sm rounded-3 fw-semibold fs-7 d-flex align-items-center justify-content-center py-2 px-2.5 shadow-2xs"
                  @click="confirmDelete(reg)"
                  title="Delete Registration"
                >
                  <i class="bi bi-trash-fill small-action-icon"></i>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!crud.loading.value && filteredRegistrations.length === 0">
            <td colspan="8" class="text-center py-5 text-muted">
              <i class="bi bi-inbox fs-2 opacity-50 d-block mb-2"></i>
              No registrations found matching your filters.
            </td>
          </tr>
        </tbody>
      </table>
    </CommonDataTable>

    <!-- Create / Edit Modal -->
    <CommonModal
      v-model="showModal"
      :title="editingItem ? 'Edit Registration' : 'New Registration'"
      :icon="editingItem ? 'bi-pencil-square' : 'bi-person-plus-fill'"
      size="md"
    >
      <form @submit.prevent="handleSubmit">
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label required fs-7 fw-semibold">First Name</label>
            <input
              v-model="form.first_name"
              type="text"
              class="form-control form-control-sm rounded-3"
              placeholder="e.g. Mary"
              required
            />
          </div>

          <div class="col-md-6">
            <label class="form-label required fs-7 fw-semibold">Last Name</label>
            <input
              v-model="form.last_name"
              type="text"
              class="form-control form-control-sm rounded-3"
              placeholder="e.g. Wanjiku"
              required
            />
          </div>

          <div class="col-md-6">
            <label class="form-label required fs-7 fw-semibold">Gender</label>
            <select v-model="form.gender" class="form-select form-select-sm rounded-3" required>
              <option value="" disabled>Select Gender...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          <div class="col-md-6">
            <label class="form-label required fs-7 fw-semibold">Event</label>
            <select v-model.number="form.event_id" class="form-select form-select-sm rounded-3" required>
              <option value="" disabled>Select Event...</option>
              <option v-for="ev in eventsList" :key="ev.id" :value="ev.id">{{ ev.name }}</option>
            </select>
          </div>

          <div class="col-md-6">
            <label class="form-label fs-7 fw-semibold">Phone Number</label>
            <input
              v-model="form.phone"
              type="tel"
              class="form-control form-control-sm rounded-3"
              placeholder="e.g. 0745678901"
            />
          </div>

          <div class="col-md-6">
            <label class="form-label fs-7 fw-semibold">Email Address</label>
            <input
              v-model="form.email"
              type="email"
              class="form-control form-control-sm rounded-3"
              placeholder="e.g. mary@example.com"
            />
          </div>

          <div class="col-md-6">
            <label class="form-label fs-7 fw-semibold">Payment Mode</label>
            <select v-model.number="form.payment_mode_id" class="form-select form-select-sm rounded-3">
              <option value="">Select Payment Mode...</option>
              <option v-for="pm in paymentModesList" :key="pm.id" :value="pm.id">{{ pm.name }}</option>
            </select>
          </div>

          <div class="col-md-6">
            <label class="form-label required fs-7 fw-semibold">Amount (TZS)</label>
            <input
              v-model.number="form.amount"
              type="number"
              min="0"
              step="100"
              class="form-control form-control-sm rounded-3"
              placeholder="e.g. 4000"
              required
            />
          </div>

          <div class="col-md-12">
            <label class="form-label required fs-7 fw-semibold">Registration Status</label>
            <select v-model="form.status" class="form-select form-select-sm rounded-3" required>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div v-if="formError" class="invalid-feedback d-block mt-3">{{ formError }}</div>

        <div class="modal-footer-row mt-4">
          <button type="button" class="btn-cancel" @click="showModal = false">Cancel</button>
          <button type="submit" class="btn-submit" :disabled="crud.saving.value">
            <span v-if="crud.saving.value" class="spinner-border spinner-border-sm me-2"></span>
            {{ editingItem ? 'Save Changes' : 'Create Registration' }}
          </button>
        </div>
      </form>
    </CommonModal>

    <!-- View Details Modal -->
    <CommonModal
      v-model="showViewModal"
      title="Registration Details"
      icon="bi-person-vcard-fill"
      size="md"
    >
      <div v-if="viewingItem" class="p-1">
        <div class="d-flex align-items-start gap-3 p-3 bg-light rounded-3 mb-3">
          <div class="user-initials-avatar" style="width: 44px; height: 44px; font-size: 0.95rem; flex-shrink: 0;">
            {{ getInitials(viewingItem.first_name, viewingItem.last_name) }}
          </div>
          <div style="min-width: 0; flex: 1;">
            <h6 class="fw-bold text-slate-900 mb-1 text-truncate" :title="`${viewingItem.first_name} ${viewingItem.last_name}`">
              {{ viewingItem.first_name }} {{ viewingItem.last_name }}
            </h6>
            <div class="d-flex flex-column gap-1 fs-8 text-muted fw-medium">
              <span v-if="viewingItem.phone" class="text-truncate">
                <i class="bi bi-telephone-fill me-1.5 text-slate-400"></i>{{ viewingItem.phone }}
              </span>
              <span v-if="viewingItem.email" class="text-truncate" :title="viewingItem.email">
                <i class="bi bi-envelope-fill me-1.5 text-slate-400"></i>{{ viewingItem.email }}
              </span>
            </div>
          </div>
          <span
            class="badge status-pill rounded-3 border ms-auto fs-8 flex-shrink-0"
            :class="getStatusBadgeClass(viewingItem.status)"
          >
            <span class="status-dot"></span>
            <span>{{ viewingItem.status }}</span>
          </span>
        </div>

        <div class="row g-3 text-slate-700 fs-7 mb-3">
          <div class="col-6">
            <span class="text-muted d-block fs-8">Event</span>
            <span class="fw-semibold text-slate-900">{{ viewingItem.event?.name || getEventName(viewingItem.event_id) }}</span>
          </div>
          <div class="col-6">
            <span class="text-muted d-block fs-8">Gender</span>
            <span class="fw-semibold text-slate-900">{{ viewingItem.gender || 'N/A' }}</span>
          </div>
          <div class="col-6">
            <span class="text-muted d-block fs-8">Payment Mode</span>
            <span class="fw-semibold text-slate-900">{{ viewingItem.payment_mode?.name || getPaymentModeName(viewingItem.payment_mode_id) }}</span>
          </div>
          <div class="col-6">
            <span class="text-muted d-block fs-8">Amount Paid</span>
            <span class="fw-bold text-slate-900">{{ formatCurrency(viewingItem.amount) }}</span>
          </div>
        </div>

        <div class="row g-2 text-slate-700 fs-8 border-top pt-3 mt-3">
          <div class="col-6">
            <span class="text-muted d-block">Created At</span>
            <span class="fw-semibold">{{ viewingItem.created_at ? formatDate(viewingItem.created_at) : '—' }}</span>
          </div>
          <div class="col-6">
            <span class="text-muted d-block">Updated At</span>
            <span class="fw-semibold">{{ viewingItem.updated_at ? formatDate(viewingItem.updated_at) : '—' }}</span>
          </div>
        </div>
      </div>
    </CommonModal>

    <!-- Delete Confirm Modal -->
    <CommonModal
      v-model="showDeleteModal"
      title="Delete Registration"
      icon="bi-exclamation-triangle-fill"
      variant="danger"
      size="sm"
    >
      <div class="text-center">
        <p class="text-slate-700 fs-6 mb-1">
          Are you sure you want to delete registration for <strong>{{ deletingItem?.first_name }} {{ deletingItem?.last_name }}</strong>?
        </p>
        <p class="text-muted fs-7 mb-4">This action cannot be undone.</p>
        <div class="modal-footer-row justify-content-center">
          <button class="btn-cancel" @click="showDeleteModal = false">Cancel</button>
          <button class="btn-danger-confirm" @click="handleDelete" :disabled="crud.saving.value">
            <span v-if="crud.saving.value" class="spinner-border spinner-border-sm me-2"></span>
            Delete Registration
          </button>
        </div>
      </div>
    </CommonModal>
  </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore();
const token = computed(() => authStore.token);

const crud = useCrudApi<Registration>({
  endpoint: '/api/registrations',
  dataKey: 'registrations',
  searchFields: ['first_name', 'last_name', 'email', 'phone', 'status'],
});

const eventsList = ref<any[]>([]);
const paymentModesList = ref<any[]>([]);
const selectedStatusFilter = ref<string>('');
const selectedEventFilter = ref<number | string>('');
const selectedPaymentModeFilter = ref<number | string>('');

const showModal = ref(false);
const showViewModal = ref(false);
const showDeleteModal = ref(false);
const viewingItem = ref<Registration | null>(null);
const editingItem = ref<Registration | null>(null);
const deletingItem = ref<Registration | null>(null);

const form = reactive({
  event_id: '' as number | string,
  first_name: '',
  last_name: '',
  gender: '',
  phone: '',
  email: '',
  payment_mode_id: '' as number | string,
  amount: 0 as number | string,
  status: 'Pending',
});
const formError = ref('');

onMounted(() => {
  crud.fetchItems();
  fetchEventsList();
  fetchPaymentModesList();
});

async function fetchEventsList() {
  try {
    const res = await cachedFetch<any>('/api/events');
    eventsList.value = Array.isArray(res?.data?.events) ? res.data.events : (Array.isArray(res?.data) ? res.data : []);
  } catch (err) {
    console.error('Failed to fetch events list:', err);
  }
}

async function fetchPaymentModesList() {
  try {
    const res = await cachedFetch<any>('/api/payment-modes');
    paymentModesList.value = Array.isArray(res?.data?.payment_modes) ? res.data.payment_modes : (Array.isArray(res?.data) ? res.data : []);
  } catch (err) {
    console.error('Failed to fetch payment modes list:', err);
  }
}

// Filtered items computed
const filteredRegistrations = computed(() => {
  let list = crud.filteredItems.value;

  if (selectedStatusFilter.value) {
    list = list.filter(r => r.status === selectedStatusFilter.value);
  }

  if (selectedEventFilter.value) {
    list = list.filter(r => Number(r.event_id) === Number(selectedEventFilter.value));
  }

  if (selectedPaymentModeFilter.value) {
    list = list.filter(r => Number(r.payment_mode_id) === Number(selectedPaymentModeFilter.value));
  }

  return list;
});

const totalPages = computed(() => {
  return Math.ceil(filteredRegistrations.value.length / crud.perPage.value) || 1;
});

const startIndex = computed(() => {
  return (crud.currentPage.value - 1) * crud.perPage.value + 1;
});

const endIndex = computed(() => {
  return Math.min(crud.currentPage.value * crud.perPage.value, filteredRegistrations.value.length);
});

const paginatedRegistrations = computed(() => {
  const start = (crud.currentPage.value - 1) * crud.perPage.value;
  return filteredRegistrations.value.slice(start, start + crud.perPage.value);
});

function countByStatus(status: string) {
  return crud.items.value.filter(r => r.status === status).length;
}

function getInitials(first?: string, last?: string) {
  const f = first?.[0] || '';
  const l = last?.[0] || '';
  return `${f}${l}`.toUpperCase() || 'U';
}

function getEventName(eventId: number) {
  const found = eventsList.value.find(e => e.id === eventId);
  return found ? found.name : `Event #${eventId}`;
}

function getPaymentModeName(pmId?: number) {
  if (!pmId) return 'N/A';
  const found = paymentModesList.value.find(pm => pm.id === pmId);
  return found ? found.name : `Mode #${pmId}`;
}

function getStatusBadgeClass(status: string) {
  if (status === 'Confirmed') return 'status-badge--active';
  if (status === 'Pending') return 'status-badge--scheduled';
  return 'status-badge--completed';
}

function formatCurrency(val?: number | string) {
  if (val === undefined || val === null || val === '') return 'TZS 0';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  return `TZS ${num.toLocaleString()}`;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr.replace(' ', 'T')).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function openCreateModal() {
  editingItem.value = null;
  form.event_id = eventsList.value[0]?.id || '';
  form.first_name = '';
  form.last_name = '';
  form.gender = '';
  form.phone = '';
  form.email = '';
  form.payment_mode_id = paymentModesList.value[0]?.id || '';
  form.amount = 0;
  form.status = 'Pending';
  formError.value = '';
  showModal.value = true;
}

function openView(item: Registration) {
  viewingItem.value = item;
  showViewModal.value = true;
}

function openEdit(item: Registration) {
  editingItem.value = item;
  form.event_id = item.event_id;
  form.first_name = item.first_name;
  form.last_name = item.last_name;
  form.gender = item.gender || '';
  form.phone = item.phone || '';
  form.email = item.email || '';
  form.payment_mode_id = item.payment_mode_id || '';
  form.amount = item.amount || 0;
  form.status = item.status || 'Pending';
  formError.value = '';
  showModal.value = true;
}

function confirmDelete(item: Registration) {
  deletingItem.value = item;
  showDeleteModal.value = true;
}

async function handleSubmit() {
  if (!form.first_name.trim() || !form.last_name.trim()) {
    formError.value = 'First name and last name are required.';
    return;
  }
  if (!form.event_id) {
    formError.value = 'Please select an event.';
    return;
  }
  if (form.amount === '' || form.amount === null || form.amount === undefined || Number(form.amount) < 0) {
    formError.value = 'Please enter a valid amount.';
    return;
  }
  if (!form.status) {
    formError.value = 'Please select a registration status.';
    return;
  }

  const payload = {
    event_id: Number(form.event_id),
    first_name: form.first_name.trim(),
    last_name: form.last_name.trim(),
    gender: form.gender,
    phone: form.phone.trim(),
    email: form.email.trim(),
    payment_mode_id: form.payment_mode_id ? Number(form.payment_mode_id) : undefined,
    amount: Number(form.amount) || 0,
    status: form.status,
  };

  const success = editingItem.value
    ? await crud.updateItem(editingItem.value.id, payload)
    : await crud.createItem(payload);

  if (success) {
    showModal.value = false;
  } else {
    formError.value = crud.error.value || 'Failed to save registration.';
  }
}

async function handleDelete() {
  if (!deletingItem.value) return;
  const success = await crud.deleteItem(deletingItem.value.id);
  if (success) {
    showDeleteModal.value = false;
    deletingItem.value = null;
  }
}
</script>

<style scoped>
.page-heading {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--slate-900);
  margin-bottom: 0.15rem;
}

.page-subheading {
  font-size: 0.85rem;
  color: var(--slate-600);
  margin-bottom: 0;
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

.btn-teal {
  background-color: var(--green-600);
  color: #ffffff;
}

.btn-amber {
  background-color: var(--amber-600, #d97706);
  color: #ffffff;
}

.user-initials-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: var(--green-500);
  color: #ffffff;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 6px rgba(46, 125, 34, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  flex-shrink: 0;
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

.data-table tbody tr:hover {
  background: var(--green-50);
}

.row-index {
  color: var(--slate-300);
  font-size: 0.8rem;
  width: 40px;
}

.payment-mode-pill {
  background-color: #f1f5f9;
  color: #334155;
  border-color: #cbd5e1 !important;
}

.status-pill {
  padding: 0.4rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1;
}

.status-badge--completed {
  background-color: #f1f5f9;
  color: #475569;
  border-color: #cbd5e1 !important;
}

.status-badge--scheduled {
  background-color: #fbf7f0;
  color: #76453b;
  border-color: rgba(118, 69, 59, 0.2) !important;
}

.status-badge--active {
  background-color: var(--green-50);
  color: var(--green-700);
  border-color: var(--green-200) !important;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
  display: inline-block;
}

.small-action-icon {
  font-size: 0.875rem;
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
