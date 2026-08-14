<template>
  <div class="scannings-page d-flex flex-column min-vh-100">
    <!-- Page Header -->
    <div class="page-header d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
      <div class="d-flex align-items-center gap-3">
        <div class="header-icon-box">
          <i class="bi bi-qr-code-scan"></i>
        </div>
        <div>
          <h2 class="page-heading">Scannings & Check-ins</h2>
          <p class="page-subheading">Live attendee check-in scanner and event service access logs.</p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="d-flex align-items-center flex-wrap gap-2">
        <div v-if="pendingCount > 0" class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-pill py-2 px-3 fs-8 fw-semibold d-flex align-items-center gap-1.5" title="Queued scans syncing in background">
          <span class="spinner-grow spinner-grow-sm text-warning" role="status"></span>
          <span>{{ pendingCount }} Syncing</span>
        </div>

        <div v-if="isPreloadingRegistrations" class="badge bg-info-subtle text-info border border-info-subtle rounded-pill py-2 px-3 fs-8 fw-semibold d-flex align-items-center gap-1.5">
          <span class="spinner-border spinner-border-sm" role="status"></span>
          <span>Preloading Attendee Data...</span>
        </div>

        <div class="form-check form-switch bg-light py-1.5 px-3 rounded-pill border d-flex align-items-center gap-2 mb-0 shadow-2xs">
          <input
            id="fastScanSwitch"
            v-model="fastScanMode"
            class="form-check-input mt-0 cursor-pointer"
            type="checkbox"
            role="switch"
          />
          <label class="form-check-label fs-8 fw-bold text-slate-700 cursor-pointer select-none" for="fastScanSwitch">
            <i class="bi bi-lightning-charge-fill text-warning me-1"></i>
            Fast Scan Mode
          </label>
        </div>

        <button
          class="btn btn-outline-primary rounded-3 py-2 px-3 fw-semibold fs-7 shadow-2xs d-flex align-items-center gap-2"
          :disabled="!selectedEventId"
          @click="showManualModal = true"
        >
          <i class="bi bi-keyboard-fill"></i>
          <span>Manual Check-in</span>
        </button>

        <button
          class="btn btn-emerald rounded-3 py-2 px-3 fw-bold fs-7 shadow-2xs d-flex align-items-center gap-2"
          :disabled="!selectedEventId"
          @click="openCameraModal"
        >
          <i class="bi bi-camera-fill"></i>
          <span>Start Camera Scanner</span>
        </button>
      </div>
    </div>

    <!-- Live Scan Statistics Breakdown Bar -->
    <div class="scan-stats-bar d-flex align-items-center gap-2 overflow-x-auto pb-2 mb-3">
      <!-- All Scans Pill -->
      <button
        type="button"
        class="btn btn-sm rounded-pill px-3 py-1.5 fs-8 fw-semibold text-nowrap d-flex align-items-center gap-1.5 transition-all"
        :class="(!selectedScanTypeFilter && !selectedServiceFilter) ? 'btn-primary text-white shadow-2xs' : 'btn-light text-slate-700 border border-slate-200'"
        @click="setQuickFilter('')"
      >
        <i class="bi bi-collection-fill"></i>
        <span>All Scans</span>
        <span class="badge rounded-pill" :class="(!selectedScanTypeFilter && !selectedServiceFilter) ? 'bg-white text-primary' : 'bg-slate-200 text-slate-800'">
          {{ scanStatistics.totalScans }}
        </span>
      </button>

      <!-- Check-ins Pill -->
      <button
        type="button"
        class="btn btn-sm rounded-pill px-3 py-1.5 fs-8 fw-semibold text-nowrap d-flex align-items-center gap-1.5 transition-all"
        :class="(selectedScanTypeFilter === 'check_in' && !selectedServiceFilter) ? 'btn-emerald text-white shadow-2xs' : 'btn-light text-slate-700 border border-slate-200'"
        @click="setQuickFilter('check_in')"
      >
        <i class="bi bi-check-circle-fill text-emerald-600" :class="{ 'text-white': selectedScanTypeFilter === 'check_in' && !selectedServiceFilter }"></i>
        <span>Check-ins</span>
        <span class="badge rounded-pill" :class="(selectedScanTypeFilter === 'check_in' && !selectedServiceFilter) ? 'bg-white text-emerald-700' : 'bg-emerald-100 text-emerald-800'">
          {{ scanStatistics.totalCheckIns }}
        </span>
      </button>

      <!-- Check-outs Pill -->
      <button
        type="button"
        class="btn btn-sm rounded-pill px-3 py-1.5 fs-8 fw-semibold text-nowrap d-flex align-items-center gap-1.5 transition-all"
        :class="(selectedScanTypeFilter === 'check_out') ? 'btn-danger text-white shadow-2xs' : 'btn-light text-slate-700 border border-slate-200'"
        @click="setQuickFilter('check_out')"
      >
        <i class="bi bi-door-closed-fill text-danger" :class="{ 'text-white': selectedScanTypeFilter === 'check_out' }"></i>
        <span>Check-outs</span>
        <span class="badge rounded-pill" :class="(selectedScanTypeFilter === 'check_out') ? 'bg-white text-danger' : 'bg-rose-100 text-rose-800'">
          {{ scanStatistics.totalCheckOuts }}
        </span>
      </button>

      <!-- Individual Service Count Pills -->
      <button
        v-for="srv in scanStatistics.services"
        :key="srv.id"
        type="button"
        class="btn btn-sm rounded-pill px-3 py-1.5 fs-8 fw-semibold text-nowrap d-flex align-items-center gap-1.5 transition-all"
        :class="(selectedServiceFilter === srv.id) ? 'btn-purple text-white shadow-2xs' : 'btn-light text-slate-700 border border-slate-200'"
        @click="setQuickFilter('service', srv.id)"
      >
        <i class="bi bi-gift-fill text-purple-600" :class="{ 'text-white': selectedServiceFilter === srv.id }"></i>
        <span>{{ srv.name }}</span>
        <span class="badge rounded-pill" :class="(selectedServiceFilter === srv.id) ? 'bg-white text-purple-700' : 'bg-purple-100 text-purple-800'">
          {{ srv.count }}
        </span>
      </button>
    </div>

    <!-- Standardized Data Table -->
    <CommonDataTable
      v-model:searchQuery="searchQuery"
      v-model:currentPage="currentPage"
      v-model:perPage="perPage"
      :loading="loadingLogs"
      :totalCount="filteredLogs.length"
      :totalPages="totalPages"
      :startIndex="startIndex"
      :endIndex="endIndex"
    >
      <template #filters>
        <!-- Target Event Filter Dropdown -->
        <select
          v-model.number="selectedEventId"
          class="form-select form-select-sm rounded-pill py-2 px-3 border-slate-200 fs-8 shadow-2xs"
          style="max-width: 220px;"
        >
          <option value="" disabled>Select Event...</option>
          <option v-for="ev in eventsList" :key="ev.id" :value="Number(ev.id)">
            {{ ev.name || ev.title || `Event #${ev.id}` }}
          </option>
        </select>

        <!-- Scan Type Filter Dropdown -->
        <select
          v-model="selectedScanTypeFilter"
          class="form-select form-select-sm rounded-pill py-2 px-3 border-slate-200 fs-8 shadow-2xs"
          style="max-width: 175px;"
          @change="handleScanTypeChange"
        >
          <option value="">All Scan Types</option>
          <option value="check_in">Event Check-in</option>
          <option value="service">Service Access</option>
          <option value="check_out">Event Check-out</option>
        </select>

        <!-- Specific Service Filter Dropdown (always accessible when services exist) -->
        <select
          v-if="servicesList.length > 0"
          v-model="selectedServiceFilter"
          class="form-select form-select-sm rounded-pill py-2 px-3 border-slate-200 fs-8 shadow-2xs"
          style="max-width: 200px;"
        >
          <option value="">All Services ({{ scanStatistics.totalServiceScans }})</option>
          <option v-for="srv in scanStatistics.services" :key="srv.id" :value="srv.id">
            {{ srv.name }} ({{ srv.count }})
          </option>
        </select>
      </template>

      <table class="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Attendee / Delegate</th>
            <th>QR Code</th>
            <th>Scan Type</th>
            <th>Service</th>
            <th>Scanned At</th>
            <th class="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(log, idx) in paginatedLogs" :key="log.id || idx">
            <td class="row-index">{{ startIndex + idx }}</td>
            <td>
              <span class="fw-bold text-slate-900 fs-7 d-block">
                {{ formatAttendeeDisplayName(log) }}
              </span>
              <span class="fs-8 text-muted">{{ log.registration?.phone || log.phone || '—' }}</span>
            </td>
            <td>
              <code class="px-2 py-1 bg-slate-100 rounded text-slate-800 fs-8">{{ log.qr_code }}</code>
            </td>
            <td>
              <span
                class="badge rounded-pill border px-2.5 py-1 fs-8 fw-semibold"
                :class="{
                  'bg-purple-50 text-purple-700 border-purple-200': log.service_id || log.service || log.scan_type === 'service',
                  'bg-rose-50 text-rose-700 border-rose-200': !log.service_id && !log.service && log.scan_type === 'check_out',
                  'bg-emerald-50 text-emerald-700 border-emerald-200': !log.service_id && !log.service && log.scan_type !== 'check_out'
                }"
              >
                {{ (log.service_id || log.service || log.scan_type === 'service') ? 'Service Scan' : (log.scan_type === 'check_out' ? 'Event Check-out' : 'Event Check-in') }}
              </span>
            </td>
            <td>
              <span class="fs-8 text-slate-700 fw-semibold">{{ getLogServiceName(log) }}</span>
            </td>
            <td>
              <span class="fs-8 text-muted">{{ log.created_at ? formatDate(log.created_at) : '—' }}</span>
            </td>
            <td class="text-end">
              <button
                class="btn btn-outline-primary btn-sm rounded-3 fw-semibold fs-8 py-1.5 px-2.5 shadow-2xs"
                @click="openVerifyForLog(log)"
                title="View Verification Details"
              >
                <i class="bi bi-eye-fill me-1"></i> Verify
              </button>
            </td>
          </tr>
          <tr v-if="!loadingLogs && paginatedLogs.length === 0">
            <td colspan="7" class="text-center py-4 text-muted fs-8">
              No scan logs found matching your filters.
            </td>
          </tr>
        </tbody>
      </table>
    </CommonDataTable>

    <!-- Pop-up Modal 1: Live Camera QR Scanner -->
    <CommonModal
      v-model="showCameraModal"
      title="Live Camera QR Scanner"
      icon="bi-camera-fill"
      size="md"
      @close="stopScanner"
    >
      <div class="p-1">
        <div class="d-flex align-items-center justify-content-between mb-3">
          <span class="fs-8 fw-bold text-uppercase text-muted">Scanning Event: {{ selectedEventName }}</span>
          <button
            v-if="!scanningActive"
            class="btn btn-emerald btn-sm rounded-3 fw-semibold fs-8 px-3"
            @click="startScanner"
          >
            <i class="bi bi-play-fill me-1"></i> Start Camera
          </button>
          <button
            v-else
            class="btn btn-outline-danger btn-sm rounded-3 fw-semibold fs-8 px-3"
            @click="stopScanner"
          >
            <i class="bi bi-stop-fill me-1"></i> Stop Camera
          </button>
        </div>

        <div class="scanner-viewport-wrapper rounded-3 border bg-slate-900 position-relative overflow-hidden mb-3 d-flex align-items-center justify-content-center" style="min-height: 260px;">
          <div id="qr-reader" style="width: 100%;"></div>
          <div v-if="!scanningActive" class="text-center text-slate-400 p-4">
            <i class="bi bi-qr-code-scan fs-1 d-block mb-2 opacity-50"></i>
            <p class="fs-7 mb-0">Click "Start Camera" to scan attendee badges.</p>
          </div>
        </div>

        <div v-if="scanFeedback" class="alert fs-8 py-2 px-3 mb-0 rounded-3 shadow-2xs" :class="scanFeedback.type === 'success' ? 'alert-success' : 'alert-danger'">
          <i :class="['bi me-1.5', scanFeedback.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill']"></i>
          {{ scanFeedback.message }}
        </div>
      </div>
    </CommonModal>

    <!-- Pop-up Modal 2: Manual QR Check-in -->
    <CommonModal
      v-model="showManualModal"
      title="Manual QR Check-in"
      icon="bi-keyboard-fill"
      size="md"
    >
      <form @submit.prevent="handleManualCheckin">
        <div class="mb-3">
          <label class="form-label fs-8 fw-bold text-uppercase text-muted">QR Code / Registration ID</label>
          <input
            v-model="manualQrCode"
            type="text"
            class="form-control form-control-sm rounded-3 py-2"
            placeholder="e.g. REG-1-TEST001"
            :disabled="submitting"
            required
          />
        </div>

        <div class="mb-3">
          <label class="form-label fs-8 fw-bold text-uppercase text-muted">Scan Type</label>
          <select v-model="scanType" class="form-select form-select-sm rounded-3 py-2">
            <option value="check_in">Event Check-in</option>
            <option value="service">Service Access</option>
          </select>
        </div>

        <div v-if="scanType === 'service'" class="mb-3">
          <label class="form-label fs-8 fw-bold text-uppercase text-muted">Service</label>
          <select v-model.number="selectedServiceId" class="form-select form-select-sm rounded-3 py-2" required>
            <option value="" disabled>Select service...</option>
            <option v-for="s in servicesList" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>

        <div class="d-flex justify-content-end gap-2 mt-4">
          <button type="button" class="btn btn-outline-secondary btn-sm rounded-3 px-3 py-2 fw-semibold fs-7" @click="showManualModal = false">
            Cancel
          </button>
          <button
            type="submit"
            class="btn btn-emerald btn-sm rounded-3 px-4 py-2 fw-semibold fs-7 shadow-2xs"
            :disabled="submitting"
          >
            <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
            Process Check-in
          </button>
        </div>
      </form>
    </CommonModal>

    <!-- Pop-up Modal 3: Attendee Scan Verification -->
    <CommonModal
      v-model="showResultModal"
      title="Attendee Scan Verification"
      icon="bi-patch-check-fill"
      size="md"
    >
      <div v-if="scannedAttendee" class="p-1">
        <!-- Event Name Banner -->
        <div class="p-3 bg-emerald-50 rounded-3 border border-emerald-200 mb-3 text-center">
          <span class="fs-8 text-uppercase text-emerald-700 fw-bold d-block tracking-wider">Target Event</span>
          <h5 class="fw-extrabold text-slate-900 mb-0 fs-6 mt-0.5">{{ selectedEventName }}</h5>
        </div>

        <!-- Delegate Information -->
        <div class="d-flex align-items-center flex-wrap gap-2 gap-sm-3 p-3 bg-light rounded-3 border mb-3">
          <div class="flex-grow-1 overflow-hidden">
            <h6 class="fw-bold text-slate-900 mb-0 fs-6 text-truncate">{{ formatAttendeeDisplayName(scannedAttendee) }}</h6>
            <div class="d-flex align-items-center flex-wrap gap-1.5 fs-8 text-muted mt-0.5">
              <span v-if="getAttendeePhoneNumber(scannedAttendee)">
                <i class="bi bi-phone me-1"></i>{{ getAttendeePhoneNumber(scannedAttendee) }}
              </span>
              <span v-if="getAttendeePhoneNumber(scannedAttendee)" class="d-none d-sm-inline">•</span>
              <code class="d-inline-block">{{ scannedAttendee?.qr_code || scannedQrCode }}</code>
            </div>
          </div>
          <div class="w-100 w-sm-auto mt-1 mt-sm-0">
            <span v-if="isAttendeeCheckedOutToday" class="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill px-3 py-1 fs-8 fw-bold">
              <i class="bi bi-door-closed-fill me-1"></i> Checked Out Today
            </span>
            <span v-else-if="isAttendeeCheckedIn" class="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3 py-1 fs-8 fw-bold">
              <i class="bi bi-check-circle-fill me-1"></i> Checked In
            </span>
            <span v-else class="badge rounded-pill px-3 py-1 fs-8 fw-bold border shadow-2xs" style="background-color: #F8FAE5; color: #76453B; border-color: #B19470 !important;">
              <i class="bi bi-clock-history me-1" style="color: #76453B;"></i> Not Checked In Today
            </span>
          </div>
        </div>

        <!-- Sequential Action Card (Check-in or Current Active Service) -->
        <div class="mb-3">
          <!-- Option EXPIRED: Event Completed → QR Code Disabled -->
          <div v-if="isSelectedEventCompleted" class="p-3 bg-danger-subtle rounded-3 border border-danger-subtle text-center">
            <i class="bi bi-slash-circle-fill text-danger fs-2 d-block mb-1"></i>
            <h6 class="fw-bold text-danger fs-7 mb-1">QR Code Disabled (Event Ended)</h6>
            <p class="fs-8 text-muted mb-0">
              This QR code badge belongs to <strong>{{ selectedEventName }}</strong> which has already ended. Check-ins and service claims are disabled for completed events.
            </p>
          </div>

          <!-- Option A: Not Checked In Right Now (First Check-in OR Re-entry Check-in) -->
          <div v-else-if="!isAttendeeCheckedIn" class="p-3 bg-emerald-50 rounded-3 border border-emerald-200 text-center">
            <div v-if="isReentryToday" class="alert alert-warning py-1.5 px-3 fs-8 mb-2 rounded-3 text-start d-flex align-items-center gap-2">
              <i class="bi bi-exclamation-triangle-fill fs-6 text-amber-600"></i>
              <span><strong>Re-Entry Alert:</strong> This delegate has already checked in earlier today and is checking in again.</span>
            </div>

            <h6 class="fw-bold text-slate-900 fs-7 mb-1">
              {{ isReentryToday ? 'Re-Entry Check-in Required' : 'Today\'s Event Entry Check-in' }}
            </h6>
            <p class="fs-8 text-muted mb-3">
              {{ isReentryToday ? 'Delegate checked out earlier today. Confirm re-entry check-in to unlock services.' : 'Record event entry check-in for today before claiming services.' }}
            </p>

            <button
              type="button"
              class="btn btn-emerald btn-md w-100 rounded-3 py-2 fw-bold shadow-2xs"
              @click="confirmEventCheckIn"
            >
              <i class="bi bi-qr-code-scan me-1.5"></i> Check In
            </button>
          </div>

          <!-- Option B: Currently Checked-in → Show Next Active Service Card (No Check-In button!) -->
          <div v-else-if="activeCurrentService" class="p-3 bg-primary-subtle rounded-3 border border-primary-subtle">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <span class="fs-8 text-lowercase fw-bold text-primary tracking-wider">active service window</span>
              <span v-if="activeCurrentService.start_time && activeCurrentService.end_time" class="badge bg-white text-dark border border-slate-400 fs-8 fw-bold shadow-2xs" style="color: #000000 !important;">
                <i class="bi bi-clock-fill me-1 text-dark" style="color: #000000 !important;"></i> {{ activeCurrentService.start_time }} – {{ activeCurrentService.end_time }}
              </span>
            </div>
            <h5 class="fw-extrabold text-slate-900 fs-6 mb-1">{{ activeCurrentService.name }}</h5>
            <p class="fs-8 text-muted mb-3">{{ activeCurrentService.description || 'Scan to claim service privilege.' }}</p>
            
            <div class="d-flex flex-column gap-2">
              <button
                type="button"
                class="btn btn-primary btn-md w-100 rounded-3 py-2 fw-bold shadow-2xs"
                :disabled="claimingServiceId === activeCurrentService.id"
                @click="claimService(activeCurrentService.id)"
              >
                <span v-if="claimingServiceId === activeCurrentService.id" class="spinner-border spinner-border-sm me-2"></span>
                <i v-else class="bi bi-check-circle-fill me-1.5"></i> Yes!
              </button>

              <button
                type="button"
                class="btn btn-outline-danger btn-sm w-100 rounded-3 py-1.5 fw-semibold fs-8"
                @click="confirmEventCheckOut"
              >
                <i class="bi bi-door-closed me-1"></i> Check-Out Delegate
              </button>
            </div>
          </div>

          <!-- Option C: All active services claimed today -->
          <div v-else-if="areAllServicesClaimedToday" class="p-3 bg-emerald-50 rounded-3 border border-emerald-200 text-center">
            <i class="bi bi-check-circle-fill text-emerald-600 fs-2 d-block mb-1"></i>
            <h6 class="fw-bold text-slate-900 fs-7 mb-1">All Services Claimed For Today!</h6>
            <p class="fs-8 text-muted mb-3">All scheduled services for today have been claimed by this attendee.</p>
            
            <button
              type="button"
              class="btn btn-outline-danger btn-sm w-100 rounded-3 py-1.5 fw-semibold fs-8"
              @click="confirmEventCheckOut"
            >
              <i class="bi bi-door-closed me-1"></i> Check-Out Delegate
            </button>
          </div>

          <!-- Option D: Checked in, but no active service in current time window right now -->
          <div v-else class="p-3 bg-light rounded-3 border text-center">
            <i class="bi bi-clock-history text-amber-500 fs-2 d-block mb-1"></i>
            <h6 class="fw-bold text-slate-900 fs-7 mb-1">No Active Service Right Now</h6>
            <p class="fs-8 text-muted mb-3">Delegate is checked in today. No scannable service is active in this current time window.</p>
            
            <button
              type="button"
              class="btn btn-outline-danger btn-sm w-100 rounded-3 py-1.5 fw-semibold fs-8"
              @click="confirmEventCheckOut"
            >
              <i class="bi bi-door-closed me-1"></i> Check-Out Delegate
            </button>
          </div>
        </div>

        <div class="d-flex justify-content-end mt-3 border-top pt-3">
          <button type="button" class="btn btn-outline-secondary btn-sm rounded-3 px-4 py-2 fw-semibold fs-7" @click="showResultModal = false">
            Close Scanner
          </button>
        </div>
      </div>
    </CommonModal>
  </div>
