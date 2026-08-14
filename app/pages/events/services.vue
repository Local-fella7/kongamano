<template>
  <div class="event-services-page">
    <!-- Header Toolbar -->
    <div class="page-header d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
      <div class="d-flex align-items-center gap-3">
        <div class="header-icon-box">
          <i class="bi bi-lightning-fill"></i>
        </div>
        <div>
          <h2 class="page-heading">Event Services</h2>
          <p class="page-subheading">Manage services assigned to conference events.</p>
        </div>
      </div>
      <button class="btn-create" @click="openCreateModal">
        <i class="bi bi-plus-lg fs-6"></i>
        <span>Assign Service</span>
      </button>
    </div>

    <!-- Search & Filter Bar -->
    <div class="card border-0 shadow-sm rounded-4 p-3 mb-4">
      <div class="d-flex align-items-center justify-content-between flex-wrap gap-3">
        <div class="d-flex align-items-center gap-3">
          <h6 class="fw-bold text-slate-900 mb-0">Event Services Catalog</h6>
          <span class="badge bg-green-subtle text-green-700 rounded-pill px-2.5 py-1 fs-8 fw-bold">
            {{ crud.filteredItems.value.length }} Total
          </span>
        </div>

        <div class="d-flex align-items-center gap-3 flex-wrap">
          <!-- Event Selector Filter -->
          <div class="d-flex align-items-center gap-2">
            <span class="fs-7 text-muted fw-semibold text-nowrap">Filter Event:</span>
            <select v-model="selectedFilterEventId" @change="onFilterEventChange" class="form-select form-select-sm rounded-3 fs-7 border-slate-200 shadow-2xs py-1.5 px-3" style="min-width: 200px;">
              <option value="">All Events</option>
              <option v-for="e in eventsList" :key="e.id" :value="e.id">{{ e.name }}</option>
            </select>
          </div>

          <div class="search-box position-relative" style="min-width: 240px;">
            <i class="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted fs-7"></i>
            <input
              v-model="crud.searchQuery.value"
              type="text"
              class="form-control form-control-sm ps-5 pe-4 py-2 rounded-pill border-slate-200"
              placeholder="Search service..."
            />
            <button
              v-if="crud.searchQuery.value"
              @click="crud.searchQuery.value = ''"
              class="btn btn-link position-absolute top-50 end-0 translate-middle-y text-muted text-decoration-none pe-3 py-0"
              style="font-size: 0.8rem;"
            >
              <i class="bi bi-x-circle-fill"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="crud.loading.value" class="state-box card border-0 shadow-sm rounded-4">
      <div class="spinner-border text-success" role="status"></div>
      <p class="mt-3 text-muted mb-0">Loading event services...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="crud.filteredItems.value.length === 0" class="state-box card border-0 shadow-sm rounded-4">
      <i class="bi bi-lightning-charge text-muted opacity-40 fs-1"></i>
      <h6 class="fw-semibold text-slate-800 mt-3 mb-1">No Event Services Found</h6>
      <p class="text-muted fs-7 mb-3">No assigned event services match your criteria.</p>
      <button class="btn btn-success btn-sm rounded-3 px-3" @click="openCreateModal">
        <i class="bi bi-plus-lg me-1"></i> Assign First Service
      </button>
    </div>

    <!-- Event Service Cards Grid (Each Card = 1 Event Service) -->
    <div v-else class="event-grid-container d-flex flex-column justify-content-between flex-grow-1">
      <div class="row g-4 mb-4">
        <div
          v-for="es in crud.paginatedItems.value"
          :key="es.id"
          class="col-12 col-md-6 col-xl-4"
        >
          <div class="card event-service-card h-100 border-0 shadow-sm rounded-4 overflow-hidden bg-white">
            <!-- Top Gradient Header Banner: Service Name -->
            <div class="card-gradient-header px-4 py-3.5 d-flex align-items-center justify-content-between">
              <div class="d-flex align-items-center gap-3 overflow-hidden">
                <div class="header-avatar-circle shadow-2xs">
                  <i class="bi bi-lightning-fill"></i>
                </div>
                <div class="overflow-hidden">
                  <h5 class="fw-bold text-white mb-0.5 fs-6 text-truncate" :title="es.service?.name || getServiceName(es.service_id)">
                    {{ es.service?.name || getServiceName(es.service_id) }}
                  </h5>
                  <span class="service-event-badge text-truncate">
                    <i class="bi bi-calendar-event-fill me-1"></i>
                    {{ es.event?.name || getEventName(es.event_id) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Card Body Content -->
            <div class="card-body p-4 d-flex flex-column justify-content-between">
              <div>
                <!-- Metadata Info Banner -->
                <div class="meta-banner p-3 rounded-3 bg-light-subtle border mb-2">
                  <!-- Schedule Time -->
                  <div class="d-flex align-items-center justify-content-between gap-2 mb-2 text-slate-700 fs-7">
                    <div class="d-flex align-items-center gap-2">
                      <i class="bi bi-clock text-green-600 fs-7"></i>
                      <span class="text-muted fs-8">Schedule:</span>
                    </div>
                    <span class="fw-semibold text-slate-900 fs-7">
                      {{ es.service?.start_time || '00:00:00' }} – {{ es.service?.end_time || '23:59:59' }}
                    </span>
                  </div>

                  <!-- QR Scan Requirement -->
                  <div class="d-flex align-items-center justify-content-between gap-2 text-slate-700 fs-7">
                    <div class="d-flex align-items-center gap-2">
                      <i class="bi bi-qr-code-scan text-primary fs-7"></i>
                      <span class="text-muted fs-8">QR Scan Req:</span>
                    </div>
                    <span
                      class="badge rounded-pill px-2.5 py-0.5 fs-8 fw-bold"
                      :class="es.service?.requires_scan ? 'bg-primary-subtle text-primary border border-primary-subtle' : 'bg-slate-100 text-slate-600 border'"
                    >
                      {{ es.service?.requires_scan ? 'Required' : 'Optional' }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Action Buttons Row inside Card Footer -->
              <div class="d-flex align-items-center justify-content-end gap-2 pt-3 border-top mt-3">
                <button
                  class="btn btn-outline-secondary btn-sm rounded-3 fw-semibold fs-7 d-flex align-items-center justify-content-center py-2 px-2.5 shadow-2xs"
                  @click="openView(es)"
                  title="View Event Service Details"
                >
                  <i class="bi bi-eye-fill small-action-icon text-slate-700"></i>
                </button>

                <button
                  class="btn btn-outline-danger btn-sm rounded-3 fw-semibold fs-7 d-flex align-items-center justify-content-center py-2 px-2.5 shadow-2xs"
                  @click="confirmDelete(es)"
                  title="Unlink Event Service"
                >
                  <i class="bi bi-trash-fill small-action-icon"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Pagination Bar -->
      <div v-if="crud.filteredItems.value.length > 0" class="pagination-footer card border-0 shadow-sm rounded-4 gap-3 px-4 py-3 bg-white mt-auto">
        <!-- Left Side: Range Info -->
        <div class="pagination-footer__meta fs-7 text-muted fw-medium">
          Showing <span class="fw-bold text-slate-900">{{ (crud.currentPage.value - 1) * crud.perPage.value + 1 }}</span> to <span class="fw-bold text-slate-900">{{ Math.min(crud.currentPage.value * crud.perPage.value, crud.filteredItems.value.length) }}</span> of <span class="fw-bold text-slate-900">{{ crud.filteredItems.value.length }}</span> event services
        </div>

        <!-- Center Column: Page Numbers Navigation -->
        <div class="pagination-footer__pages">
          <AppPagination
            :current-page="crud.currentPage.value"
            :total-pages="crud.totalPages.value"
            @update:current-page="crud.currentPage.value = $event"
          />
        </div>

        <!-- Right Side: Per Page Selector -->
        <div class="pagination-footer__per-page d-flex align-items-center gap-2">
          <span class="fs-7 text-muted fw-medium text-nowrap">Per Page:</span>
          <select v-model="crud.perPage.value" class="form-select form-select-sm rounded-3 fs-7 border-slate-200 shadow-2xs cursor-pointer px-3" style="width: auto;">
            <option :value="6">6</option>
            <option :value="9">9</option>
            <option :value="12">12</option>
            <option :value="24">24</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Create / Assign Modal -->
    <CommonModal
      v-model="showModal"
      title="Assign Service to Event"
      icon="bi-lightning-charge-fill"
      size="md"
    >
      <form @submit.prevent="handleSubmit">
        <div class="mb-3">
          <label class="form-label fw-semibold text-slate-700">Select Event <span class="text-danger">*</span></label>
          <select v-model.number="form.event_id" class="form-select py-2 rounded-3" required autofocus>
            <option value="" disabled>Choose an event...</option>
            <option v-for="e in eventsList" :key="e.id" :value="e.id">{{ e.name }}</option>
          </select>
        </div>

        <div class="mb-4">
          <label class="form-label fw-semibold text-slate-700">Select Service <span class="text-danger">*</span></label>
          <select v-model.number="form.service_id" class="form-select py-2 rounded-3" required>
            <option value="" disabled>Choose a service...</option>
            <option v-for="s in servicesList" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>

        <div v-if="formError" class="invalid-feedback d-block mb-3">{{ formError }}</div>

        <div class="modal-footer-row">
          <button type="button" class="btn-cancel" @click="showModal = false">Cancel</button>
          <button type="submit" class="btn-submit" :disabled="crud.saving.value">
            <span v-if="crud.saving.value" class="spinner-border spinner-border-sm me-2"></span>
            Assign Service
          </button>
        </div>
      </form>
    </CommonModal>

    <!-- View Details Modal -->
    <CommonModal
      v-model="showViewModal"
      title="Event Service Details"
      icon="bi-lightning-fill"
      size="md"
    >
      <div v-if="viewingItem" class="p-1">
        <div class="d-flex align-items-center gap-3 p-3 bg-light rounded-3 mb-3">
          <div class="avatar-box bg-green-subtle text-green-600" style="width: 44px; height: 44px; font-size: 1.25rem;">
            <i class="bi bi-lightning-fill"></i>
          </div>
          <div>
            <h6 class="fw-bold text-slate-900 mb-0.5">{{ viewingItem.service?.name || getServiceName(viewingItem.service_id) }}</h6>
            <span class="fs-8 text-muted fw-medium d-block">Assigned to {{ viewingItem.event?.name || getEventName(viewingItem.event_id) }}</span>
          </div>
        </div>

        <div class="row g-3 text-slate-700 fs-7 mb-3">
          <div class="col-6">
            <span class="text-muted d-block fs-8">Service Name</span>
            <span class="fw-semibold">{{ viewingItem.service?.name || getServiceName(viewingItem.service_id) }}</span>
          </div>
          <div class="col-6">
            <span class="text-muted d-block fs-8">Event Name</span>
            <span class="fw-semibold">{{ viewingItem.event?.name || getEventName(viewingItem.event_id) }}</span>
          </div>
          <div class="col-6">
            <span class="text-muted d-block fs-8">Start Time</span>
            <span class="fw-semibold">{{ viewingItem.service?.start_time || '—' }}</span>
          </div>
          <div class="col-6">
            <span class="text-muted d-block fs-8">End Time</span>
            <span class="fw-semibold">{{ viewingItem.service?.end_time || '—' }}</span>
          </div>
          <div class="col-6">
            <span class="text-muted d-block fs-8">Requires QR Scan</span>
            <span class="fw-semibold">{{ viewingItem.service?.requires_scan ? 'Yes' : 'No' }}</span>
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
      title="Unlink Event Service"
      icon="bi-exclamation-triangle-fill"
      variant="danger"
      size="sm"
    >
      <div class="text-center">
        <p class="text-slate-700 fs-6 mb-1">
          Are you sure you want to unlink service <strong>{{ deletingItem?.service?.name || getServiceName(deletingItem?.service_id || 0) }}</strong>?
        </p>
        <p class="text-muted fs-7 mb-4">This action will remove the service from the event.</p>
        <div class="modal-footer-row justify-content-center">
          <button class="btn-cancel" @click="showDeleteModal = false">Cancel</button>
          <button class="btn-danger-confirm" @click="handleDelete" :disabled="crud.saving.value">
            <span v-if="crud.saving.value" class="spinner-border spinner-border-sm me-2"></span>
            Unlink Service
          </button>
        </div>
      </div>
    </CommonModal>
  </div>
</template>

<script setup lang="ts">
import AppPagination from '~/components/common/AppPagination.vue';
import type { EventService } from '~/types/event-assignment';
import type { Event } from '~/types/event';
import type { Service } from '~/types/service';

definePageMeta({ layout: 'default' });

const token = useCookie<string | null>('token');
const eventsList = ref<Event[]>([]);
const servicesList = ref<Service[]>([]);

const selectedFilterEventId = ref<number | string>('');

const crud = useCrudApi<EventService>({
  endpoint: '/api/event-services',
  dataKey: 'event_services',
  searchFields: ['id', 'event_id', 'service_id', 'service.name', 'event.name'],
});

function onFilterEventChange() {
  if (selectedFilterEventId.value) {
    crud.fetchItems({ event_id: selectedFilterEventId.value });
  } else {
    crud.fetchItems();
  }
}

// Modal State
const showModal = ref(false);
const showViewModal = ref(false);
const showDeleteModal = ref(false);
const viewingItem = ref<EventService | null>(null);
const deletingItem = ref<EventService | null>(null);

const form = reactive({
  event_id: '' as number | string,
  service_id: '' as number | string,
});
const formError = ref('');

async function fetchDropdownData() {
  try {
    const [eRes, sRes] = await Promise.all([
      cachedFetch<any>('/api/events'),
      cachedFetch<any>('/api/services'),
    ]);
    eventsList.value = Array.isArray(eRes?.data?.events) ? eRes.data.events : (Array.isArray(eRes?.data) ? eRes.data : []);
    servicesList.value = Array.isArray(sRes?.data?.services) ? sRes.data.services : (Array.isArray(sRes?.data) ? sRes.data : []);
  } catch (err) {
    console.error('Failed to load dropdown data:', err);
  }
}

function getEventName(eventId: number) {
  const found = eventsList.value.find(e => e.id === eventId);
  return found ? found.name : `Event #${eventId}`;
}

function getServiceName(serviceId: number) {
  const found = servicesList.value.find(s => s.id === serviceId);
  return found ? found.name : `Service #${serviceId}`;
}

function openCreateModal() {
  form.event_id = eventsList.value[0]?.id || '';
  form.service_id = servicesList.value[0]?.id || '';
  formError.value = '';
  showModal.value = true;
}

function openView(item: EventService) {
  viewingItem.value = item;
  showViewModal.value = true;
}

function confirmDelete(item: EventService) {
  deletingItem.value = item;
  showDeleteModal.value = true;
}

async function handleSubmit() {
  if (!form.event_id) {
    formError.value = 'Please select an event.';
    return;
  }
  if (!form.service_id) {
    formError.value = 'Please select a service.';
    return;
  }

  formError.value = '';
  const payload = {
    event_id: Number(form.event_id),
    service_id: Number(form.service_id),
  };

  const success = await crud.createItem(payload, 'Event service assigned successfully.');
  if (success) {
    showModal.value = false;
  }
}

async function handleDelete() {
  if (!deletingItem.value) return;
  const success = await crud.deleteItem(deletingItem.value.id, 'Event service unlinked successfully.');
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
.event-services-page {
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

.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.event-service-card {
  transition: transform 0.22s ease, box-shadow 0.22s ease;
  min-height: 230px;
}

.event-service-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.08) !important;
}

.card-gradient-header {
  background: linear-gradient(135deg, var(--green-900) 0%, var(--green-500) 100%);
  padding: 1.25rem 1.5rem !important;
  min-height: 80px;
}

.header-avatar-circle {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(4px);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.25);
}

.service-event-badge {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
}

.meta-banner {
  background: #f8fafc;
  border: 1px solid var(--slate-200);
}

.small-action-icon {
  font-size: 0.72rem !important;
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
.text-green-600 { color: var(--green-600); }
</style>
