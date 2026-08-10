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
      <template #filters>
        <!-- Notification Filter Dropdown -->
        <select
          v-model="notificationFilter"
          class="form-select form-select-sm rounded-pill py-2 px-3 border-slate-200 fs-8 shadow-2xs"
          style="max-width: 180px;"
          :disabled="dropdownLoading"
        >
          <option :value="''">All Notifications</option>
          <option v-for="n in notificationsList" :key="n.id" :value="n.id">
            {{ getNotificationOptionLabel(n) }}
          </option>
        </select>

        <!-- Delegate Filter Dropdown -->
        <select
          v-model="registrationFilter"
          class="form-select form-select-sm rounded-pill py-2 px-3 border-slate-200 fs-8 shadow-2xs"
          style="max-width: 180px;"
          :disabled="dropdownLoading"
        >
          <option :value="''">All Delegates</option>
          <option v-for="r in registrationsList" :key="r.id" :value="r.id">
            {{ getRegistrationName(r) }}
          </option>
        </select>
      </template>
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

    <!-- 2-Column Create Modal -->
    <CommonModal
      v-model="showModal"
      title="Link Delegates to Notification"
      icon="bi-envelope-plus-fill"
      size="xl"
    >
      <form @submit.prevent="handleSubmit">
        <div class="row g-4">
          <!-- Left Column: Member/Delegate Selection -->
          <div class="col-lg-7 d-flex flex-column border-end pe-lg-4">
            <div class="d-flex align-items-center justify-content-between mb-3">
              <h6 class="fw-bold text-slate-900 mb-0 d-flex align-items-center gap-2">
                <i class="bi bi-people-fill text-green-600"></i>
                Select Delegates
              </h6>
              <span class="badge bg-slate-100 text-slate-700 rounded-pill px-2.5 py-1 fs-8 fw-semibold">
                {{ filteredModalRegistrations.length }} Available
              </span>
            </div>

            <!-- Search Bar -->
            <div class="position-relative mb-3 search-input-wrapper">
              <i class="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted fs-7"></i>
              <input
                v-model="memberSearch"
                type="text"
                class="form-control form-control-sm ps-5 rounded-3 py-2 fs-7"
                placeholder="Search member by name, phone, or email..."
              />
              <button
                v-if="memberSearch"
                type="button"
                class="btn btn-sm btn-link text-muted position-absolute top-50 end-0 translate-middle-y me-2 p-0 text-decoration-none"
                @click="memberSearch = ''"
              >
                <i class="bi bi-x-circle-fill"></i>
              </button>
            </div>

            <!-- Status Filter Pills -->
            <div class="d-flex align-items-center gap-1.5 flex-wrap mb-3">
              <button
                v-for="status in statusFilterOptions"
                :key="status.value"
                type="button"
                class="btn-status-pill d-inline-flex align-items-center gap-1.5"
                :class="{ 'btn-status-pill-active': selectedStatusFilter === status.value }"
                @click="selectedStatusFilter = status.value"
              >
                <i :class="['bi', status.icon, 'fs-8']"></i>
                <span>{{ status.label }}</span>
              </button>
            </div>

            <!-- Bulk Select Action Bar -->
            <div class="d-flex align-items-center justify-content-between p-2.5 bulk-action-bar rounded-3 mb-3 fs-7">
              <div class="form-check mb-0 d-flex align-items-center ps-0">
                <input
                  id="selectAllMembers"
                  type="checkbox"
                  class="custom-checkbox me-2.5 ms-1"
                  :checked="isAllFilteredSelected"
                  :indeterminate="isSomeFilteredSelected"
                  @change="toggleSelectAllFiltered"
                />
                <label for="selectAllMembers" class="form-check-label fw-semibold text-slate-700 cursor-pointer select-none">
                  Select All Visible ({{ filteredModalRegistrations.length }})
                </label>
              </div>
              <span class="text-muted fs-8 fw-medium">
                {{ selectedRegistrationIds.length }} Selected Total
              </span>
            </div>

            <!-- Scrollable Member Cards List -->
            <div class="member-scroll-list pe-1 flex-grow-1" style="max-height: 340px; overflow-y: auto;">
              <div v-if="filteredModalRegistrations.length === 0" class="text-center py-5 text-muted fs-7">
                <i class="bi bi-person-x fs-2 d-block text-slate-300 mb-2"></i>
                No delegates found matching your criteria.
              </div>

              <div
                v-for="reg in filteredModalRegistrations"
                :key="reg.id"
                class="member-card d-flex align-items-center justify-content-between p-2.5 rounded-3 mb-2 border transition-all cursor-pointer"
                :class="selectedRegistrationIds.includes(reg.id) ? 'member-card-selected' : 'border-slate-200 bg-white'"
                @click="toggleSelectRegistration(reg.id)"
              >
                <div class="d-flex align-items-center gap-3">
                  <input
                    type="checkbox"
                    class="custom-checkbox ms-2 me-2.5 cursor-pointer"
                    :checked="selectedRegistrationIds.includes(reg.id)"
                    @click.stop
                    @change="toggleSelectRegistration(reg.id)"
                  />
                  <div class="delegate-avatar bg-slate-100 text-slate-700 fw-bold fs-8 rounded-circle d-flex align-items-center justify-content-center" style="width: 34px; height: 34px;">
                    {{ getInitialsByReg(reg) }}
                  </div>
                  <div>
                    <h6 class="fw-semibold text-slate-900 mb-0 fs-7">{{ getRegistrationName(reg) }}</h6>
                    <small class="text-muted fs-8">
                      <i class="bi bi-telephone me-1"></i>{{ reg.phone || reg.email || 'No contact' }}
                    </small>
                  </div>
                </div>

                <span
                  class="badge rounded-pill px-2.5 py-1 fs-8 text-capitalize me-2"
                  :class="getStatusBadgeClass(reg.status)"
                >
                  {{ reg.status || 'Registered' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Right Column: Notification Selection & Review -->
          <div class="col-lg-5 d-flex flex-column ps-lg-4">
            <h6 class="fw-bold text-slate-900 mb-3 d-flex align-items-center gap-2">
              <i class="bi bi-bell-fill text-green-600"></i>
              Notification & Review
            </h6>

            <!-- Select Notification Dropdown -->
            <div class="mb-3">
              <label class="form-label fw-semibold text-slate-700 fs-7">Select Scheduled Notification <span class="text-danger">*</span></label>
              <select
                v-model="form.notification_id"
                class="form-select form-select-sm py-2 rounded-3 fs-7"
                :disabled="dropdownLoading"
                required
              >
                <option value="" disabled>Select a notification...</option>
                <option v-for="n in notificationsList" :key="n.id" :value="n.id">
                  {{ getNotificationOptionLabel(n) }}
                </option>
              </select>
              <small v-if="dropdownLoading" class="text-muted fs-8 d-block mt-1">Loading notifications...</small>
            </div>

            <!-- Dynamic Notification Content Preview Card -->
            <div v-if="selectedNotificationObj" class="p-3 bg-green-50 border border-green-200 rounded-3 mb-3">
              <div class="d-flex align-items-center justify-content-between mb-2">
                <span class="fw-bold text-green-900 fs-7">
                  <i class="bi bi-chat-left-text me-1"></i>
                  {{ selectedNotificationObj.notification_template?.title || 'Template Content' }}
                </span>
                <span class="badge bg-green-200 text-green-800 fs-8 fw-semibold rounded-pill">
                  {{ selectedNotificationObj.notification_date ? formatDate(selectedNotificationObj.notification_date) : 'Scheduled' }}
                </span>
              </div>
              <p class="text-slate-700 fs-8 mb-0 text-break" style="white-space: pre-wrap; max-height: 80px; overflow-y: auto;">
                {{ selectedNotificationObj.notification_template?.content || 'No content preview available.' }}
              </p>
            </div>

            <!-- Selected Delegates Review Panel -->
            <div class="d-flex align-items-center justify-content-between mb-2">
              <label class="form-label fw-semibold text-slate-700 fs-7 mb-0">
                Selected Delegates ({{ selectedRegistrationIds.length }})
              </label>
              <button
                v-if="selectedRegistrationIds.length > 0"
                type="button"
                class="btn btn-link btn-xs text-danger text-decoration-none p-0 fw-semibold fs-8"
                @click="selectedRegistrationIds = []"
              >
                Clear All
              </button>
            </div>

            <div class="selected-review-list flex-grow-1 border rounded-3 p-2 bg-slate-50 mb-3" style="max-height: 180px; overflow-y: auto;">
              <div v-if="selectedRegistrationIds.length === 0" class="text-center py-4 text-muted fs-8">
                No delegates selected yet. Pick delegates from the left column.
              </div>

              <div
                v-for="id in selectedRegistrationIds"
                :key="id"
                class="selected-item-chip d-flex align-items-center justify-content-between p-2 bg-white rounded-2 mb-1.5 border border-slate-200 shadow-2xs"
              >
                <div class="d-flex align-items-center gap-2 overflow-hidden me-2">
                  <div class="avatar-mini bg-green-100 text-green-800 fw-bold fs-8 rounded-circle d-flex align-items-center justify-content-center" style="width: 24px; height: 24px;">
                    {{ getInitials(id) }}
                  </div>
                  <span class="fw-medium text-slate-900 fs-8 text-truncate">
                    {{ getRegistrationNameById(id) }}
                  </span>
                </div>
                <button
                  type="button"
                  class="btn-remove-chip"
                  title="Remove"
                  @click="removeSelectedRegistration(id)"
                >
                  <i class="bi bi-x-lg"></i>
                </button>
              </div>
            </div>

            <!-- Validation Error Alert -->
            <div v-if="formError" class="alert alert-danger py-2 px-3 fs-8 mb-3 rounded-3">
              <i class="bi bi-exclamation-circle-fill me-1"></i>
              {{ formError }}
            </div>

            <!-- Footer Action Buttons -->
            <div class="modal-footer-row mt-auto pt-2 border-top">
              <button type="button" class="btn-cancel" @click="showModal = false">Cancel</button>
              <button type="submit" class="btn-submit" :disabled="crud.saving.value || selectedRegistrationIds.length === 0">
                <span v-if="crud.saving.value" class="spinner-border spinner-border-sm me-2"></span>
                Link {{ selectedRegistrationIds.length }} Delegate{{ selectedRegistrationIds.length === 1 ? '' : 's' }}
              </button>
            </div>
          </div>
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
    const [notifRes, regRes] = await Promise.all([
      cachedFetch<any>('/api/notifications'),
      cachedFetch<any>('/api/registrations'),
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

// Modal State & Multi-Select Logic
const showModal = ref(false);
const showViewModal = ref(false);
const showDeleteModal = ref(false);
const viewingItem = ref<NotificationRegistration | null>(null);
const deletingItem = ref<NotificationRegistration | null>(null);

const memberSearch = ref('');
const selectedStatusFilter = ref('all');
const selectedRegistrationIds = ref<number[]>([]);

const statusFilterOptions = [
  { label: 'All', value: 'all', icon: 'bi-people-fill' },
  { label: 'Confirmed / Approved', value: 'confirmed', icon: 'bi-patch-check-fill' },
  { label: 'Pending', value: 'pending', icon: 'bi-hourglass-split' },
  { label: 'Checked In', value: 'attended', icon: 'bi-person-check-fill' },
];

const form = reactive({
  notification_id: '' as number | '',
});
const formError = ref('');

const selectedNotificationObj = computed(() => {
  if (!form.notification_id) return null;
  return notificationsList.value.find((n) => n.id === Number(form.notification_id)) || null;
});

const filteredModalRegistrations = computed(() => {
  return registrationsList.value.filter((reg) => {
    // Status filter
    if (selectedStatusFilter.value !== 'all') {
      const regStatus = (reg.status || '').toLowerCase();
      const target = selectedStatusFilter.value.toLowerCase();
      if (target === 'confirmed') {
        if (!['confirmed', 'approved', 'completed', 'active', 'verified'].includes(regStatus)) return false;
      } else if (regStatus !== target) {
        return false;
      }
    }
    // Search query filter
    if (memberSearch.value.trim()) {
      const q = memberSearch.value.toLowerCase().trim();
      const fullName = `${reg.first_name || ''} ${reg.last_name || ''}`.toLowerCase();
      const phone = (reg.phone || '').toLowerCase();
      const email = (reg.email || '').toLowerCase();
      const idStr = String(reg.id);
      return fullName.includes(q) || phone.includes(q) || email.includes(q) || idStr.includes(q);
    }
    return true;
  });
});

const isAllFilteredSelected = computed(() => {
  const visible = filteredModalRegistrations.value;
  if (visible.length === 0) return false;
  return visible.every((reg) => selectedRegistrationIds.value.includes(reg.id));
});

const isSomeFilteredSelected = computed(() => {
  const visible = filteredModalRegistrations.value;
  if (visible.length === 0) return false;
  const count = visible.filter((reg) => selectedRegistrationIds.value.includes(reg.id)).length;
  return count > 0 && count < visible.length;
});

function toggleSelectRegistration(id: number) {
  const index = selectedRegistrationIds.value.indexOf(id);
  if (index > -1) {
    selectedRegistrationIds.value.splice(index, 1);
  } else {
    selectedRegistrationIds.value.push(id);
  }
}

function removeSelectedRegistration(id: number) {
  const index = selectedRegistrationIds.value.indexOf(id);
  if (index > -1) {
    selectedRegistrationIds.value.splice(index, 1);
  }
}

function toggleSelectAllFiltered() {
  const visibleIds = filteredModalRegistrations.value.map((r) => r.id);
  if (isAllFilteredSelected.value) {
    // Deselect all visible
    selectedRegistrationIds.value = selectedRegistrationIds.value.filter((id) => !visibleIds.includes(id));
  } else {
    // Select all visible (union)
    const newSet = new Set([...selectedRegistrationIds.value, ...visibleIds]);
    selectedRegistrationIds.value = Array.from(newSet);
  }
}

function getInitialsByReg(reg: any) {
  const f = reg?.first_name?.[0] || 'D';
  const l = reg?.last_name?.[0] || '';
  return `${f}${l}`.toUpperCase();
}

function getStatusBadgeClass(status?: string) {
  const s = (status || '').toLowerCase();
  if (['confirmed', 'approved', 'completed', 'active', 'verified'].includes(s)) {
    return 'status-badge-confirmed';
  }
  if (s === 'pending') return 'status-badge-pending';
  if (s === 'attended' || s === 'checked_in') return 'status-badge-attended';
  return 'bg-slate-100 text-slate-700 border border-slate-200';
}

function openCreateModal() {
  form.notification_id = notificationsList.value[0]?.id || '';
  memberSearch.value = '';
  selectedStatusFilter.value = 'all';
  selectedRegistrationIds.value = [];
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
    formError.value = 'Please select a scheduled notification.';
    return;
  }
  if (selectedRegistrationIds.value.length === 0) {
    formError.value = 'Please select at least one delegate from the list.';
    return;
  }
  formError.value = '';

  const notificationId = Number(form.notification_id);
  const targets = [...selectedRegistrationIds.value];
  crud.saving.value = true;
  let successCount = 0;

  try {
    for (const regId of targets) {
      const ok = await crud.createItem(
        {
          notification_id: notificationId,
          registration_id: regId,
        },
        undefined // Silent toast per item in batch
      );
      if (ok) successCount++;
    }

    if (successCount > 0) {
      showModal.value = false;
      const notivue = useNotivue();
      if (notivue) {
        notivue.success(`Linked ${successCount} delegate${successCount === 1 ? '' : 's'} to notification successfully.`);
      }
      crud.fetchItems();
    }
  } catch (err) {
    console.error('Batch registration failed:', err);
    formError.value = 'Failed to link some delegates. Please check inputs and try again.';
  } finally {
    crud.saving.value = false;
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

/* Premium Palette & Custom Modal Theme Styling */
.modal-header-accent {
  background: linear-gradient(135deg, rgba(67, 118, 108, 0.08) 0%, rgba(248, 250, 229, 0.4) 100%);
  border-left: 4px solid #43766C;
}

.search-input-wrapper input {
  background: #F8FAE5;
  border-color: #d1d8be;
  transition: all 0.2s ease;
}

.search-input-wrapper input:focus {
  background: #ffffff;
  border-color: #43766C;
  box-shadow: 0 0 0 3px rgba(67, 118, 108, 0.15);
}

.btn-status-pill {
  border-radius: 999px;
  padding: 0.35rem 0.85rem;
  font-size: 0.78rem;
  font-weight: 600;
  transition: all 0.2s ease;
  background: #ffffff;
  color: #76453B;
  border: 1px solid #d1d8be;
  cursor: pointer;
}

.btn-status-pill:hover {
  background: #F8FAE5;
  color: #43766C;
}

.btn-status-pill-active {
  background: #43766C !important;
  color: #F8FAE5 !important;
  border-color: #43766C !important;
  box-shadow: 0 2px 8px rgba(67, 118, 108, 0.25);
}

.bulk-action-bar {
  background: #F8FAE5;
  border: 1px solid #e2e8d3;
}

.custom-checkbox {
  width: 20px !important;
  height: 20px !important;
  min-width: 20px !important;
  min-height: 20px !important;
  border-radius: 6px !important;
  border: 2px solid #B19470 !important;
  cursor: pointer;
  float: none !important;
  flex-shrink: 0 !important;
  margin-top: 0 !important;
  margin-bottom: 0 !important;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  appearance: none !important;
  -webkit-appearance: none !important;
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  background-color: #ffffff;
  position: relative;
  box-sizing: border-box;
}

.custom-checkbox:hover {
  border-color: #43766C;
}

.custom-checkbox:checked {
  background-color: #43766C;
  border-color: #43766C;
  box-shadow: 0 2px 6px rgba(67, 118, 108, 0.3);
}

.custom-checkbox:checked::after {
  content: '';
  width: 5px;
  height: 9px;
  border: solid #F8FAE5;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg) translate(-1px, -1px);
}

.custom-checkbox:indeterminate {
  background-color: #B19470;
  border-color: #B19470;
}

.custom-checkbox:indeterminate::after {
  content: '';
  width: 8px;
  height: 2px;
  background-color: #F8FAE5;
}

.member-card {
  border-color: #e5e9db;
  background: #ffffff;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.member-card:hover {
  background: #F8FAE5;
  border-color: #B19470;
  transform: translateY(-1px);
}

.member-card-selected {
  background: rgba(67, 118, 108, 0.07) !important;
  border-color: #43766C !important;
  box-shadow: inset 0 0 0 1px #43766C, 0 2px 8px rgba(67, 118, 108, 0.08);
}

.preview-card-theme {
  background: #F8FAE5;
  border: 1px solid #d8e0c8;
}

.status-badge-confirmed {
  background-color: rgba(67, 118, 108, 0.12);
  color: #43766C;
  border: 1px solid rgba(67, 118, 108, 0.3);
}

.status-badge-pending {
  background-color: rgba(177, 148, 112, 0.15);
  color: #76453B;
  border: 1px solid rgba(177, 148, 112, 0.3);
}

.status-badge-attended {
  background-color: rgba(118, 69, 59, 0.1);
  color: #76453B;
  border: 1px solid rgba(118, 69, 59, 0.25);
}

.selected-item-chip {
  background: #ffffff;
  border: 1px solid #d8e0c8;
  transition: all 0.15s ease;
}

.selected-item-chip:hover {
  border-color: #43766C;
}

.btn-remove-chip {
  background: rgba(118, 69, 59, 0.08);
  border: none;
  color: #76453B;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  transition: all 0.15s;
}

.btn-remove-chip:hover {
  color: #ffffff;
  background: #76453B;
}

@media (max-width: 767.98px) {
  .filter-select {
    max-width: 100%;
    width: 100%;
  }
}
</style>