</template>

<script setup lang="ts">
import { Html5Qrcode } from 'html5-qrcode';
import { isActiveOrScheduledEvent } from '~/utils/eventDate';
import { dbStore } from '~/utils/db';

const { isOnline, pendingCount, executeOrQueue } = useOfflineSync();
const push = usePush();
const token = useCookie<string | null>('token');

const eventsList = ref<any[]>([]);
const servicesList = ref<any[]>([]);
const selectedEventId = ref<number | string>('');

const cachedRegistrationsMap = ref<Map<string, any>>(new Map());
const isPreloadingRegistrations = ref(false);
const fastScanMode = ref(false);
let lastPreloadedEventId: number | string | null = null;

function formatAttendeeDisplayName(logOrAttendee: any): string {
  if (!logOrAttendee) return 'Delegate';
  const reg = logOrAttendee.registration || logOrAttendee;
  
  const rawFn = String(reg.first_name || '').trim();
  const rawLn = String(reg.last_name || '').trim();

  const fn = (rawFn.toLowerCase() === 'null' || rawFn.toLowerCase() === 'undefined') ? '' : rawFn;
  const ln = (rawLn.toLowerCase() === 'null' || rawLn.toLowerCase() === 'undefined') ? '' : rawLn;

  const fullName = `${fn} ${ln}`.trim();
  if (fullName) return fullName;

  // Fallback 1: Phone number
  const phone = String(reg.phone || logOrAttendee.phone || '').trim();
  if (phone && phone.toLowerCase() !== 'null' && phone.toLowerCase() !== 'undefined') {
    return `Phone: ${phone}`;
  }

  // Fallback 2: Attendee name field
  const attendeeName = String(logOrAttendee.attendee_name || '').trim();
  if (attendeeName && attendeeName.toLowerCase() !== 'null' && attendeeName.toLowerCase() !== 'undefined') {
    return attendeeName;
  }

  // Fallback 3: QR Code badge
  const qr = String(logOrAttendee.qr_code || reg.qr_code || '').trim();
  if (qr && qr.toLowerCase() !== 'null' && qr.toLowerCase() !== 'undefined') {
    return `Delegate (${qr})`;
  }

  return 'Delegate';
}

