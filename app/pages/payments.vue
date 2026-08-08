<template>
  <div class="payments-page d-flex flex-column min-vh-100">
    <!-- Page Header -->
    <div class="page-header d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
      <div class="d-flex align-items-center gap-3">
        <div class="header-icon-box">
          <i class="bi bi-credit-card-fill"></i>
        </div>
        <div>
          <h2 class="page-heading">Payments</h2>
          <p class="page-subheading">Track delegate registration payments, transaction references, and payment modes.</p>
        </div>
      </div>
      <button class="btn-create" @click="openCreateModal">
        <i class="bi bi-plus-lg fs-6"></i>
        <span>Record Payment</span>
      </button>
    </div>

    <!-- Reusable Data Table -->
    <CommonDataTable
      v-model:searchQuery="crud.searchQuery.value"
      v-model:currentPage="crud.currentPage.value"
      v-model:perPage="crud.perPage.value"
      :loading="crud.loading.value"
      :totalCount="filteredPaymentsList.length"
      :totalPages="totalPages"
      :startIndex="startIndex"
      :endIndex="endIndex"
    >
      <template #filters>
        <!-- Payment Mode Filter Dropdown -->
        <select v-model="selectedPaymentModeFilter" class="form-select form-select-sm rounded-pill py-2 px-3 border-slate-200 fs-8 shadow-2xs" style="max-width: 175px;">
          <option value="">All Payment Modes</option>
          <option v-for="pm in modesList" :key="pm.id" :value="pm.id">{{ pm.name }}</option>
        </select>

        <!-- Event Filter Dropdown -->
        <select v-model="selectedEventFilter" class="form-select form-select-sm rounded-pill py-2 px-3 border-slate-200 fs-8 shadow-2xs" style="max-width: 175px;">
          <option value="">All Events</option>
          <option v-for="ev in eventsList" :key="ev.id" :value="ev.id">{{ ev.name }}</option>
        </select>
      </template>
      <table class="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Reference No</th>
            <th>Delegate Name</th>
            <th>Payment Mode</th>
            <th>Amount Paid</th>
            <th>Payment Date</th>
            <th class="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(pm, index) in paginatedFilteredPayments" :key="pm.id">
            <td class="row-index">{{ startIndex + index }}</td>
            <td>
              <div class="payment-ref-cell d-flex align-items-center gap-2.5">
                <span class="payment-badge">
                  <i class="bi bi-receipt-cutoff"></i>
                </span>
                <span class="fw-bold text-slate-900 fs-7">{{ pm.reference_no || `PAY-${pm.id}` }}</span>
              </div>
            </td>
            <td>
              <span v-if="pm.registration?.first_name || pm.registration?.last_name" class="fw-semibold text-slate-800 fs-7">
                {{ pm.registration.first_name || '' }} {{ pm.registration.last_name || '' }}
              </span>
              <span v-else-if="getRegistrationName(pm.registration_id)" class="fw-semibold text-slate-800 fs-7">
                {{ getRegistrationName(pm.registration_id) }}
              </span>
              <span v-else class="text-muted fs-7">—</span>
            </td>
            <td>
              <span class="badge payment-mode-pill rounded-pill border px-3 py-1 fs-8 fw-semibold">
                <i class="bi bi-wallet2 me-1"></i>
                {{ pm.payment_mode?.name || getPaymentModeName(pm.payment_mode_id) }}
              </span>
            </td>
            <td>
              <span class="fw-bold text-slate-900 fs-7">
                TZS {{ Number(pm.amount).toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
              </span>
            </td>
            <td>
              <span class="text-slate-600 fs-7">{{ pm.created_at ? formatDate(pm.created_at) : '—' }}</span>
            </td>
            <td class="text-end">
              <div class="action-btns">
                <button class="btn-icon-action btn-view" @click="openViewModal(pm)" title="View Details">
                  <i class="bi bi-eye-fill"></i>
                </button>
                <button class="btn-icon-action btn-edit" @click="openEditModal(pm)" title="Edit Payment">
                  <i class="bi bi-pencil-fill"></i>
                </button>
                <button class="btn-icon-action btn-delete" @click="confirmDelete(pm)" title="Delete Payment">
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
      :title="editingId ? 'Edit Payment Record' : 'Record New Payment'"
      icon="bi-credit-card-fill"
      size="md"
    >
      <form @submit.prevent="handleSubmit">
        <!-- Registration Select -->
        <div class="mb-3">
          <label class="form-label fw-semibold text-slate-700">Select Registration <span class="text-danger">*</span></label>
          <select v-model.number="form.registration_id" class="form-select py-2 rounded-3" required autofocus>
            <option value="" disabled>Choose registration...</option>
            <option v-for="r in registrationsList" :key="r.id" :value="r.id">
              {{ r.reg_code || `REG-#${r.id}` }} – {{ r.first_name }} {{ r.last_name || '' }}
            </option>
          </select>
        </div>

        <!-- Payment Mode Select -->
        <div class="mb-3">
          <label class="form-label fw-semibold text-slate-700">Payment Mode <span class="text-danger">*</span></label>
          <select v-model.number="form.payment_mode_id" class="form-select py-2 rounded-3" required>
            <option value="" disabled>Choose payment mode...</option>
            <option v-for="pm in modesList" :key="pm.id" :value="pm.id">{{ pm.name }}</option>
          </select>
        </div>

        <!-- Amount Input -->
        <div class="mb-3">
          <label class="form-label fw-semibold text-slate-700">Amount (TZS) <span class="text-danger">*</span></label>
          <input
            v-model.number="form.amount"
            type="number"
            step="0.01"
            min="0"
            class="form-control py-2 rounded-3"
            placeholder="e.g. 2500.00"
            required
          />
        </div>

        <!-- Reference Number Input -->
        <div class="mb-4">
          <label class="form-label fw-semibold text-slate-700">Reference Number / Transaction Code</label>
          <input
            v-model="form.reference_no"
            type="text"
            class="form-control py-2 rounded-3"
            placeholder="e.g. PAY-001 or M-Pesa Code"
          />
        </div>

        <div v-if="formError" class="invalid-feedback d-block mb-3">{{ formError }}</div>

        <div class="modal-footer-row">
          <button type="button" class="btn-cancel" @click="showModal = false">Cancel</button>
          <button type="submit" class="btn-submit" :disabled="crud.saving.value">
            <span v-if="crud.saving.value" class="spinner-border spinner-border-sm me-2"></span>
            {{ editingId ? 'Update Payment' : 'Save Payment' }}
          </button>
        </div>
      </form>
    </CommonModal>

    <!-- View Payment Details Modal -->
    <CommonModal
      v-model="showViewModal"
      title="Payment Details"
      icon="bi-credit-card-fill"
      size="md"
    >
      <div v-if="viewingItem" class="p-1">
        <div class="d-flex align-items-center gap-3 p-3 bg-light rounded-3 mb-3">
          <div class="header-icon-box shadow-2xs">
            <i class="bi bi-receipt-cutoff"></i>
          </div>
          <div>
            <h6 class="fw-bold text-slate-900 mb-0.5">{{ viewingItem.reference_no || `PAY-${viewingItem.id}` }}</h6>
            <span class="badge bg-green-subtle text-green-700 border border-green-200 rounded-pill px-2.5 py-1 fs-8 fw-bold">
              TZS {{ Number(viewingItem.amount).toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
            </span>
          </div>
        </div>

        <div class="row g-3 text-slate-700 fs-7 mb-3">
          <div class="col-6">
            <span class="text-muted d-block fs-8">Delegate Name</span>
            <span class="fw-semibold">
              <template v-if="viewingItem.registration?.first_name || viewingItem.registration?.last_name">
                {{ viewingItem.registration.first_name || '' }} {{ viewingItem.registration.last_name || '' }}
              </template>
              <template v-else>
                {{ getRegistrationName(viewingItem.registration_id) || '—' }}
              </template>
            </span>
          </div>
          <div class="col-6">
            <span class="text-muted d-block fs-8">Payment Mode</span>
            <span class="fw-semibold">{{ viewingItem.payment_mode?.name || getPaymentModeName(viewingItem.payment_mode_id) }}</span>
          </div>
          <div class="col-6">
            <span class="text-muted d-block fs-8">Amount Paid</span>
            <span class="fw-bold text-green-700">TZS {{ Number(viewingItem.amount).toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</span>
          </div>
          <div class="col-6">
            <span class="text-muted d-block fs-8">Reference Code</span>
            <span class="fw-semibold">{{ viewingItem.reference_no || '—' }}</span>
          </div>
        </div>

        <div class="row g-2 text-slate-700 fs-8 border-top pt-3">
          <div class="col-6">
            <span class="text-muted d-block">Recorded Date</span>
            <span class="fw-semibold">{{ viewingItem.created_at ? formatDate(viewingItem.created_at) : '—' }}</span>
          </div>
          <div class="col-6">
            <span class="text-muted d-block">Updated Date</span>
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
      title="Delete Payment Record"
      icon="bi-exclamation-triangle-fill"
      variant="danger"
      size="sm"
    >
      <div class="text-center">
        <p class="text-slate-700 fs-6 mb-1">
          Are you sure you want to delete payment reference <strong>{{ deletingItem?.reference_no || `PAY-${deletingItem?.id}` }}</strong>?
        </p>
        <p class="text-muted fs-7 mb-4">This action cannot be undone.</p>
        <div class="modal-footer-row justify-content-center">
          <button class="btn-cancel" @click="showDeleteModal = false">Cancel</button>
          <button class="btn-danger-confirm" @click="handleDelete" :disabled="crud.saving.value">
            <span v-if="crud.saving.value" class="spinner-border spinner-border-sm me-2"></span>
            Delete Payment
          </button>
        </div>
      </div>
    </CommonModal>
  </div>
</template>

<script setup lang="ts">
import type { Payment } from '~/types/payment';

definePageMeta({ layout: 'default' });

const token = useCookie<string | null>('token');
const registrationsList = ref<any[]>([]);
const modesList = ref<any[]>([]);

const crud = useCrudApi<Payment>({
  endpoint: '/api/payments',
  dataKey: 'payments',
  searchFields: ['id', 'reference_no', 'amount', 'registration_id', 'payment_mode_id'],
});

const selectedPaymentModeFilter = ref<number | string>('');
const selectedEventFilter = ref<number | string>('');
const eventsList = ref<any[]>([]);

// Computed filtered list
const filteredPaymentsList = computed(() => {
  let list = crud.filteredItems.value;

  if (selectedPaymentModeFilter.value) {
    list = list.filter(p => Number(p.payment_mode_id) === Number(selectedPaymentModeFilter.value));
  }

  if (selectedEventFilter.value) {
    list = list.filter(p => {
      const reg = registrationsList.value.find(r => r.id === p.registration_id) || p.registration;
      return reg && Number(reg.event_id) === Number(selectedEventFilter.value);
    });
  }

  return list;
});

const totalPages = computed(() => {
  return Math.ceil(filteredPaymentsList.value.length / crud.perPage.value) || 1;
});

const startIndex = computed(() => {
  return (crud.currentPage.value - 1) * crud.perPage.value + 1;
});

const endIndex = computed(() => {
  return Math.min(crud.currentPage.value * crud.perPage.value, filteredPaymentsList.value.length);
});

const paginatedFilteredPayments = computed(() => {
  const start = (crud.currentPage.value - 1) * crud.perPage.value;
  return filteredPaymentsList.value.slice(start, start + crud.perPage.value);
});
const showModal = ref(false);
const showViewModal = ref(false);
const showDeleteModal = ref(false);
const editingId = ref<number | null>(null);
const viewingItem = ref<Payment | null>(null);
const deletingItem = ref<Payment | null>(null);

const form = reactive({
  registration_id: '' as number | string,
  payment_mode_id: '' as number | string,
  amount: '' as number | string,
  reference_no: '',
});
const formError = ref('');

async function fetchDropdownData() {
  try {
    const [regRes, modeRes, eventRes] = await Promise.all([
      cachedFetch<any>('/api/registrations'),
      cachedFetch<any>('/api/payment-modes'),
      cachedFetch<any>('/api/events'),
    ]);
    registrationsList.value = Array.isArray(regRes?.data?.registrations) ? regRes.data.registrations : (Array.isArray(regRes?.data) ? regRes.data : []);
    modesList.value = Array.isArray(modeRes?.data?.payment_modes) ? modeRes.data.payment_modes : (Array.isArray(modeRes?.data) ? modeRes.data : []);
    eventsList.value = Array.isArray(eventRes?.data?.events) ? eventRes.data.events : (Array.isArray(eventRes?.data) ? eventRes.data : []);
  } catch (err) {
    console.error('Failed to load dropdown data for payments:', err);
  }
}

function getPaymentModeName(modeId: number) {
  const found = modesList.value.find(m => m.id === modeId);
  return found ? found.name : `Mode #${modeId}`;
}

function getRegistrationName(regId: number) {
  const found = registrationsList.value.find(r => r.id === regId);
  if (!found) return '';
  const f = found.first_name || '';
  const l = found.last_name || '';
  return `${f} ${l}`.trim() || `Registration #${regId}`;
}

function openCreateModal() {
  editingId.value = null;
  form.registration_id = registrationsList.value[0]?.id || '';
  form.payment_mode_id = modesList.value[0]?.id || '';
  form.amount = '';
  form.reference_no = '';
  formError.value = '';
  showModal.value = true;
}

function openEditModal(item: Payment) {
  editingId.value = item.id;
  form.registration_id = item.registration_id;
  form.payment_mode_id = item.payment_mode_id;
  form.amount = item.amount;
  form.reference_no = item.reference_no || '';
  formError.value = '';
  showModal.value = true;
}

function openViewModal(item: Payment) {
  viewingItem.value = item;
  showViewModal.value = true;
}

function confirmDelete(item: Payment) {
  deletingItem.value = item;
  showDeleteModal.value = true;
}

async function handleSubmit() {
  if (!form.registration_id) {
    formError.value = 'Please select a registration.';
    return;
  }
  if (!form.payment_mode_id) {
    formError.value = 'Please select a payment mode.';
    return;
  }
  if (!form.amount || Number(form.amount) <= 0) {
    formError.value = 'Please enter a valid amount.';
    return;
  }
  formError.value = '';

  const payload: Record<string, any> = {
    registration_id: Number(form.registration_id),
    payment_mode_id: Number(form.payment_mode_id),
    amount: Number(form.amount),
    reference_no: form.reference_no.trim() || null,
  };

  let success = false;
  if (editingId.value) {
    success = await crud.updateItem(editingId.value, payload, 'Payment record updated successfully.');
  } else {
    success = await crud.createItem(payload, 'Payment recorded successfully.');
  }

  if (success) {
    showModal.value = false;
  }
}

async function handleDelete() {
  if (!deletingItem.value) return;
  const success = await crud.deleteItem(deletingItem.value.id, 'Payment record deleted successfully.');
  if (success) {
    showDeleteModal.value = false;
    deletingItem.value = null;
  }
}

function loadPayments() {
  const params: Record<string, any> = {};
  if (selectedPaymentModeFilter.value) params.payment_mode_id = selectedPaymentModeFilter.value;
  if (selectedEventFilter.value) params.event_id = selectedEventFilter.value;
  crud.fetchItems(params);
}

watch([selectedPaymentModeFilter, selectedEventFilter], () => {
  loadPayments();
});

onMounted(() => {
  loadPayments();
  fetchDropdownData();
});
</script>

<style scoped>
.payments-page {
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

.payment-ref-cell {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.payment-badge {
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

.payment-mode-pill {
  background-color: #f1f5f9;
  color: #334155;
  border-color: #cbd5e1 !important;
}

.bg-green-subtle { background-color: var(--green-50); }
.text-green-700 { color: var(--green-700); }
.border-green-200 { border-color: var(--green-200) !important; }
</style>
