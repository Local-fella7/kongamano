<template>
  <div class="events-page">
    <!-- Header Toolbar -->
    <div class="page-header d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
      <div class="d-flex align-items-center gap-3">
        <div class="header-icon-box">
          <i class="bi bi-calendar-event-fill"></i>
        </div>
        <div>
          <h2 class="page-heading">Events Management</h2>
          <p class="page-subheading">Create, organize, and manage conference events, schedules, and venue details.</p>
        </div>
      </div>
      <button class="btn-create" @click="openCreateModal">
        <i class="bi bi-plus-lg fs-6"></i>
        <span>New Event</span>
      </button>
    </div>

    <!-- Search & Filter Bar -->
    <div class="card border-0 shadow-sm rounded-4 p-3 mb-4">
      <div class="d-flex align-items-center justify-content-between flex-wrap gap-3">
        <div class="d-flex align-items-center gap-3">
          <h6 class="fw-bold text-slate-900 mb-0">Events Catalog</h6>
          <span class="badge bg-green-subtle text-green-700 rounded-pill px-2.5 py-1 fs-8 fw-bold">
            {{ crud.filteredItems.value.length }} Total
          </span>
        </div>

        <div class="search-box position-relative" style="min-width: 280px;">
          <i class="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted fs-7"></i>
          <input
            v-model="crud.searchQuery.value"
            type="text"
            class="form-control form-control-sm ps-5 pe-4 py-2 rounded-pill border-slate-200"
            placeholder="Search events, venues..."
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

    <!-- Loading State -->
    <div v-if="crud.loading.value" class="state-box card border-0 shadow-sm rounded-4">
      <div class="spinner-border text-success" role="status"></div>
      <p class="mt-3 text-muted mb-0">Loading events...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="crud.filteredItems.value.length === 0" class="state-box card border-0 shadow-sm rounded-4">
      <i class="bi bi-calendar-x text-muted opacity-40 fs-1"></i>
      <h6 class="fw-semibold text-slate-800 mt-3 mb-1">No Events Found</h6>
      <p class="text-muted fs-7 mb-3">There are no events matching your criteria.</p>
      <button class="btn btn-success btn-sm rounded-3 px-3" @click="openCreateModal">
        <i class="bi bi-plus-lg me-1"></i> Create First Event
      </button>
    </div>

    <!-- Gradient Header Event Cards Grid -->
    <div v-else class="event-grid-container d-flex flex-column justify-content-between flex-grow-1">
      <div class="row g-4 mb-4">
        <div
          v-for="event in crud.paginatedItems.value"
          :key="event.id"
          class="col-12 col-md-6 col-xl-4"
        >
          <div class="card gradient-header-card h-100 border-0 shadow-sm rounded-4 overflow-hidden bg-white">
            <!-- Top Gradient Header Banner -->
            <div class="card-gradient-header px-4 py-4 d-flex align-items-center justify-content-between">
              <div class="d-flex align-items-center gap-3 overflow-hidden">
                <div class="header-avatar-circle shadow-2xs">
                  <i class="bi bi-calendar-check-fill"></i>
                </div>
                <div class="overflow-hidden">
                  <h5 class="fw-bold text-white mb-1 fs-6 text-truncate" :title="event.name">{{ event.name }}</h5>
                  <span class="event-type-badge text-truncate">
                    <i class="bi bi-tag-fill me-1"></i>
                    {{ getEventTypeName(event.event_type_id) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Card Body Content -->
            <div class="card-body p-4 d-flex flex-column justify-content-between">
              <div>
                <!-- Description / Summary -->
                <p class="text-muted fs-7 mb-3 line-clamp-2" style="min-height: 2.4rem;">
                  {{ event.description || 'No description provided for this event.' }}
                </p>

                <!-- Event Metadata Box (Schedule & Location Only) -->
                <div class="event-meta-banner p-3 rounded-3 bg-light-subtle border mb-3">
                  <!-- Schedule Row -->
                  <div class="d-flex align-items-center justify-content-between gap-2 mb-2 text-slate-700 fs-7">
                    <div class="d-flex align-items-center gap-2">
                      <i class="bi bi-calendar3 text-green-600 fs-7"></i>
                      <span class="text-muted fs-8">Schedule:</span>
                    </div>
                    <span class="fw-semibold text-slate-900">
                      {{ formatDate(event.date_from || event.start_date) }}
                      <span v-if="event.date_to || event.end_date"> – {{ formatDate(event.date_to || event.end_date) }}</span>
                    </span>
                  </div>

                  <!-- Location Row -->
                  <div class="d-flex align-items-center justify-content-between gap-2 text-slate-700 fs-7">
                    <div class="d-flex align-items-center gap-2">
                      <i class="bi bi-geo-alt-fill text-danger fs-7"></i>
                      <span class="text-muted fs-8">Location:</span>
                    </div>
                    <span class="fw-semibold text-slate-900 text-truncate ms-2" style="max-width: 210px;" :title="event.location || event.venue">
                      {{ event.location || event.venue || 'Online / Remote' }}
                    </span>
                  </div>
                </div>

                <!-- Quick Setup Pills (Balanced: Label Left, Chips Right) -->
                <div class="d-flex align-items-center justify-content-between gap-2 mb-2 px-1">
                  <span class="fs-8 text-muted fw-semibold">Event Setup:</span>
                  <div class="d-flex align-items-center gap-2">
                    <button
                      class="btn-setup-chip btn-setup-chip--services"
                      @click="openServicesModal(event)"
                      title="Manage Services"
                    >
                      <i class="bi bi-lightning-fill me-1.5"></i>
                      <span>Services</span>
                    </button>

                    <button
                      class="btn-setup-chip btn-setup-chip--acc"
                      @click="openAccommodationsModal(event)"
                      title="Manage Accommodations"
                    >
                      <i class="bi bi-building-fill me-1.5"></i>
                      <span>Accommodations</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Action Buttons Row inside Card Footer (Balanced: ID Left, Buttons Right) -->
              <div class="d-flex align-items-center justify-content-between gap-2 pt-3 border-top mt-2">
                <!-- Live Event Status Badge -->
                <span
                  class="badge status-pill rounded-3 border d-inline-flex align-items-center gap-1.5"
                  :class="getEventStatusBadge(event).class"
                >
                  <span class="status-dot"></span>
                  <span>{{ getEventStatusBadge(event).label }}</span>
                </span>

                <div class="d-flex align-items-center gap-2">
                  <button
                    class="btn btn-outline-secondary btn-sm rounded-3 fw-semibold fs-7 d-flex align-items-center justify-content-center py-2 px-2.5 shadow-2xs"
                    @click="openView(event)"
                    title="View Details"
                  >
                    <i class="bi bi-eye-fill small-action-icon text-slate-700"></i>
                  </button>

                  <button
                    class="btn btn-outline-success btn-sm rounded-3 fw-semibold fs-7 d-flex align-items-center justify-content-center py-2 px-2.5 shadow-2xs"
                    @click="openEdit(event)"
                    title="Edit Event"
                  >
                    <i class="bi bi-pencil-fill small-action-icon"></i>
                  </button>

                  <button
                    class="btn btn-outline-danger btn-sm rounded-3 fw-semibold fs-7 d-flex align-items-center justify-content-center py-2 px-2.5 shadow-2xs"
                    @click="confirmDelete(event)"
                    title="Delete Event"
                  >
                    <i class="bi bi-trash-fill small-action-icon"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Pagination Bar -->
      <div v-if="crud.filteredItems.value.length > 0" class="pagination-footer card border-0 shadow-sm rounded-4 d-flex align-items-center justify-content-between flex-wrap gap-3 px-4 py-3 bg-white mt-auto">
        <!-- Left Side: Range Info -->
        <div class="fs-7 text-muted fw-medium">
          Showing <span class="fw-bold text-slate-900">{{ (crud.currentPage.value - 1) * crud.perPage.value + 1 }}</span> to <span class="fw-bold text-slate-900">{{ Math.min(crud.currentPage.value * crud.perPage.value, crud.filteredItems.value.length) }}</span> of <span class="fw-bold text-slate-900">{{ crud.filteredItems.value.length }}</span> events
        </div>

        <!-- Center/Right: Page Numbers Navigation -->
        <nav v-if="crud.totalPages.value > 1" aria-label="Page navigation">
          <ul class="pagination pagination-sm mb-0 gap-1">
            <li class="page-item" :class="{ disabled: crud.currentPage.value === 1 }">
              <button class="page-link rounded-3 border-0 shadow-2xs d-flex align-items-center justify-content-center p-0" style="width: 32px; height: 32px;" @click="crud.currentPage.value--" :disabled="crud.currentPage.value === 1">
                <i class="bi bi-chevron-left fs-8"></i>
              </button>
            </li>
            <li
              v-for="page in crud.totalPages.value"
              :key="page"
              class="page-item"
              :class="{ active: crud.currentPage.value === page }"
            >
              <button class="page-link rounded-3 border-0 shadow-2xs d-flex align-items-center justify-content-center p-0" style="width: 32px; height: 32px;" @click="crud.currentPage.value = page">
                {{ page }}
              </button>
            </li>
            <li class="page-item" :class="{ disabled: crud.currentPage.value === crud.totalPages.value }">
              <button class="page-link rounded-3 border-0 shadow-2xs d-flex align-items-center justify-content-center p-0" style="width: 32px; height: 32px;" @click="crud.currentPage.value++" :disabled="crud.currentPage.value === crud.totalPages.value">
                <i class="bi bi-chevron-right fs-8"></i>
              </button>
            </li>
          </ul>
        </nav>

        <!-- Right Side: Per Page Selector -->
        <div class="d-flex align-items-center gap-2">
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

    <!-- Create / Edit Modal -->
    <CommonModal
      v-model="showModal"
      :title="editingItem ? 'Edit Event' : 'Create New Event'"
      :icon="editingItem ? 'bi-pencil-square' : 'bi-plus-circle-fill'"
      size="lg"
    >
      <form @submit.prevent="handleSubmit">
        <!-- Row 1: Full-Width Event Title -->
        <div class="mb-3">
          <label class="form-label fw-semibold text-slate-700">Event Title <span class="text-danger">*</span></label>
          <input
            v-model="form.name"
            type="text"
            class="form-control py-2 rounded-3"
            placeholder="e.g. Annual Youth Conference 2026"
            required
            autofocus
          />
        </div>

        <!-- Row 2: Location / Venue & Event Type Side-by-Side (50% / 50%) -->
        <div class="row g-3 mb-3">
          <div class="col-12 col-md-6">
            <label class="form-label fw-semibold text-slate-700">Location / Venue</label>
            <input
              v-model="form.location"
              type="text"
              class="form-control py-2 rounded-3"
              placeholder="e.g. Main Auditorium, City Hall"
            />
          </div>
          <div class="col-12 col-md-6">
            <label class="form-label fw-semibold text-slate-700">Event Type <span class="text-danger">*</span></label>
            <select v-model.number="form.event_type_id" class="form-select py-2 rounded-3" required>
              <option value="" disabled>Select event type...</option>
              <option v-for="t in eventTypes" :key="t.id" :value="t.id">{{ t.name }}</option>
            </select>
          </div>
        </div>

        <!-- Row 3: Start Date & End Date Side-by-Side -->
        <div class="row g-3 mb-3">
          <div class="col-12 col-md-6">
            <label class="form-label fw-semibold text-slate-700">Start Date <span class="text-danger">*</span></label>
            <CommonDatePicker
              v-model="form.start_date"
              placeholder="Select start date"
            />
          </div>
          <div class="col-12 col-md-6">
            <label class="form-label fw-semibold text-slate-700">End Date <span class="text-danger">*</span></label>
            <CommonDatePicker
              v-model="form.end_date"
              placeholder="Select end date"
            />
          </div>
        </div>

        <div class="mb-4">
          <label class="form-label fw-semibold text-slate-700">Description</label>
          <textarea
            v-model="form.description"
            rows="3"
            class="form-control rounded-3"
            placeholder="Write a brief overview of the event details..."
          ></textarea>
        </div>

        <div v-if="formError" class="invalid-feedback d-block mb-3">{{ formError }}</div>

        <div class="modal-footer-row">
          <button type="button" class="btn-cancel" @click="showModal = false">Cancel</button>
          <button type="submit" class="btn-submit" :disabled="crud.saving.value">
            <span v-if="crud.saving.value" class="spinner-border spinner-border-sm me-2"></span>
            {{ editingItem ? 'Save Changes' : 'Create Event' }}
          </button>
        </div>
      </form>
    </CommonModal>

    <!-- View Details Modal -->
    <CommonModal
      v-model="showViewModal"
      title="Event Details"
      icon="bi-calendar-check-fill"
      size="md"
    >
      <div v-if="viewingItem" class="p-1">
        <div class="d-flex align-items-center gap-3 p-3 bg-light rounded-3 mb-3">
          <div class="header-icon-box" style="width: 44px; height: 44px; font-size: 1.25rem;">
            <i class="bi bi-calendar-event-fill"></i>
          </div>
          <div>
            <h6 class="fw-bold text-slate-900 mb-0.5">{{ viewingItem.name }}</h6>
            <span class="fs-8 text-muted fw-medium d-block">{{ getEventTypeName(viewingItem.event_type_id) }}</span>
          </div>
        </div>

        <div class="row g-3 text-slate-700 fs-7 mb-3">
          <div class="col-6">
            <span class="text-muted d-block fs-8">Event Type</span>
            <span class="fw-semibold">{{ getEventTypeName(viewingItem.event_type_id) }}</span>
          </div>
          <div class="col-6">
            <span class="text-muted d-block fs-8">Location</span>
            <span class="fw-semibold">{{ viewingItem.location || viewingItem.venue || 'Online / Remote' }}</span>
          </div>
          <div class="col-6">
            <span class="text-muted d-block fs-8">Start Date</span>
            <span class="fw-semibold">{{ formatDate(viewingItem.date_from || viewingItem.start_date) }}</span>
          </div>
          <div class="col-6">
            <span class="text-muted d-block fs-8">End Date</span>
            <span class="fw-semibold">{{ formatDate(viewingItem.date_to || viewingItem.end_date) }}</span>
          </div>
          <div v-if="viewingItem.description" class="col-12">
            <span class="text-muted d-block fs-8">Description</span>
            <p class="fs-7 text-slate-800 bg-white border rounded-3 p-2.5 mb-0 mt-1">{{ viewingItem.description }}</p>
          </div>
        </div>

        <!-- Linked Services Section -->
        <div class="border-top pt-3 mt-3">
          <div class="d-flex align-items-center justify-content-between mb-2.5">
            <span class="fw-semibold text-slate-900 fs-7 d-flex align-items-center gap-2">
              <i class="bi bi-lightning-fill text-teal-600 fs-6"></i> Linked Services
            </span>
            <span class="badge modal-count-badge modal-count-badge--services">
              {{ eventServices.length }}
            </span>
          </div>

          <div v-if="loadingServices" class="text-muted fs-8 py-2">
            <span class="spinner-border spinner-border-sm text-success me-1"></span> Loading services...
          </div>
          <div v-else-if="eventServices.length === 0" class="text-muted fs-8 fst-italic py-1">
            No services linked to this event.
          </div>
          <div v-else class="d-flex flex-wrap gap-2 py-1">
            <span
              v-for="es in eventServices"
              :key="es.id"
              class="badge modal-item-pill modal-item-pill--service"
            >
              <i class="bi bi-check2-circle me-1 fs-8"></i>
              {{ es.service?.name || getServiceName(es.service_id) }}
            </span>
          </div>
        </div>

        <!-- Linked Accommodations Section -->
        <div class="border-top pt-3 mt-3">
          <div class="d-flex align-items-center justify-content-between mb-2.5">
            <span class="fw-semibold text-slate-900 fs-7 d-flex align-items-center gap-2">
              <i class="bi bi-building-fill text-amber-700 fs-6"></i> Linked Accommodations
            </span>
            <span class="badge modal-count-badge modal-count-badge--acc">
              {{ eventAccommodations.length }}
            </span>
          </div>

          <div v-if="loadingAccommodations" class="text-muted fs-8 py-2">
            <span class="spinner-border spinner-border-sm text-primary me-1"></span> Loading accommodations...
          </div>
          <div v-else-if="eventAccommodations.length === 0" class="text-muted fs-8 fst-italic py-1">
            No accommodations linked to this event.
          </div>
          <div v-else class="d-flex flex-wrap gap-2 py-1">
            <span
              v-for="ea in eventAccommodations"
              :key="ea.id"
              class="badge modal-item-pill modal-item-pill--acc"
            >
              <i class="bi bi-building me-1 fs-8"></i>
              {{ ea.accommodation?.name || getAccommodationName(ea.accommodation_id) }}
            </span>
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

        <div class="mt-4 text-end">
          <button class="btn-cancel" @click="showViewModal = false">Close</button>
        </div>
      </div>
    </CommonModal>

    <!-- Manage Event Services Modal -->
    <CommonModal
      v-model="showServicesModal"
      :title="`Event Services Setup`"
      icon="bi-lightning-fill"
      size="md"
    >
      <div v-if="activeEventForItem" class="p-1">
        <!-- Sub-header Banner -->
        <div class="p-3 rounded-3 bg-teal-subtle border-teal-subtle mb-3 d-flex align-items-center justify-content-between">
          <div>
            <h6 class="fw-bold text-slate-900 mb-0.5">{{ activeEventForItem.name }}</h6>
            <span class="fs-8 text-muted fw-medium">Configure services available during this conference</span>
          </div>
          <span class="badge modal-count-badge modal-count-badge--services fs-7">
            {{ eventServices.length }} Attached
          </span>
        </div>

        <!-- Attach Service Checkbox Selection List -->
        <div class="assign-action-card p-3 rounded-3 border mb-3">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <label class="form-label fs-8 fw-bold text-uppercase text-muted mb-0">Select Services to Attach</label>
            <span v-if="(selectedServicesToAssign?.length || 0) > 0" class="badge bg-teal-subtle text-teal-600 border border-teal-subtle rounded-pill fs-8 fw-bold">
              {{ selectedServicesToAssign.length }} Selected
            </span>
          </div>

          <div v-if="availableServicesList.length === 0" class="text-muted fs-8 py-2 fst-italic">
            All available services have already been attached to this event.
          </div>
          <div v-else class="checkbox-selection-list rounded-3 border bg-white p-2" style="max-height: 160px; overflow-y: auto;">
            <div
              v-for="s in availableServicesList"
              :key="s.id"
              class="form-check custom-checkbox-item p-2 ps-0 ms-3 rounded-2 d-flex align-items-center mb-1"
            >
              <input
                :id="`service-checkbox-${s.id}`"
                v-model="selectedServicesToAssign"
                type="checkbox"
                :value="s.id"
                class="form-check-input me-3.5 ms-0 mt-0 cursor-pointer"
              />
              <label :for="`service-checkbox-${s.id}`" class="form-check-label fs-7 fw-medium text-slate-800 cursor-pointer w-100 ps-1">
                {{ s.name }}
              </label>
            </div>
          </div>
        </div>

        <!-- Loading state -->
        <div v-if="loadingServices" class="text-center py-4">
          <div class="spinner-border spinner-border-sm text-success" role="status"></div>
          <span class="ms-2 fs-7 text-muted">Loading attached services...</span>
        </div>

        <!-- Empty state -->
        <div v-else-if="eventServices.length === 0" class="text-center py-4 bg-light rounded-3 border border-dashed">
          <i class="bi bi-lightning text-muted opacity-50 fs-3"></i>
          <p class="fs-7 text-muted mt-2 mb-0">No services attached to this event yet.</p>
        </div>

        <!-- List of attached services -->
        <div v-else class="attached-items-list d-flex flex-column gap-2">
          <div
            v-for="es in eventServices"
            :key="es.id"
            class="attached-item-card p-3 rounded-3 border bg-white d-flex align-items-center justify-content-between"
          >
            <div class="d-flex align-items-center gap-3">
              <div class="item-icon-box item-icon-box--service rounded-3 d-flex align-items-center justify-content-center">
                <i class="bi bi-lightning-fill"></i>
              </div>
              <div>
                <h6 class="fw-bold text-slate-900 mb-0.5 fs-7">{{ es.service?.name || getServiceName(es.service_id) }}</h6>
                <span class="fs-8 text-muted d-block">
                  <i class="bi bi-clock me-1"></i>{{ es.service?.start_time || '00:00' }} - {{ es.service?.end_time || '23:59' }}
                  <span class="mx-1">•</span>
                  <i class="bi bi-qr-code me-1"></i>QR Scan: {{ es.service?.requires_scan ? 'Required' : 'Optional' }}
                </span>
              </div>
            </div>
            <button
              class="btn-remove-item"
              title="Detach Service"
              @click="unlinkServiceFromEvent(es.id)"
            >
              <i class="bi bi-x-circle-fill fs-6"></i>
              <span class="ms-1 fs-8 fw-semibold">Detach</span>
            </button>
          </div>
        </div>

        <!-- Bottom Modal Footer with Attach & Close Buttons -->
        <div class="mt-4 d-flex align-items-center justify-content-end gap-2 border-top pt-3">
          <button class="btn-cancel" @click="showServicesModal = false">Close</button>
          <button
            class="btn btn-teal-action py-2 px-3.5 rounded-3 fw-semibold d-inline-flex align-items-center gap-1.5"
            :disabled="!selectedServicesToAssign || selectedServicesToAssign.length === 0 || loadingServices"
            @click="assignServiceToEvent"
          >
            <i class="bi bi-plus-lg"></i>
            <span>Attach {{ (selectedServicesToAssign?.length || 0) > 0 ? `(${selectedServicesToAssign.length}) Services` : 'Services' }}</span>
          </button>
        </div>
      </div>
    </CommonModal>

    <!-- Manage Event Accommodations Modal -->
    <CommonModal
      v-model="showAccommodationsModal"
      :title="`Event Accommodations Setup`"
      icon="bi-building-fill"
      size="md"
    >
      <div v-if="activeEventForItem" class="p-1">
        <!-- Sub-header Banner -->
        <div class="p-3 rounded-3 bg-amber-subtle border-amber-subtle mb-3 d-flex align-items-center justify-content-between">
          <div>
            <h6 class="fw-bold text-slate-900 mb-0.5">{{ activeEventForItem.name }}</h6>
            <span class="fs-8 text-muted fw-medium">Allocate lodging & accommodation options for attendees</span>
          </div>
          <span class="badge modal-count-badge modal-count-badge--acc fs-7">
            {{ eventAccommodations.length }} Allocated
          </span>
        </div>

        <!-- Allocate Accommodation Checkbox Selection List -->
        <div class="assign-action-card p-3 rounded-3 border mb-3">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <label class="form-label fs-8 fw-bold text-uppercase text-muted mb-0">Select Accommodations to Allocate</label>
            <span v-if="(selectedAccommodationsToAssign?.length || 0) > 0" class="badge bg-amber-subtle text-amber-700 border border-amber-subtle rounded-pill fs-8 fw-bold">
              {{ selectedAccommodationsToAssign.length }} Selected
            </span>
          </div>

          <div v-if="availableAccommodationsList.length === 0" class="text-muted fs-8 py-2 fst-italic">
            All available accommodations have already been allocated to this event.
          </div>
          <div v-else class="checkbox-selection-list rounded-3 border bg-white p-2" style="max-height: 160px; overflow-y: auto;">
            <div
              v-for="a in availableAccommodationsList"
              :key="a.id"
              class="form-check custom-checkbox-item p-2 ps-0 ms-3 rounded-2 d-flex align-items-center mb-1"
            >
              <input
                :id="`acc-checkbox-${a.id}`"
                v-model="selectedAccommodationsToAssign"
                type="checkbox"
                :value="a.id"
                class="form-check-input me-3.5 ms-0 mt-0 cursor-pointer"
              />
              <label :for="`acc-checkbox-${a.id}`" class="form-check-label fs-7 fw-medium text-slate-800 cursor-pointer w-100 ps-1">
                {{ a.name }}
              </label>
            </div>
          </div>
        </div>

        <!-- Loading state -->
        <div v-if="loadingAccommodations" class="text-center py-4">
          <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
          <span class="ms-2 fs-7 text-muted">Loading allocated accommodations...</span>
        </div>

        <!-- Empty state -->
        <div v-else-if="eventAccommodations.length === 0" class="text-center py-4 bg-light rounded-3 border border-dashed">
          <i class="bi bi-building text-muted opacity-50 fs-3"></i>
          <p class="fs-7 text-muted mt-2 mb-0">No accommodations allocated to this event yet.</p>
        </div>

        <!-- List of allocated accommodations -->
        <div v-else class="attached-items-list d-flex flex-column gap-2">
          <div
            v-for="ea in eventAccommodations"
            :key="ea.id"
            class="attached-item-card p-3 rounded-3 border bg-white d-flex align-items-center justify-content-between"
          >
            <div class="d-flex align-items-center gap-3">
              <div class="item-icon-box item-icon-box--acc rounded-3 d-flex align-items-center justify-content-center">
                <i class="bi bi-building-fill"></i>
              </div>
              <div>
                <h6 class="fw-bold text-slate-900 mb-0.5 fs-7">{{ ea.accommodation?.name || getAccommodationName(ea.accommodation_id) }}</h6>
                <span class="fs-8 text-muted d-block">
                  <i class="bi bi-person-badge me-1"></i>Capacity: {{ ea.accommodation?.capacity ? `${ea.accommodation.capacity} beds` : 'Unlimited' }}
                </span>
              </div>
            </div>
            <button
              class="btn-remove-item"
              title="Remove Allocation"
              @click="unlinkAccommodationFromEvent(ea.id)"
            >
              <i class="bi bi-x-circle-fill fs-6"></i>
              <span class="ms-1 fs-8 fw-semibold">Remove</span>
            </button>
          </div>
        </div>

        <!-- Bottom Modal Footer with Allocate & Close Buttons -->
        <div class="mt-4 d-flex align-items-center justify-content-end gap-2 border-top pt-3">
          <button class="btn-cancel" @click="showAccommodationsModal = false">Close</button>
          <button
            class="btn btn-amber-action py-2 px-3.5 rounded-3 fw-semibold d-inline-flex align-items-center gap-1.5"
            :disabled="!selectedAccommodationsToAssign || selectedAccommodationsToAssign.length === 0 || loadingAccommodations"
            @click="assignAccommodationToEvent"
          >
            <i class="bi bi-plus-lg"></i>
            <span>Allocate {{ (selectedAccommodationsToAssign?.length || 0) > 0 ? `(${selectedAccommodationsToAssign.length}) Options` : 'Accommodations' }}</span>
          </button>
        </div>
      </div>
    </CommonModal>

    <!-- Delete Confirm Modal -->
    <CommonModal
      v-model="showDeleteModal"
      title="Delete Event"
      icon="bi-exclamation-triangle-fill"
      variant="danger"
      size="sm"
    >
      <div class="text-center">
        <p class="text-slate-700 fs-6 mb-1">
          Are you sure you want to delete event <strong>{{ deletingItem?.name }}</strong>?
        </p>
        <p class="text-muted fs-7 mb-4">This action cannot be undone.</p>
        <div class="modal-footer-row justify-content-center">
          <button class="btn-cancel" @click="showDeleteModal = false">Cancel</button>
          <button class="btn-danger-confirm" @click="handleDelete" :disabled="crud.saving.value">
            <span v-if="crud.saving.value" class="spinner-border spinner-border-sm me-2"></span>
            Delete Event
          </button>
        </div>
      </div>
    </CommonModal>
  </div>
</template>

<script setup lang="ts">
import type { Event } from '~/types/event';
import type { EventType } from '~/types/event-type';
import type { EventService, EventAccommodation } from '~/types/event-assignment';
import type { Service } from '~/types/service';
import type { Accommodation } from '~/types/accommodation';

definePageMeta({ layout: 'default' });

const token = useCookie<string | null>('token');
const eventTypes = ref<EventType[]>([]);

const crud = useCrudApi<Event>({
  endpoint: '/api/events',
  dataKey: 'events',
  searchFields: ['name', 'location', 'description'],
});

// Modal State
const showModal = ref(false);
const showViewModal = ref(false);
const showDeleteModal = ref(false);
const showServicesModal = ref(false);
const showAccommodationsModal = ref(false);
const activeEventForItem = ref<Event | null>(null);
const viewingItem = ref<Event | null>(null);
const editingItem = ref<Event | null>(null);
const deletingItem = ref<Event | null>(null);

const eventServices = ref<EventService[]>([]);
const eventAccommodations = ref<EventAccommodation[]>([]);
const allServicesList = ref<Service[]>([]);
const allAccommodationsList = ref<Accommodation[]>([]);
const loadingServices = ref(false);
const loadingAccommodations = ref(false);
const selectedServicesToAssign = ref<number[]>([]);
const selectedAccommodationsToAssign = ref<number[]>([]);

const form = reactive({
  name: '',
  event_type_id: '' as number | string,
  location: '',
  start_date: '',
  end_date: '',
  description: '',
});
const formError = ref('');

async function fetchEventTypes() {
  try {
    const res = await $fetch<any>('/api/event-types', {
      headers: { Authorization: `Bearer ${token.value}`, Accept: 'application/json' },
    });
    eventTypes.value = Array.isArray(res?.data?.event_types) ? res.data.event_types : (Array.isArray(res?.data) ? res.data : []);
  } catch (err) {
    console.error('Failed to load event types:', err);
  }
}

async function fetchMasterLists() {
  try {
    const headers = { Authorization: `Bearer ${token.value}`, Accept: 'application/json' };
    const [sRes, aRes] = await Promise.all([
      $fetch<any>('/api/services', { headers }),
      $fetch<any>('/api/accommodations', { headers }),
    ]);
    allServicesList.value = Array.isArray(sRes?.data?.services) ? sRes.data.services : (Array.isArray(sRes?.data) ? sRes.data : []);
    allAccommodationsList.value = Array.isArray(aRes?.data?.accommodations) ? aRes.data.accommodations : (Array.isArray(aRes?.data) ? aRes.data : []);
  } catch (err) {
    console.error('Failed to fetch services/accommodations master list:', err);
  }
}

async function fetchEventServices(eventId: number) {
  loadingServices.value = true;
  const headers = { Authorization: `Bearer ${token.value}`, Accept: 'application/json' };
  try {
    const res = await $fetch<any>(`/api/event-services?event_id=${eventId}`, { headers });
    eventServices.value = Array.isArray(res?.data?.event_services) ? res.data.event_services : (Array.isArray(res?.data) ? res.data : []);
  } catch (err) {
    console.error('Failed to load event services:', err);
  } finally {
    loadingServices.value = false;
  }
}

async function fetchEventAccommodations(eventId: number) {
  loadingAccommodations.value = true;
  const headers = { Authorization: `Bearer ${token.value}`, Accept: 'application/json' };
  try {
    const res = await $fetch<any>(`/api/event-accommodations?event_id=${eventId}`, { headers });
    eventAccommodations.value = Array.isArray(res?.data?.event_accommodations) ? res.data.event_accommodations : (Array.isArray(res?.data) ? res.data : []);
  } catch (err) {
    console.error('Failed to load event accommodations:', err);
  } finally {
    loadingAccommodations.value = false;
  }
}

const availableServicesList = computed(() => {
  const assignedIds = new Set(eventServices.value.map(es => es.service_id));
  return allServicesList.value.filter(s => !assignedIds.has(s.id));
});

const availableAccommodationsList = computed(() => {
  const assignedIds = new Set(eventAccommodations.value.map(ea => ea.accommodation_id));
  return allAccommodationsList.value.filter(a => !assignedIds.has(a.id));
});

async function assignServiceToEvent() {
  if (!activeEventForItem.value || selectedServicesToAssign.value.length === 0) return;
  const headers = { Authorization: `Bearer ${token.value}`, Accept: 'application/json' };
  try {
    const eventId = activeEventForItem.value.id;
    await Promise.all(
      selectedServicesToAssign.value.map(serviceId =>
        $fetch('/api/event-services', {
          method: 'POST',
          headers,
          body: { event_id: eventId, service_id: Number(serviceId) },
        })
      )
    );
    selectedServicesToAssign.value = [];
    await fetchEventServices(eventId);
  } catch (err) {
    console.error('Failed to assign services:', err);
  }
}

async function unlinkServiceFromEvent(eventServiceId: number) {
  if (!activeEventForItem.value) return;
  const headers = { Authorization: `Bearer ${token.value}`, Accept: 'application/json' };
  try {
    await $fetch(`/api/event-services/${eventServiceId}`, {
      method: 'DELETE',
      headers,
    });
    await fetchEventServices(activeEventForItem.value.id);
  } catch (err) {
    console.error('Failed to unlink service:', err);
  }
}

async function assignAccommodationToEvent() {
  if (!activeEventForItem.value || selectedAccommodationsToAssign.value.length === 0) return;
  const headers = { Authorization: `Bearer ${token.value}`, Accept: 'application/json' };
  try {
    const eventId = activeEventForItem.value.id;
    await Promise.all(
      selectedAccommodationsToAssign.value.map(accId =>
        $fetch('/api/event-accommodations', {
          method: 'POST',
          headers,
          body: { event_id: eventId, accommodation_id: Number(accId) },
        })
      )
    );
    selectedAccommodationsToAssign.value = [];
    await fetchEventAccommodations(eventId);
  } catch (err) {
    console.error('Failed to assign accommodations:', err);
  }
}

async function unlinkAccommodationFromEvent(eventAccId: number) {
  if (!activeEventForItem.value) return;
  const headers = { Authorization: `Bearer ${token.value}`, Accept: 'application/json' };
  try {
    await $fetch(`/api/event-accommodations/${eventAccId}`, {
      method: 'DELETE',
      headers,
    });
    await fetchEventAccommodations(activeEventForItem.value.id);
  } catch (err) {
    console.error('Failed to unlink accommodation:', err);
  }
}

function openServicesModal(event: Event) {
  activeEventForItem.value = event;
  selectedServicesToAssign.value = [];
  showServicesModal.value = true;
  fetchEventServices(event.id);
}

function openAccommodationsModal(event: Event) {
  activeEventForItem.value = event;
  selectedAccommodationsToAssign.value = [];
  showAccommodationsModal.value = true;
  fetchEventAccommodations(event.id);
}

function getServiceName(serviceId: number) {
  const found = allServicesList.value.find(s => s.id === serviceId);
  return found ? found.name : `Service #${serviceId}`;
}

function getAccommodationName(accId: number) {
  const found = allAccommodationsList.value.find(a => a.id === accId);
  return found ? found.name : `Accommodation #${accId}`;
}

function getEventTypeName(typeId: number) {
  const found = eventTypes.value.find((t) => t.id === typeId);
  return found ? found.name : `Type #${typeId}`;
}

function openCreateModal() {
  editingItem.value = null;
  form.name = '';
  form.event_type_id = eventTypes.value[0]?.id || '';
  form.location = '';
  form.start_date = new Date().toISOString().split('T')[0];
  form.end_date = new Date().toISOString().split('T')[0];
  form.description = '';
  formError.value = '';
  showModal.value = true;
}

function openView(item: Event) {
  viewingItem.value = item;
  activeEventForItem.value = item;
  showViewModal.value = true;
  fetchEventServices(item.id);
  fetchEventAccommodations(item.id);
}

function openEdit(item: Event) {
  editingItem.value = item;
  form.name = item.name;
  form.event_type_id = item.event_type_id;
  form.location = item.location || item.venue || '';
  const startDateStr = item.date_from || item.start_date || '';
  const endDateStr = item.date_to || item.end_date || '';
  form.start_date = startDateStr ? startDateStr.split(' ')[0].split('T')[0] : '';
  form.end_date = endDateStr ? endDateStr.split(' ')[0].split('T')[0] : '';
  form.description = item.description || '';
  formError.value = '';
  showModal.value = true;
}

function confirmDelete(item: Event) {
  deletingItem.value = item;
  showDeleteModal.value = true;
}

async function handleSubmit() {
  if (!form.name.trim()) {
    formError.value = 'Event title is required.';
    return;
  }
  if (!form.event_type_id) {
    formError.value = 'Please select an event type.';
    return;
  }
  if (!form.start_date || !form.end_date) {
    formError.value = 'Start and end dates are required.';
    return;
  }

  formError.value = '';
  const startDateFormatted = `${form.start_date} 00:00:00`;
  const endDateFormatted = `${form.end_date} 23:59:59`;

  const payload = {
    name: form.name,
    event_type_id: Number(form.event_type_id),
    location: form.location,
    date_from: startDateFormatted,
    date_to: endDateFormatted,
    description: form.description,
  };

  let success = false;
  if (editingItem.value) {
    success = await crud.updateItem(editingItem.value.id, payload, 'Event updated successfully.');
  } else {
    success = await crud.createItem(payload, 'Event created successfully.');
  }

  if (success) {
    showModal.value = false;
  }
}

async function handleDelete() {
  if (!deletingItem.value) return;
  const success = await crud.deleteItem(deletingItem.value.id, 'Event deleted successfully.');
  if (success) {
    showDeleteModal.value = false;
    deletingItem.value = null;
  }
}

function getEventStatusBadge(event: Event) {
  const now = new Date();
  const startStr = (event.date_from || event.start_date || '').replace(' ', 'T');
  const endStr = (event.date_to || event.end_date || '').replace(' ', 'T');

  const start = startStr ? new Date(startStr) : null;
  const end = endStr ? new Date(endStr) : null;

  if (end && !isNaN(end.getTime()) && now > end) {
    return { label: 'Completed', class: 'status-badge--completed' };
  }
  if (start && !isNaN(start.getTime()) && now < start) {
    return { label: 'Scheduled', class: 'status-badge--scheduled' };
  }
  return { label: 'Active', class: 'status-badge--active' };
}

onMounted(() => {
  crud.fetchItems();
  fetchEventTypes();
  fetchMasterLists();
});
</script>

<style scoped>
.events-page {
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

/* ── Gradient Header Event Card Layout ────────────── */
.gradient-header-card {
  transition: transform 0.22s ease, box-shadow 0.22s ease;
  min-height: 250px;
}

.gradient-header-card:hover {
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

.event-type-badge {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
}

.event-meta-banner {
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
.text-green-700 { color: var(--green-700); }
.text-green-600 { color: var(--green-600); }

/* ── Standalone Setup Chips (Fully Rounded Pill Shape) ── */
.btn-setup-chip {
  border: 1px solid transparent;
  border-radius: 50rem;
  padding: 0.35rem 0.85rem;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.2;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
}

.btn-setup-chip--services {
  background-color: rgba(67, 118, 108, 0.08);
  color: #43766c;
  border-color: rgba(67, 118, 108, 0.2);
}

.btn-setup-chip--services:hover {
  background-color: #43766c;
  color: #ffffff;
  border-color: #43766c;
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(67, 118, 108, 0.25);
}

.btn-setup-chip--acc {
  background-color: rgba(118, 69, 59, 0.08);
  color: #76453b;
  border-color: rgba(118, 69, 59, 0.2);
}

.btn-setup-chip--acc:hover {
  background-color: #76453b;
  color: #ffffff;
  border-color: #76453b;
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(118, 69, 59, 0.25);
}

/* ── Modal Linked Item Badges & Counters ────────── */
.bg-teal-subtle {
  background-color: #f0f7f5;
}

.border-teal-subtle {
  border: 1px solid rgba(67, 118, 108, 0.2);
}

.bg-amber-subtle {
  background-color: #fbf7f0;
}

.border-amber-subtle {
  border: 1px solid rgba(118, 69, 59, 0.2);
}

.assign-action-card {
  background-color: #f8fafc;
  border-color: var(--slate-200) !important;
}

.custom-checkbox-item {
  transition: background-color 0.15s ease;
  border-bottom: 1px solid #f1f5f9;
}

.custom-checkbox-item:last-child {
  border-bottom: none;
}

.custom-checkbox-item:hover {
  background-color: #f1f5f9;
}

.custom-checkbox-item .form-check-input {
  width: 1.15rem;
  height: 1.15rem;
  border: 2px solid #64748b !important;
  border-radius: 4px;
  background-color: #ffffff;
}

.custom-checkbox-item .form-check-input:checked {
  background-color: #43766c !important;
  border-color: #43766c !important;
}

.btn-teal-action {
  background-color: #43766c;
  color: #ffffff;
  border: none;
}

.btn-teal-action:hover:not(:disabled) {
  background-color: #355f57;
  color: #ffffff;
}

.btn-amber-action {
  background-color: #76453b;
  color: #ffffff;
  border: none;
}

.btn-amber-action:hover:not(:disabled) {
  background-color: #5e362e;
  color: #ffffff;
}

.attached-item-card {
  transition: all 0.18s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.03);
}

.attached-item-card:hover {
  border-color: var(--slate-300) !important;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.item-icon-box {
  width: 40px;
  height: 40px;
  font-size: 1.1rem;
}

.item-icon-box--service {
  background-color: #f0f7f5;
  color: #43766c;
  border: 1px solid rgba(67, 118, 108, 0.2);
}

.item-icon-box--acc {
  background-color: #fbf7f0;
  color: #76453b;
  border: 1px solid rgba(118, 69, 59, 0.2);
}

.btn-remove-item {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.35rem 0.6rem;
  border-radius: 6px;
  transition: all 0.18s ease;
  display: inline-flex;
  align-items: center;
}

.btn-remove-item:hover {
  background-color: #fef2f2;
  color: #ef4444;
}

.modal-count-badge {
  border-radius: 50rem;
  padding: 0.25rem 0.6rem;
  font-size: 0.72rem;
  font-weight: 700;
}

.modal-count-badge--services {
  background-color: #f0f7f5;
  color: #43766c;
  border: 1px solid rgba(67, 118, 108, 0.2);
}

.modal-count-badge--acc {
  background-color: #fbf7f0;
  color: #76453b;
  border: 1px solid rgba(118, 69, 59, 0.2);
}

.modal-item-pill {
  font-size: 0.78rem;
  font-weight: 600;
  padding: 0.4rem 0.75rem;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  transition: transform 0.15s ease;
}

.modal-item-pill:hover {
  transform: translateY(-1px);
}

.modal-item-pill--service {
  background-color: #f0f7f5;
  color: #43766c;
  border: 1px solid rgba(67, 118, 108, 0.3);
}

.modal-item-pill--acc {
  background-color: #fbf7f0;
  color: #76453b;
  border: 1px solid rgba(118, 69, 59, 0.3);
}

.text-teal-600 { color: #43766c; }
.text-amber-700 { color: #76453b; }

.status-pill {
  padding: 0.45rem 0.75rem;
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
  background-color: #eff6ff;
  color: #1d4ed8;
  border-color: #bfdbfe !important;
}

.status-badge--active {
  background-color: #f0fdf4;
  color: #15803d;
  border-color: #bbf7d0 !important;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
  display: inline-block;
}
</style>