function getAttendeePhoneNumber(attendee: any): string {
  if (!attendee) return '';
  const reg = attendee.registration || attendee;
  const phone = String(reg.phone || attendee.phone || '').trim();
  if (!phone || phone.toLowerCase() === 'no phone' || phone.toLowerCase() === 'null' || phone === '—' || phone === '-') {
    return '';
  }
  return phone;
}

// Master services catalog map: id -> master service object
const masterServicesMap = ref<Map<number, any>>(new Map());

function getLogServiceName(log: any): string {
  if (!log) return '—';
  if (log.service?.name) return log.service.name;
  if (log.service_name) return log.service_name;
  const srvId = log.service_id ? Number(log.service_id) : (log.service?.id ? Number(log.service.id) : null);
  if (srvId) {
    const found = servicesList.value.find((s: any) => Number(s.id) === srvId);
    if (found?.name && !found.name.startsWith('Service #')) return found.name;
    const masterObj = masterServicesMap.value.get(srvId);
    if (masterObj?.name) return masterObj.name;
    if (found?.name) return found.name;
    return `Service #${srvId}`;
  }
  return '—';
}

// Only active & scheduled events for scanning selection
const activeEventsList = computed(() => {
  return eventsList.value.filter(isActiveOrScheduledEvent);
});

// Modal visibility states
const showCameraModal = ref(false);
const showManualModal = ref(false);
const showResultModal = ref(false);

const scannedAttendee = ref<any>(null);
const scannedQrCode = ref<string>('');
const claimingServiceId = ref<number | string | null>(null);

// Filters & Pagination
const searchQuery = ref('');
const selectedScanTypeFilter = ref('');
const selectedServiceFilter = ref<number | string>('');
const currentPage = ref(1);
const perPage = ref(10);

function handleScanTypeChange() {
  if (selectedScanTypeFilter.value !== 'service') {
    selectedServiceFilter.value = '';
  }
  currentPage.value = 1;
}

function setQuickFilter(type: '' | 'check_in' | 'check_out' | 'service', serviceId?: number | string) {
  if (type === 'service') {
    selectedScanTypeFilter.value = 'service';
    selectedServiceFilter.value = serviceId || '';
  } else {
    selectedScanTypeFilter.value = type;
    selectedServiceFilter.value = '';
  }
  currentPage.value = 1;
}

const selectedEventName = computed(() => {
  const ev = eventsList.value.find(e => e.id === Number(selectedEventId.value) || e.id === selectedEventId.value);
  return ev?.name || `Event #${selectedEventId.value}`;
});

const isSelectedEventCompleted = computed(() => {
  const ev = eventsList.value.find(e => e.id === Number(selectedEventId.value) || e.id === selectedEventId.value);
  return ev ? !isActiveOrScheduledEvent(ev) : false;
});

// Daily helper function (EAT timezone YYYY-MM-DD)
function getTodayDateStr(): string {
  const d = new Date();
  return d.toLocaleDateString('en-CA', { timeZone: 'Africa/Nairobi' }); // YYYY-MM-DD format
}

function extractNumericRegId(val: any): number | null {
  if (typeof val === 'number' && !isNaN(val)) return val;
  if (!val) return null;
  const str = String(val).trim();
  if (/^\d+$/.test(str)) return parseInt(str, 10);
  const match = str.match(/REG-\d+-(\d+)/i);
  if (match && match[1]) return parseInt(match[1], 10);
  const num = parseInt(str.replace(/\D/g, ''), 10);
  return isNaN(num) ? null : num;
}

function isLogForScannedAttendee(l: any): boolean {
  if (!l) return false;
  
  const attendee = scannedAttendee.value;
  const scanned = scannedQrCode.value ? String(scannedQrCode.value).trim() : '';

  // 1. Direct registration numeric ID match
  const attendeeId = attendee?.id && !isNaN(Number(attendee.id)) ? Number(attendee.id) : null;
  const logRegId = (l.registration_id || l.registration?.id) ? Number(l.registration_id || l.registration?.id) : null;
  if (attendeeId !== null && logRegId !== null && attendeeId === logRegId) {
    return true;
  }

  // 2. Direct string match across any known identifiers (case-insensitive)
  const targetCodes = new Set([
    scanned,
    scanned.toLowerCase(),
    attendee?.qr_code ? String(attendee.qr_code).trim() : null,
    attendee?.qr_code ? String(attendee.qr_code).trim().toLowerCase() : null,
    attendee?.registration_number ? String(attendee.registration_number).trim() : null,
    attendee?.registration_number ? String(attendee.registration_number).trim().toLowerCase() : null,
    attendee?.code ? String(attendee.code).trim() : null,
    attendee?.code ? String(attendee.code).trim().toLowerCase() : null,
    attendee?.ticket_code ? String(attendee.ticket_code).trim() : null,
    attendee?.ticket_code ? String(attendee.ticket_code).trim().toLowerCase() : null,
  ].filter(Boolean));

  const logCodes = [
    l.qr_code ? String(l.qr_code).trim() : null,
    l.qr_code ? String(l.qr_code).trim().toLowerCase() : null,
    l.registration?.qr_code ? String(l.registration.qr_code).trim() : null,
    l.registration?.qr_code ? String(l.registration.qr_code).trim().toLowerCase() : null,
    l.registration?.registration_number ? String(l.registration.registration_number).trim() : null,
    l.registration?.registration_number ? String(l.registration.registration_number).trim().toLowerCase() : null,
    l.registration?.code ? String(l.registration.code).trim() : null,
    l.registration?.code ? String(l.registration.code).trim().toLowerCase() : null,
    l.registration?.ticket_code ? String(l.registration.ticket_code).trim() : null,
    l.registration?.ticket_code ? String(l.registration.ticket_code).trim().toLowerCase() : null,
  ].filter(Boolean);

  for (const c of logCodes) {
    if (c && targetCodes.has(c)) {
      return true;
    }
  }

  // 3. Fallback numeric match for REG-X-Y formatted codes
  const targetNum = extractNumericRegId(scanned) || extractNumericRegId(attendee?.id);
  const logNum = extractNumericRegId(logRegId) || extractNumericRegId(l.qr_code);
  if (targetNum !== null && logNum !== null && targetNum === logNum) {
    return true;
  }

  return false;
}

function isLogFromToday(l: any): boolean {
  if (!l || !l.created_at) return true;
  const todayStr = getTodayDateStr();
  const raw = String(l.created_at).trim();

  // 1. Direct string match
  if (raw.startsWith(todayStr) || raw.includes(todayStr)) {
    return true;
  }

  // 2. Parse with 'Z' as UTC -> Nairobi EAT (identical to formatDate in table)
  try {
    let parseable = raw.replace(' ', 'T');
    if (!/Z|[+-]\d{2}:?\d{2}$/i.test(parseable)) {
      parseable += 'Z';
    }
    const d = new Date(parseable);
    if (!isNaN(d.getTime())) {
      const eatDateStr = d.toLocaleDateString('en-CA', { timeZone: 'Africa/Nairobi' });
      if (eatDateStr === todayStr) {
        return true;
      }
    }
  } catch {}

  // 3. Fallback: Parse without forced 'Z' (in case stored as local Nairobi time)
  try {
    const d2 = new Date(raw.replace(' ', 'T'));
    if (!isNaN(d2.getTime())) {
      const localDateStr = d2.toLocaleDateString('en-CA');
      const eatDateStr = d2.toLocaleDateString('en-CA', { timeZone: 'Africa/Nairobi' });
      if (localDateStr === todayStr || eatDateStr === todayStr) {
        return true;
      }
    }
  } catch {}

  return false;
}

// Get all logs for current scanned attendee sorted newest first
const attendeeTodayLogs = computed(() => {
  if (!scannedQrCode.value && !scannedAttendee.value?.id) return [];

  const filtered = logs.value.filter((l: any) => {
    if (!isLogForScannedAttendee(l)) return false;
    return isLogFromToday(l);
  });

  return filtered.sort((a: any, b: any) => {
    const parseTime = (val: any) => {
      if (!val) return 0;
      let p = String(val).trim().replace(' ', 'T');
      if (!/Z|[+-]\d{2}:?\d{2}$/i.test(p)) p += 'Z';
      return new Date(p).getTime();
    };
    const timeA = a.created_at ? parseTime(a.created_at) : (Number(a.id) || 999999999);
    const timeB = b.created_at ? parseTime(b.created_at) : (Number(b.id) || 999999999);
    return timeB - timeA;
  });
});

// Attendee is checked in TODAY if they have a check_in scan today AND their latest scan today is NOT a check_out
const isAttendeeCheckedIn = computed(() => {
  const logsToday = attendeeTodayLogs.value;
  if (logsToday.length === 0) return false;

  const latestScan = logsToday[0];
  if (latestScan?.scan_type === 'check_out') {
    return false; // Checked out today → requires new check-in!
  }

  return logsToday.some((l: any) => l.scan_type === 'check_in' || l.scan_type === 'service' || !l.service_id);
});

// Check if attendee is currently checked out today
const isAttendeeCheckedOutToday = computed(() => {
  const logsToday = attendeeTodayLogs.value;
  return logsToday.length > 0 && logsToday[0]?.scan_type === 'check_out';
});

// Number of event entry check-ins recorded for this attendee today (excluding service claims)
const checkInCountToday = computed(() => {
  return attendeeTodayLogs.value.filter((l: any) => l.scan_type === 'check_in' && !l.service_id && !l.service).length;
});

// Check if attendee has checked in multiple times or checked out and is re-entering today
const isReentryToday = computed(() => {
  const logsToday = attendeeTodayLogs.value;
  return logsToday.length > 0 && logsToday[0]?.scan_type === 'check_out';
});

// Filter services:
function parseTimeToMinutes(timeStr?: string | null): number | null {
  if (!timeStr) return null;
  const match = String(timeStr).trim().match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return null;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

function getEATCurrentMinutes(): number {
  try {
    const d = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Nairobi',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });
    const parts = formatter.formatToParts(d);
    const hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
    const min = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
    return (hour % 24) * 60 + min;
  } catch {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  }
}

const availableScannableServices = computed(() => {
  if (!scannedQrCode.value && !scannedAttendee.value?.id) return [];
  const currentMinutes = getEATCurrentMinutes();

  return servicesList.value.filter((srv: any) => {
    const requiresScan = srv.requires_scan === true || srv.requires_scan === 1 || srv.requires_scan === '1' || srv.requires_scan === undefined;
    if (!requiresScan) return false;

    const regId = scannedAttendee.value?.id;
    const realQr = scannedAttendee.value?.qr_code || scannedQrCode.value;
    const todayStr = getTodayDateStr();
    const alreadyClaimed = logs.value.some((l: any) => {
      const logQr = l.qr_code || l.registration?.qr_code || '';
      const logRegId = l.registration_id || l.registration?.id;
      const matchesAttendee = (realQr && logQr === realQr) || (scannedQrCode.value && logQr === scannedQrCode.value) || (regId && Number(logRegId) === Number(regId));
      const matchesService = Number(l.service_id) === Number(srv.id) || Number(l.service?.id) === Number(srv.id);

      let isToday = true;
      if (l.created_at) {
        let p = String(l.created_at).trim().replace(' ', 'T');
        if (!/Z|[+-]\d{2}:?\d{2}$/i.test(p)) p += 'Z';
        const logDateStr = new Date(p).toLocaleDateString('en-CA', { timeZone: 'Africa/Nairobi' });
        isToday = logDateStr === todayStr;
      }
      return matchesAttendee && matchesService && isToday;
    });
    if (alreadyClaimed) return false;

    // Strict time comparison: service is ONLY active within its designated window
    const startMins = parseTimeToMinutes(srv.start_time);
    const endMins = parseTimeToMinutes(srv.end_time);

    if (startMins !== null && endMins !== null) {
      if (currentMinutes < startMins || currentMinutes > endMins) {
        return false;
      }
    } else if (startMins !== null) {
      if (currentMinutes < startMins) {
        return false;
      }
    } else if (endMins !== null) {
      if (currentMinutes > endMins) {
        return false;
      }
    } else {
      return false;
    }

    return true;
  });
});

const activeCurrentService = computed(() => {
  return availableScannableServices.value[0] || null;
});

const areAllServicesClaimedToday = computed(() => {
  if (servicesList.value.length === 0) return false;
  const todayStr = getTodayDateStr();

  const scannableServices = servicesList.value.filter((srv: any) =>
    srv.requires_scan === true || srv.requires_scan === 1 || srv.requires_scan === '1' || srv.requires_scan === undefined
  );
  if (scannableServices.length === 0) return false;

  return scannableServices.every((srv: any) => {
    return logs.value.some((l: any) => {
      const matchesAttendee = isLogForScannedAttendee(l);
      const matchesService = l.service_id === Number(srv.id) || l.service?.id === Number(srv.id);
      let isToday = true;
      if (l.created_at) {
        let p = String(l.created_at).trim().replace(' ', 'T');
        if (!/Z|[+-]\d{2}:?\d{2}$/i.test(p)) p += 'Z';
        const logDateStr = new Date(p).toLocaleDateString('en-CA', { timeZone: 'Africa/Nairobi' });
        isToday = logDateStr === todayStr;
      }
      return matchesAttendee && matchesService && isToday;
    });
  });
});

async function claimService(serviceId: number | string) {
  if (!selectedEventId.value) return;
  const realQrCode = scannedAttendee.value?.qr_code || scannedQrCode.value;
  if (!realQrCode) return;
  claimingServiceId.value = serviceId;
  try {
    await processScan(realQrCode, 'service', serviceId);
    showResultModal.value = false;
    scannedAttendee.value = null;
    scannedQrCode.value = '';
  } finally {
    claimingServiceId.value = null;
  }
}

async function confirmEventCheckIn() {
  if (!selectedEventId.value) return;
  const realQrCode = scannedAttendee.value?.qr_code || scannedQrCode.value;
  if (!realQrCode) return;
  try {
    await processScan(realQrCode, 'check_in');
    showResultModal.value = true;
  } catch {
    // Handled in processScan
  }
}

async function confirmEventCheckOut() {
  if (!selectedEventId.value) return;
  const realQrCode = scannedAttendee.value?.qr_code || scannedQrCode.value;
  if (!realQrCode) return;
  try {
    await processScan(realQrCode, 'check_out');
    showResultModal.value = false;
    scannedAttendee.value = null;
    scannedQrCode.value = '';
    push.info({
      title: 'Ready for Next Scan',
      message: 'Delegate checked out. Ready to scan next QR code.',
    });
  } catch {
    // Handled in processScan
  }
}

// Scanner state
const scanningActive = ref(false);
let html5QrcodeScanner: Html5Qrcode | null = null;
const scanFeedback = ref<{ type: 'success' | 'error'; message: string } | null>(null);

// Scanner throttling
const lastScannedCode = ref<string>('');
const isProcessingScan = ref(false);

// Manual entry state
const manualQrCode = ref('');
const scanType = ref<'check_in' | 'service'>('check_in');
const selectedServiceId = ref<number | string>('');
const submitting = ref(false);

// Logs
const logs = ref<any[]>([]);
const loadingLogs = ref(false);

// Ultra-fast single-pass O(N) statistics breakdown for all services and scan types
const scanStatistics = computed(() => {
  let totalScans = 0;
  let totalCheckIns = 0;
  let totalCheckOuts = 0;
  let totalServiceScans = 0;

  // Map to store service details: id -> { id, name, count }
  const serviceMap = new Map<string | number, { id: string | number; name: string; count: number }>();

  // 1. Pre-populate with configured event services if any
  for (const s of servicesList.value) {
    if (s && (s.id !== undefined && s.id !== null)) {
      const sId = Number(s.id);
      serviceMap.set(sId, {
        id: s.id,
        name: s.name || `Service #${s.id}`,
        count: 0,
      });
    }
  }

  // 2. Count from actual logs and dynamically discover any service in logs
  for (const l of logs.value) {
    totalScans++;
    const sId = l.service_id ? Number(l.service_id) : (l.service?.id ? Number(l.service.id) : null);
    const masterObj = sId ? masterServicesMap.value.get(sId) : null;
    const sName = (l.service?.name && !l.service.name.startsWith('Service #'))
      ? l.service.name
      : (l.service_name || masterObj?.name || (sId ? `Service #${sId}` : null));

    if (sId) {
      totalServiceScans++;
      if (!serviceMap.has(sId)) {
        serviceMap.set(sId, {
          id: sId,
          name: sName || `Service #${sId}`,
          count: 0,
        });
      } else {
        const existing = serviceMap.get(sId)!;
        if (existing.name.startsWith('Service #') && sName && !sName.startsWith('Service #')) {
          existing.name = sName;
        }
      }
      const srvItem = serviceMap.get(sId)!;
      srvItem.count += 1;
    } else if (l.scan_type === 'service') {
      totalServiceScans++;
      const genericKey = sName || 'Service Access';
      if (!serviceMap.has(genericKey)) {
        serviceMap.set(genericKey, {
          id: genericKey,
          name: genericKey,
          count: 0,
        });
      }
      const srvItem = serviceMap.get(genericKey)!;
      srvItem.count += 1;
    } else if (l.scan_type === 'check_out') {
      totalCheckOuts++;
    } else {
      totalCheckIns++;
    }
  }

  const services = Array.from(serviceMap.values());

  return {
    totalScans,
    totalCheckIns,
    totalCheckOuts,
    totalServiceScans,
    services,
  };
});

// Table Filtered & Paginated List
const filteredLogs = computed(() => {
  let list = logs.value;

  if (selectedServiceFilter.value) {
    const targetServiceId = Number(selectedServiceFilter.value);
    list = list.filter((l: any) => {
      const sId = l.service_id ? Number(l.service_id) : (l.service?.id ? Number(l.service.id) : null);
      return sId === targetServiceId;
    });
  } else if (selectedScanTypeFilter.value) {
    if (selectedScanTypeFilter.value === 'service') {
      list = list.filter((l: any) => l.service_id || l.service || l.scan_type === 'service');
    } else {
      list = list.filter((l: any) => !l.service_id && !l.service && l.scan_type === selectedScanTypeFilter.value);
    }
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    list = list.filter((l: any) => {
      const displayName = formatAttendeeDisplayName(l).toLowerCase();
      const phone = String(l.registration?.phone || l.phone || '').toLowerCase();
      const qr = String(l.qr_code || '').toLowerCase();
      return displayName.includes(q) || phone.includes(q) || qr.includes(q);
    });
  }

  return list;
});

const totalPages = computed(() => Math.ceil(filteredLogs.value.length / perPage.value) || 1);
const startIndex = computed(() => (currentPage.value - 1) * perPage.value + 1);
const endIndex = computed(() => Math.min(currentPage.value * perPage.value, filteredLogs.value.length));

const paginatedLogs = computed(() => {
  const start = (currentPage.value - 1) * perPage.value;
  return filteredLogs.value.slice(start, start + perPage.value);
});

function indexRegistrations(regList: any[]) {
  const map = new Map<string, any>();
  for (const r of regList) {
    if (!r) continue;
    const addKey = (k?: string | number | null) => {
      if (!k) return;
      const str = String(k).trim();
      if (!str) return;
      map.set(str, r);
      map.set(str.toLowerCase(), r);
    };

    addKey(r.qr_code);
    addKey(r.registration_number);
    addKey(r.code);
    addKey(r.ticket_code);
    addKey(r.badge_code);
    addKey(r.reference);
    addKey(r.id);

    if (r.id) {
      if (r.event_id) {
        addKey(`REG-${r.event_id}-${r.id}`);
      }
      if (selectedEventId.value) {
        addKey(`REG-${selectedEventId.value}-${r.id}`);
      }
    }
  }
  cachedRegistrationsMap.value = map;
}

async function preloadRegistrations(eventId: number | string, forceRefresh = false) {
  if (!eventId) return;

  // 1. Short-circuit if already preloaded in memory for this event
  if (!forceRefresh && Number(lastPreloadedEventId) === Number(eventId) && cachedRegistrationsMap.value.size > 0) {
    return;
  }

  isPreloadingRegistrations.value = true;
  lastPreloadedEventId = Number(eventId);

  try {
    const cached = await dbStore.getCachedRegistrations(eventId);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      indexRegistrations(cached);
      // If valid cached registrations exist in IndexedDB, bypass network fetch during scanning
      if (!forceRefresh) return;
    }

    if (import.meta.client && navigator.onLine) {
      try {
        const res = await $fetch<any>(apiPath(`/api/registrations?event_id=${eventId}`), {
          headers: { ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}), Accept: 'application/json' },
        });
        const freshList = Array.isArray(res?.data?.registrations)
          ? res.data.registrations
          : (Array.isArray(res?.data) ? res.data : []);

        if (freshList.length > 0) {
          indexRegistrations(freshList);
          await dbStore.cacheRegistrations(eventId, freshList);
        }
      } catch (e) {
        console.warn('Background registration preload notice (using local cache):', e);
      }
    }
  } catch (err) {
    console.error('Error preloading registrations:', err);
  } finally {
    isPreloadingRegistrations.value = false;
  }
}

watch(selectedEventId, async (newEvId) => {
  if (newEvId) {
    currentPage.value = 1;
    selectedServiceFilter.value = '';
    await preloadRegistrations(newEvId);
    await Promise.all([
      fetchLogs(),
      fetchServices(),
    ]);
  }
});

const route = useRoute();

async function openVerificationForQr(qrCode: string) {
  let cleanCode = qrCode.trim();
  if (cleanCode.includes('?code=')) {
    const urlParts = cleanCode.split('?code=');
    if (urlParts[1]) {
      cleanCode = decodeURIComponent(urlParts[1].split('&')[0]);
    }
  }

  scannedQrCode.value = cleanCode;

  // 1. Instant local lookup (< 5ms)
  const attendeeData = await findAttendeeByQrCode(cleanCode);
  if (!attendeeData) {
    push.error({
      title: 'Delegate Not Found',
      message: `No registration record found for badge code: ${cleanCode}`,
    });
    scanFeedback.value = {
      type: 'error',
      message: `Unrecognized Badge: No registered delegate found matching "${cleanCode}".`,
    };
    return;
  }

  if (attendeeData?.event_id) {
    selectedEventId.value = Number(attendeeData.event_id);
  }

  scannedAttendee.value = attendeeData;

  // 2. Fast Continuous Scan Mode auto-processing
  if (fastScanMode.value) {
    if (!isAttendeeCheckedIn.value && !isSelectedEventCompleted.value) {
      await confirmEventCheckIn();
    } else if (activeCurrentService.value) {
      await claimService(activeCurrentService.value.id);
    } else {
      push.info({
        title: 'Attendee Verified',
        message: `${scannedAttendee.value.first_name} ${scannedAttendee.value.last_name || ''} - Status verified.`,
      });
    }
    return;
  }

  showCameraModal.value = false;
  showResultModal.value = true;
}

async function handleScannedUrlCode() {
  const code = route.query.code;
  if (!code) return;
  return navigateTo({ path: '/scan', query: { code: String(code) } }, { replace: true });
}

watch(
  () => route.query.code,
  async (newCode) => {
    if (newCode) {
      await handleScannedUrlCode();
    }
  }
);

onMounted(async () => {
  if (route.query.code) {
    return navigateTo({ path: '/scan', query: { code: String(route.query.code) } }, { replace: true });
  }
  
  // Warm cached logs immediately from IndexedDB so the table renders without waiting
  try {
    const cachedLogs = await dbStore.getAllCachedScanLogs();
    if (cachedLogs && cachedLogs.length > 0 && logs.value.length === 0) {
      logs.value = cachedLogs;
    }
  } catch {}

  await fetchEvents();
  if (selectedEventId.value) {
    await preloadRegistrations(selectedEventId.value);
    await Promise.all([
      fetchLogs(),
      fetchServices(),
    ]);
  }
});

onBeforeUnmount(() => {
  stopScanner();
});

async function fetchEvents() {
  try {
    const res = await cachedFetch<any>('/api/events');
    const rawList = Array.isArray(res?.data?.events)
      ? res.data.events
      : (Array.isArray(res?.data) ? res.data : (Array.isArray(res?.events) ? res.events : (Array.isArray(res) ? res : [])));
    eventsList.value = rawList;
    if (rawList.length > 0 && !selectedEventId.value) {
      const active = rawList.find(isActiveOrScheduledEvent);
      selectedEventId.value = active ? Number(active.id) : Number(rawList[0].id);
    }
  } catch (err) {
    console.error('Failed to fetch events:', err);
  }
}

async function fetchServices() {
  if (!selectedEventId.value) {
    servicesList.value = [];
    return;
  }
  try {
    // 1. Fetch master services catalog and event services in parallel
    const [masterRes, eventSrvRes] = await Promise.all([
      cachedFetch<any>('/api/services').catch(() => null),
      cachedFetch<any>(`/api/event-services?event_id=${selectedEventId.value}`).catch(() => null),
    ]);

    // Build master catalog map: id -> master service
    const masterList = Array.isArray(masterRes?.data?.services)
      ? masterRes.data.services
      : (Array.isArray(masterRes?.data) ? masterRes.data : (Array.isArray(masterRes?.services) ? masterRes.services : []));

    for (const ms of masterList) {
      if (ms?.id) {
        masterServicesMap.value.set(Number(ms.id), ms);
      }
    }

    let rawList: any[] = [];
    if (eventSrvRes) {
      rawList = Array.isArray(eventSrvRes?.data?.event_services)
        ? eventSrvRes.data.event_services
        : (Array.isArray(eventSrvRes?.data) ? eventSrvRes.data : (Array.isArray(eventSrvRes?.event_services) ? eventSrvRes.event_services : (Array.isArray(eventSrvRes) ? eventSrvRes : [])));
    }

    if (rawList.length === 0) {
      // Fallback to IndexedDB cache
      const cached = await dbStore.getCachedEventServices(Number(selectedEventId.value));
      if (Array.isArray(cached) && cached.length > 0) {
        rawList = cached;
      }
    }

    servicesList.value = rawList
      .map((es: any) => {
        const srvId = es.service_id ? Number(es.service_id) : (es.service?.id ? Number(es.service.id) : Number(es.id));
        const masterObj = masterServicesMap.value.get(srvId);
        const srvName = (es.name && !es.name.startsWith('Service #'))
          ? es.name
          : (es.service?.name || masterObj?.name || es.name || `Service #${srvId}`);

        const srvStart = es.start_time || es.service?.start_time || masterObj?.start_time || null;
        const srvEnd = es.end_time || es.service?.end_time || masterObj?.end_time || null;
        const srvScan = es.requires_scan !== undefined ? es.requires_scan : (es.service?.requires_scan ?? true);
        const srvDesc = es.description || es.service?.description || masterObj?.description || '';

        return {
          id: srvId,
          name: srvName,
          start_time: srvStart,
          end_time: srvEnd,
          requires_scan: srvScan,
          description: srvDesc,
        };
      })
      .filter((s: any) => s && s.id);
  } catch (err) {
    console.warn('Event services fetch notice:', err);
    servicesList.value = [];
  }
}

async function fetchLogs() {
  if (!selectedEventId.value) return;
  loadingLogs.value = true;
  try {
    let res: any;
    try {
      res = await cachedFetch<any>(`/api/scannings?event_id=${selectedEventId.value}`);
    } catch {
      res = await cachedFetch<any>(`/api/events/${selectedEventId.value}/scannings`);
    }
    const rawList = Array.isArray(res?.data?.scannings)
      ? res.data.scannings
      : (Array.isArray(res?.data) ? res.data : (Array.isArray(res?.scannings) ? res.scannings : (Array.isArray(res) ? res : [])));
    logs.value = rawList;
  } catch (err) {
    console.error('Failed to fetch scannings logs:', err);
    logs.value = [];
  } finally {
    loadingLogs.value = false;
  }
}

async function fetchLogsForce() {
  if (!selectedEventId.value) return;
  try {
    const res = await $fetch<any>(apiPath(`/api/scannings?event_id=${selectedEventId.value}`), {
      headers: { Authorization: `Bearer ${token.value}`, Accept: 'application/json' },
    });
    logs.value = Array.isArray(res?.data?.scannings) ? res.data.scannings : (Array.isArray(res?.data) ? res.data : []);
  } catch {
    // Fallback
  }
}

function openCameraModal() {
  showCameraModal.value = true;
  startScanner();
}

async function openVerifyForLog(log: any) {
  if (log.qr_code) {
    await openVerificationForQr(log.qr_code);
  }
}

async function findAttendeeByQrCode(qrCode: string): Promise<any> {
  const cleanCode = qrCode.trim();
  const prefixMatch = cleanCode.match(/^REG-(\d+)-/i);
  if (prefixMatch && prefixMatch[1]) {
    const matchedEventId = Number(prefixMatch[1]);
    if (Number(selectedEventId.value) !== matchedEventId) {
      selectedEventId.value = matchedEventId;
    }
  }

  // 1. Sub-millisecond lookup in preloaded memory map
  let found = cachedRegistrationsMap.value.get(cleanCode);
  if (!found) {
    const rawId = cleanCode.split('-').pop();
    if (rawId) {
      found = cachedRegistrationsMap.value.get(rawId);
    }
  }

  if (found) {
    if (found.event_id && Number(selectedEventId.value) !== Number(found.event_id)) {
      selectedEventId.value = Number(found.event_id);
    }
    return found;
  }

  // 2. Direct IndexedDB cache lookup if map miss
  if (selectedEventId.value) {
    const cached = await dbStore.getCachedRegistrations(selectedEventId.value);
    if (cached && Array.isArray(cached)) {
      found = cached.find((r: any) => 
        r.qr_code === cleanCode || 
        r.registration_number === cleanCode || 
        r.code === cleanCode || 
        r.ticket_code === cleanCode || 
        r.badge_code === cleanCode || 
        `REG-${r.event_id}-${r.id}` === cleanCode || 
        String(r.id) === cleanCode.split('-').pop()
      );
      if (found) {
        if (found.event_id) selectedEventId.value = Number(found.event_id);
        return found;
      }
    }
  }

  // 3. Fallback: Query server if online and unknown QR code
  if (import.meta.client && navigator.onLine) {
    try {
      const regRes = await $fetch<any>(apiPath(`/api/registrations?event_id=${selectedEventId.value}`), {
        headers: { ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}), Accept: 'application/json' },
      });
      const regList = Array.isArray(regRes?.data?.registrations) ? regRes.data.registrations : (Array.isArray(regRes?.data) ? regRes.data : []);
      found = regList.find((r: any) => 
        r.qr_code === cleanCode || 
        r.registration_number === cleanCode || 
        r.code === cleanCode || 
        r.ticket_code === cleanCode || 
        r.badge_code === cleanCode || 
        `REG-${r.event_id}-${r.id}` === cleanCode || 
        String(r.id) === cleanCode.split('-').pop()
      );
      if (found) {
        if (found.event_id) selectedEventId.value = Number(found.event_id);
        return found;
      }
    } catch {
      // Offline fallback
    }
  }

  return null;
}

async function startScanner() {
  if (!selectedEventId.value) return;
  scanFeedback.value = null;
  lastScannedCode.value = '';
  isProcessingScan.value = false;

  if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    scanFeedback.value = {
      type: 'error',
      message: 'Mobile browsers require HTTPS for camera access. Please open the site over HTTPS or localhost.',
    };
    return;
  }

  try {
    if (!html5QrcodeScanner) {
      html5QrcodeScanner = new Html5Qrcode('qr-reader');
    }
    scanningActive.value = true;

    let cameraConfig: any = { facingMode: 'environment' };
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        const backCamera = devices.find(d => /back|rear|environment/i.test(d.label));
        cameraConfig = backCamera ? backCamera.id : devices[devices.length - 1].id;
      }
    } catch {
      // Fallback
    }

    const config = {
      fps: 10,
      qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
        const minDim = Math.min(viewfinderWidth, viewfinderHeight);
        const boxSize = Math.max(160, Math.floor(minDim * 0.75));
        return { width: boxSize, height: boxSize };
      },
    };

    await html5QrcodeScanner.start(
      cameraConfig,
      config,
      async (decodedText) => {
        if (isProcessingScan.value || decodedText === lastScannedCode.value) return;
        lastScannedCode.value = decodedText;
        isProcessingScan.value = true;

        try {
          await openVerificationForQr(decodedText);
        } finally {
          setTimeout(() => {
            isProcessingScan.value = false;
            lastScannedCode.value = '';
          }, 3000);
        }
      },
      () => {}
    );
  } catch (err: any) {
    console.error('Failed to start camera scanner:', err);
    scanningActive.value = false;
    const isHttp = typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost';
    scanFeedback.value = {
      type: 'error',
      message: isHttp
        ? 'Camera access is blocked by mobile browsers over unencrypted HTTP. Access via HTTPS or localhost.'
        : (err?.message || 'Camera permission denied or camera not available.'),
    };
  }
}

async function stopScanner() {
  if (html5QrcodeScanner && scanningActive.value) {
    try {
      await html5QrcodeScanner.stop();
      html5QrcodeScanner.clear();
    } catch (err) {
      console.error('Error stopping camera:', err);
    } finally {
      html5QrcodeScanner = null;
      scanningActive.value = false;
    }
  }
}

async function processScan(rawScannedText: string, type: 'check_in' | 'service' | 'check_out', serviceId?: number | string) {
  let qrCode = rawScannedText.trim();
  if (qrCode.includes('?code=')) {
    const urlParts = qrCode.split('?code=');
    if (urlParts[1]) {
      qrCode = decodeURIComponent(urlParts[1].split('&')[0]);
    }
  }

  try {
    const parsed = JSON.parse(qrCode);
    if (parsed && typeof parsed === 'object') {
      qrCode = parsed.qr_code || parsed.code || (parsed.id ? `REG-${parsed.event_id || selectedEventId.value}-${parsed.id}` : rawScannedText);
    }
  } catch {
    const len = qrCode.length;
    if (len > 4 && len % 2 === 0) {
      const half1 = qrCode.substring(0, len / 2);
      const half2 = qrCode.substring(len / 2);
      if (half1 === half2) {
        qrCode = half1;
      }
    }
  }

  const matchedReg = await findAttendeeByQrCode(qrCode);
  if (matchedReg?.event_id) {
    selectedEventId.value = Number(matchedReg.event_id);
  } else if (scannedAttendee.value?.event_id) {
    selectedEventId.value = Number(scannedAttendee.value.event_id);
  }
  if (matchedReg?.qr_code) {
    qrCode = matchedReg.qr_code;
  }

  if (!selectedEventId.value) return;

  const validBackendScanType = type === 'check_out' ? 'check_out' : 'check_in';
  const bodyPayload: Record<string, any> = {
    qr_code: qrCode,
    scan_type: validBackendScanType,
    event_id: Number(selectedEventId.value),
  };
  if (serviceId) {
    bodyPayload.service_id = parseInt(String(serviceId), 10);
  }

  const currentEventObj = eventsList.value.find(e => e.id === Number(selectedEventId.value) || e.id === selectedEventId.value);
  const eventName = currentEventObj?.name || `Event #${selectedEventId.value}`;

  const attendeeData = matchedReg || scannedAttendee.value || {
    first_name: 'Registered',
    last_name: 'Delegate',
    phone: '',
    qr_code: qrCode,
  };

  scannedAttendee.value = attendeeData;
  scannedQrCode.value = qrCode;

  // 1. INSTANT LOCAL UPDATE of logs state for immediate UI feedback (< 1ms)
  const scanLabel = type === 'check_out' ? 'Check-out' : (type === 'service' ? 'Service access' : 'Check-in');
  const localLogEntry = {
    id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    qr_code: qrCode,
    scan_type: type,
    service_id: serviceId ? Number(serviceId) : null,
    event_id: Number(selectedEventId.value),
    registration: attendeeData,
    created_at: new Date().toISOString(),
  };

  logs.value = [localLogEntry, ...logs.value];

  scanFeedback.value = {
    type: 'success',
    message: `${scanLabel} recorded for ${attendeeData.first_name} (${qrCode})`,
  };

  push.success({
    title: 'Scan Recorded',
    message: `${scanLabel} recorded for ${attendeeData.first_name} ${attendeeData.last_name || ''}`,
  });

  // 2. DISPATCH NON-BLOCKING ASYNC BACKGROUND SYNC
  const endpoint = `/api/events/${selectedEventId.value}/scannings`;
  executeOrQueue({
    url: endpoint,
    method: 'POST',
    body: bodyPayload,
    label: `${scanLabel} - ${attendeeData.first_name || qrCode}`,
  }).catch((err) => {
    console.warn('Background scan sync notice:', err);
  });
}

async function handleManualCheckin() {
  if (!manualQrCode.value.trim()) return;
  submitting.value = true;
  try {
    await processScan(manualQrCode.value.trim(), scanType.value, selectedServiceId.value);
    manualQrCode.value = '';
    showManualModal.value = false;
    showResultModal.value = true;
  } finally {
    submitting.value = false;
  }
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    let parseable = dateStr.trim().replace(' ', 'T');
    if (!/Z|[+-]\d{2}:?\d{2}$/i.test(parseable)) {
      parseable += 'Z';
    }
    const d = new Date(parseable);
    if (Number.isNaN(d.getTime())) return dateStr;

    return d.toLocaleString('en-KE', {
      timeZone: 'Africa/Nairobi',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateStr;
  }
}

onUnmounted(() => {
  stopScanner();
});
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

.bg-emerald-50 { background-color: #ecfdf5; }
.text-emerald-600 { color: #059669; }
.text-emerald-700 { color: #047857; }
.bg-emerald-500 { background-color: #10b981; }

.bg-blue-50 { background-color: #eff6ff; }
.text-blue-600 { color: #2563eb; }

.bg-purple-50 { background-color: #faf5ff; }
.text-purple-600 { color: #9333ea; }
.text-purple-700 { color: #7e22ce; }
.border-purple-200 { border-color: #e9d5ff !important; }
.border-emerald-200 { border-color: #a7f3d0 !important; }

.bg-rose-50 { background-color: #fff1f2; }
.text-rose-700 { color: #be123c; }
.border-rose-200 { border-color: #fecdd3 !important; }

.btn-emerald {
  background-color: var(--green-500);
  color: #ffffff;
  border: none;
}

.btn-emerald:hover:not(:disabled) {
  background-color: var(--green-600);
  color: #ffffff;
}

.btn-purple {
  background-color: #7e22ce;
  color: #ffffff;
  border: none;
}

.btn-purple:hover:not(:disabled) {
  background-color: #6b21a8;
  color: #ffffff;
}

.scan-stats-bar::-webkit-scrollbar {
  height: 4px;
}

.scan-stats-bar::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
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
</style>
