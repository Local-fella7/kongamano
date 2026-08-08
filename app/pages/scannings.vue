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

      <!-- Target Event Selector -->
      <div class="d-flex align-items-center gap-2">
        <select v-model="selectedEventId" class="form-select rounded-3 py-2 px-3 border-slate-200 fs-7 fw-semibold shadow-2xs" style="min-width: 220px;">
          <option value="" disabled>Select Event to Scan...</option>
          <option v-for="ev in eventsList" :key="ev.id" :value="ev.id">{{ ev.name }}</option>
        </select>
      </div>
    </div>

    <!-- Executive Ticker Stat Cards -->
    <div class="row g-3 mb-4">
      <div class="col-12 col-sm-4">
        <div class="stat-card p-3 rounded-4 bg-white border shadow-2xs d-flex align-items-center gap-3">
          <div class="stat-icon-circle bg-emerald-50 text-emerald-600">
            <i class="bi bi-person-check-fill fs-5"></i>
          </div>
          <div>
            <span class="d-block fs-8 text-muted fw-semibold text-uppercase">Check-ins</span>
            <span class="fs-4 fw-extrabold text-slate-900">{{ checkedInCount }}</span>
          </div>
        </div>
      </div>

      <div class="col-12 col-sm-4">
        <div class="stat-card p-3 rounded-4 bg-white border shadow-2xs d-flex align-items-center gap-3">
          <div class="stat-icon-circle bg-blue-50 text-blue-600">
            <i class="bi bi-people-fill fs-5"></i>
          </div>
          <div>
            <span class="d-block fs-8 text-muted fw-semibold text-uppercase">Total Registrations</span>
            <span class="fs-4 fw-extrabold text-slate-900">{{ totalRegistrationsCount }}</span>
          </div>
        </div>
      </div>

      <div class="col-12 col-sm-4">
        <div class="stat-card p-3 rounded-4 bg-white border shadow-2xs d-flex align-items-center gap-3">
          <div class="stat-icon-circle bg-purple-50 text-purple-600">
            <i class="bi bi-percent fs-5"></i>
          </div>
          <div>
            <span class="d-block fs-8 text-muted fw-semibold text-uppercase">Check-in Rate</span>
            <span class="fs-4 fw-extrabold text-slate-900">{{ attendancePercentage }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Scanner & Manual Entry Grid -->
    <div class="row g-4 mb-4">
      <!-- Camera Reader Card -->
      <div class="col-12 col-lg-7">
        <div class="card border-0 shadow-2xs rounded-4 p-4 h-100 bg-white">
          <div class="d-flex align-items-center justify-content-between mb-3">
            <h5 class="fw-bold text-slate-900 fs-6 mb-0 d-flex align-items-center gap-2">
              <i class="bi bi-camera-fill text-emerald-600"></i> Live QR Scanner
            </h5>
            <div class="d-flex align-items-center gap-2">
              <button
                v-if="!scanningActive"
                class="btn btn-emerald btn-sm rounded-3 fw-semibold fs-8 px-3"
                :disabled="!selectedEventId"
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
          </div>

          <!-- Html5Qrcode Reader Container -->
          <div class="scanner-viewport-wrapper rounded-3 border bg-slate-900 position-relative overflow-hidden mb-3 d-flex align-items-center justify-content-center" style="min-height: 260px;">
            <div id="qr-reader" style="width: 100%;"></div>

            <div v-if="!scanningActive" class="text-center text-slate-400 p-4">
              <i class="bi bi-qr-code-scan fs-1 d-block mb-2 opacity-50"></i>
              <p class="fs-7 mb-0">Select an event and click "Start Camera" to scan badges.</p>
            </div>
          </div>

          <div v-if="scanFeedback" class="alert fs-8 py-2 px-3 mb-0 rounded-3 shadow-2xs" :class="scanFeedback.type === 'success' ? 'alert-success' : 'alert-danger'">
            <i :class="['bi me-1.5', scanFeedback.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill']"></i>
            {{ scanFeedback.message }}
          </div>
        </div>
      </div>

      <!-- Manual Check-in Fallback Card -->
      <div class="col-12 col-lg-5">
        <div class="card border-0 shadow-2xs rounded-4 p-4 h-100 bg-white">
          <h5 class="fw-bold text-slate-900 fs-6 mb-3 d-flex align-items-center gap-2">
            <i class="bi bi-keyboard-fill text-slate-600"></i> Manual QR Check-in
          </h5>
          <form @submit.prevent="handleManualCheckin">
            <div class="mb-3">
              <label class="form-label fs-8 fw-bold text-uppercase text-muted">QR Code / Registration ID</label>
              <input
                v-model="manualQrCode"
                type="text"
                class="form-control form-control-sm rounded-3 py-2"
                placeholder="e.g. REG-1-TEST001"
                :disabled="!selectedEventId || submitting"
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

            <button
              type="submit"
              class="btn btn-emerald w-100 rounded-3 py-2 fw-semibold fs-7 shadow-2xs mt-2"
              :disabled="!selectedEventId || submitting"
            >
              <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
              Process Check-in
            </button>
          </form>
        </div>
      </div>
    </div>

    <!-- Scannings Log Table -->
    <div class="card border-0 shadow-2xs rounded-4 p-4 bg-white">
      <div class="d-flex align-items-center justify-content-between mb-3">
        <h5 class="fw-bold text-slate-900 fs-6 mb-0">Check-in Logs</h5>
        <button class="btn btn-outline-secondary btn-sm rounded-3 fs-8 fw-semibold" @click="fetchLogs" :disabled="loadingLogs">
          <i class="bi bi-arrow-clockwise me-1" :class="{ 'spin': loadingLogs }"></i> Refresh Logs
        </button>
      </div>

      <div class="table-responsive rounded-3 border">
        <table class="data-table mb-0">
          <thead>
            <tr>
              <th>#</th>
              <th>Attendee / Delegate</th>
              <th>QR Code</th>
              <th>Scan Type</th>
              <th>Service</th>
              <th>Scanned At</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(log, idx) in logs" :key="log.id || idx">
              <td class="row-index">{{ idx + 1 }}</td>
              <td>
                <span class="fw-bold text-slate-900 fs-7 d-block">
                  {{ log.registration ? `${log.registration.first_name} ${log.registration.last_name}` : (log.attendee_name || 'Delegate') }}
                </span>
                <span class="fs-8 text-muted">{{ log.registration?.phone || '—' }}</span>
              </td>
              <td>
                <code class="px-2 py-1 bg-slate-100 rounded text-slate-800 fs-8">{{ log.qr_code }}</code>
              </td>
              <td>
                <span class="badge rounded-pill border px-2.5 py-1 fs-8 fw-semibold" :class="log.scan_type === 'check_in' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-purple-50 text-purple-700 border-purple-200'">
                  {{ log.scan_type === 'check_in' ? 'Event Check-in' : 'Service Scan' }}
                </span>
              </td>
              <td>
                <span class="fs-8 text-slate-700 fw-semibold">{{ log.service?.name || log.service_name || '—' }}</span>
              </td>
              <td>
                <span class="fs-8 text-muted">{{ log.created_at ? formatDate(log.created_at) : '—' }}</span>
              </td>
            </tr>
            <tr v-if="!loadingLogs && logs.length === 0">
              <td colspan="6" class="text-center py-4 text-muted fs-8">
                No scan logs found for the selected event.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Interactive Scan Result Modal -->
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
        <div class="d-flex align-items-center gap-3 p-3 bg-light rounded-3 border mb-3">
          <div class="avatar-circle-lg bg-emerald-500 text-white fw-bold fs-5 shadow-2xs d-flex align-items-center justify-content-center" style="width: 48px; height: 48px; border-radius: 50%;">
            {{ scannedAttendee.first_name?.[0] || 'D' }}{{ scannedAttendee.last_name?.[0] || '' }}
          </div>
          <div>
            <h6 class="fw-bold text-slate-900 mb-0 fs-6">{{ scannedAttendee.first_name }} {{ scannedAttendee.last_name }}</h6>
            <div class="d-flex align-items-center gap-2 fs-8 text-muted mt-0.5">
              <span><i class="bi bi-phone me-1"></i>{{ scannedAttendee.phone || 'No phone' }}</span>
              <span>•</span>
              <code>{{ scannedAttendee.qr_code || scannedQrCode }}</code>
            </div>
          </div>
          <span v-if="isAttendeeCheckedIn" class="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3 py-1 fs-8 fw-bold ms-auto">
            <i class="bi bi-check-circle-fill me-1"></i> Checked In
          </span>
          <span v-else class="badge bg-warning-subtle text-warning border border-warning-subtle rounded-pill px-3 py-1 fs-8 fw-bold ms-auto">
            <i class="bi bi-clock-history me-1"></i> Not Checked In
          </span>
        </div>

        <!-- Sequential Action Card (Check-in or Current Active Service) -->
        <div class="mb-3">
          <!-- Option A: Attendee Needs General Check-in First -->
          <div v-if="!isAttendeeCheckedIn" class="p-3 bg-emerald-50 rounded-3 border border-emerald-200 text-center">
            <h6 class="fw-bold text-slate-900 fs-7 mb-1">General Event Entry Check-in</h6>
            <p class="fs-8 text-muted mb-3">Record event entry check-in for this delegate.</p>
            <button
              type="button"
              class="btn btn-emerald btn-md w-100 rounded-3 py-2 fw-bold shadow-2xs"
              @click="confirmEventCheckIn"
            >
              <i class="bi bi-qr-code-scan me-1.5"></i> Confirm Entry & Check-in
            </button>
          </div>

          <!-- Option B: Attendee Checked-in → Show Next Active Service Card -->
          <div v-else-if="activeCurrentService" class="p-3 bg-primary-subtle rounded-3 border border-primary-subtle">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <span class="fs-8 text-uppercase fw-bold text-primary tracking-wider">Active Service Window</span>
              <span v-if="activeCurrentService.start_time && activeCurrentService.end_time" class="badge bg-white text-slate-700 border fs-8">
                <i class="bi bi-clock me-1"></i> {{ activeCurrentService.start_time }} – {{ activeCurrentService.end_time }}
              </span>
            </div>
            <h5 class="fw-extrabold text-slate-900 fs-6 mb-1">{{ activeCurrentService.name }}</h5>
            <p class="fs-8 text-muted mb-3">{{ activeCurrentService.description || 'Scan to claim service privilege.' }}</p>
            <button
              type="button"
              class="btn btn-primary btn-md w-100 rounded-3 py-2 fw-bold shadow-2xs"
              :disabled="claimingServiceId === activeCurrentService.id"
              @click="claimService(activeCurrentService.id)"
            >
              <span v-if="claimingServiceId === activeCurrentService.id" class="spinner-border spinner-border-sm me-2"></span>
              <i v-else class="bi bi-gift-fill me-1.5"></i> Claim & Record Service Access
            </button>
          </div>

          <!-- Option C: All active services claimed or no active service in current time window -->
          <div v-else class="p-4 text-center bg-light rounded-3 border">
            <i class="bi bi-shield-check text-emerald-600 fs-2 d-block mb-2"></i>
            <h6 class="fw-bold text-slate-900 fs-7 mb-1">All Current Privileges Settled</h6>
            <p class="fs-8 text-muted mb-0">No active unclaimed services available for this attendee at this time.</p>
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

const { executeOrQueue } = useOfflineSync();
const push = usePush();
const token = useCookie<string | null>('token');

const eventsList = ref<any[]>([]);
const servicesList = ref<any[]>([]);
const selectedEventId = ref<number | string>('');

const checkedInCount = ref<number>(0);
const totalRegistrationsCount = ref<number>(0);
const attendancePercentage = computed(() => {
  if (!totalRegistrationsCount.value) return 0;
  return Math.round((checkedInCount.value / totalRegistrationsCount.value) * 100);
});

// Interactive Verification Modal state
const showResultModal = ref(false);
const scannedAttendee = ref<any>(null);
const scannedQrCode = ref<string>('');
const claimingServiceId = ref<number | string | null>(null);

const selectedEventName = computed(() => {
  const ev = eventsList.value.find(e => e.id === Number(selectedEventId.value) || e.id === selectedEventId.value);
  return ev?.name || `Event #${selectedEventId.value}`;
});

const isAttendeeCheckedIn = computed(() => {
  if (!scannedQrCode.value) return false;
  return logs.value.some(
    (l: any) => l.qr_code === scannedQrCode.value && (l.scan_type === 'check_in' || !l.service_id)
  );
});

// Filter services:
// 1. requires_scan is true (or 1 / undefined default)
// 2. Omit services that have ALREADY been claimed for this QR code
// 3. Time window check (start_time <= current_time <= end_time if provided)
const availableScannableServices = computed(() => {
  if (!scannedQrCode.value) return [];
  const now = new Date();
  const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  return servicesList.value.filter((srv: any) => {
    // 1. Check requires_scan
    const requiresScan = srv.requires_scan === true || srv.requires_scan === 1 || srv.requires_scan === '1' || srv.requires_scan === undefined;
    if (!requiresScan) return false;

    // 2. Check if already claimed for this QR code
    const alreadyClaimed = logs.value.some(
      (l: any) => l.qr_code === scannedQrCode.value && (l.service_id === Number(srv.id) || l.service?.id === Number(srv.id))
    );
    if (alreadyClaimed) return false;

    // 3. Time window check if start_time and end_time exist
    if (srv.start_time && srv.end_time) {
      if (currentTimeStr < srv.start_time || currentTimeStr > srv.end_time) {
        return false;
      }
    }

    return true;
  });
});

const activeCurrentService = computed(() => {
  return availableScannableServices.value[0] || null;
});

function isServiceClaimed(serviceId: number | string): boolean {
  if (!scannedQrCode.value) return false;
  return logs.value.some(
    (l: any) => l.qr_code === scannedQrCode.value && (l.service_id === Number(serviceId) || l.service?.id === Number(serviceId))
  );
}

async function claimService(serviceId: number | string) {
  if (!scannedQrCode.value || !selectedEventId.value) return;
  claimingServiceId.value = serviceId;
  try {
    await processScan(scannedQrCode.value, 'service', serviceId);
    showResultModal.value = false; // Auto-close modal once claimed
  } finally {
    claimingServiceId.value = null;
  }
}

async function confirmEventCheckIn() {
  if (!scannedQrCode.value || !selectedEventId.value) return;
  try {
    await processScan(scannedQrCode.value, 'check_in');
    showResultModal.value = false; // Auto-close modal once checked in
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

watch(selectedEventId, async (newEvId) => {
  if (newEvId) {
    await fetchEventStats();
    await fetchLogs();
  }
});

const route = useRoute();

async function handleScannedUrlCode() {
  const code = route.query.code;
  if (code) {
    const codeFromUrl = String(code);
    const eventIdMatch = codeFromUrl.match(/^REG-(\d+)-/i);
    if (eventIdMatch && eventIdMatch[1]) {
      selectedEventId.value = Number(eventIdMatch[1]);
    }
    await processScan(codeFromUrl, 'check_in');
  }
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
  await fetchEvents();
  await fetchServices();
  await handleScannedUrlCode();
});

onBeforeUnmount(() => {
  stopScanner();
});

async function fetchEvents() {
  try {
    const res = await cachedFetch<any>('/api/events');
    eventsList.value = Array.isArray(res?.data?.events) ? res.data.events : (Array.isArray(res?.data) ? res.data : []);
    if (eventsList.value.length > 0 && !selectedEventId.value) {
      selectedEventId.value = eventsList.value[0].id;
    }
  } catch (err) {
    console.error('Failed to fetch events:', err);
  }
}

async function fetchServices() {
  try {
    const res = await cachedFetch<any>('/api/services');
    servicesList.value = Array.isArray(res?.data?.services) ? res.data.services : (Array.isArray(res?.data) ? res.data : []);
  } catch (err) {
    console.error('Failed to fetch services:', err);
  }
}

async function fetchEventStats() {
  if (!selectedEventId.value) return;
  try {
    const regRes = await cachedFetch<any>(`/api/registrations?event_id=${selectedEventId.value}`);
    const regList = Array.isArray(regRes?.data?.registrations) ? regRes.data.registrations : (Array.isArray(regRes?.data) ? regRes.data : []);
    totalRegistrationsCount.value = regList.length;
    checkedInCount.value = regList.filter((r: any) => r.status === 'Confirmed' || r.checked_in).length;
  } catch (err) {
    console.error('Failed to fetch event stats:', err);
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
    logs.value = Array.isArray(res?.data?.scannings) ? res.data.scannings : (Array.isArray(res?.data) ? res.data : []);
  } catch (err) {
    logs.value = [];
  } finally {
    loadingLogs.value = false;
  }
}

async function startScanner() {
  if (!selectedEventId.value) return;
  scanFeedback.value = null;
  lastScannedCode.value = '';
  isProcessingScan.value = false;

  try {
    html5QrcodeScanner = new Html5Qrcode('qr-reader');
    scanningActive.value = true;

    await html5QrcodeScanner.start(
      { facingMode: 'environment' },
      { fps: 5, qrbox: { width: 220, height: 220 } },
      async (decodedText) => {
        // Prevent rapid duplicate scans while processing or scanning the same code repeatedly
        if (isProcessingScan.value || decodedText === lastScannedCode.value) {
          return;
        }
        lastScannedCode.value = decodedText;
        isProcessingScan.value = true;

        try {
          await processScan(decodedText, 'check_in');
        } finally {
          // Allow re-scanning after 3 seconds timeout
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
    scanFeedback.value = {
      type: 'error',
      message: 'Camera permission denied or camera not available.',
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

async function processScan(rawScannedText: string, type: 'check_in' | 'service', serviceId?: number | string) {
  // Extract clean QR code string if camera scanned full URL (e.g. http://localhost:3000/scannings?code=REG-1-3)
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
    // Check if string was duplicated by rapid reader concatenation (e.g., REG-1-3REG-1-3)
    const len = qrCode.length;
    if (len > 4 && len % 2 === 0) {
      const half1 = qrCode.substring(0, len / 2);
      const half2 = qrCode.substring(len / 2);
      if (half1 === half2) {
        qrCode = half1;
      }
    }
  }

  // 1. Check if qrCode starts with REG-{event_id}-
  const prefixMatch = qrCode.match(/^REG-(\d+)-/i);
  if (prefixMatch && prefixMatch[1]) {
    selectedEventId.value = Number(prefixMatch[1]);
  }

  // 2. Fetch registrations list to discover actual event_id for hash codes like REG-2-C3C8BBD490EF6560
  let matchedReg: any = null;
  try {
    const regRes = await cachedFetch<any>('/api/registrations');
    const regList = Array.isArray(regRes?.data?.registrations) ? regRes.data.registrations : (Array.isArray(regRes?.data) ? regRes.data : []);
    matchedReg = regList.find((r: any) => r.qr_code === qrCode || `REG-${r.event_id}-${r.id}` === qrCode || String(r.id) === qrCode.split('-').pop());
    if (matchedReg && matchedReg.event_id) {
      selectedEventId.value = Number(matchedReg.event_id);
    }
  } catch {
    // Continue with current selectedEventId
  }

  if (!selectedEventId.value) return;

  const defaultServiceId = servicesList.value[0]?.id ? Number(servicesList.value[0].id) : 1;
  const activeServiceId = serviceId ? Number(serviceId) : defaultServiceId;

  // Build payload based on scan_type
  const bodyPayload: Record<string, any> = {
    qr_code: qrCode,
    scan_type: type,
  };
  if (type === 'service' || serviceId) {
    bodyPayload.service_id = activeServiceId;
  }

  const globalPayload: Record<string, any> = {
    ...bodyPayload,
    event_id: Number(selectedEventId.value),
  };

  try {
    let res: any;
    try {
      res = await $fetch<any>(`/api/events/${selectedEventId.value}/scannings`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token.value}`, Accept: 'application/json' },
        body: bodyPayload,
      });
    } catch {
      res = await $fetch<any>('/api/scannings', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token.value}`, Accept: 'application/json' },
        body: globalPayload,
      });
    }

    const currentEventObj = eventsList.value.find(e => e.id === Number(selectedEventId.value) || e.id === selectedEventId.value);
    const eventName = currentEventObj?.name || `Event #${selectedEventId.value}`;

    // Look up full registration details using qrCode or ID
    let attendeeData = res?.data?.registration || res?.registration || res?.data?.attendee;
    if (!attendeeData || !attendeeData.first_name) {
      try {
        const regRes = await cachedFetch<any>(`/api/registrations?event_id=${selectedEventId.value}`);
        const regList = Array.isArray(regRes?.data?.registrations) ? regRes.data.registrations : (Array.isArray(regRes?.data) ? regRes.data : []);
        attendeeData = regList.find((r: any) => r.qr_code === qrCode || `REG-${r.event_id}-${r.id}` === qrCode || String(r.id) === qrCode.split('-').pop());
      } catch {
        // Fallback placeholder
      }
    }

    if (!attendeeData) {
      attendeeData = {
        first_name: 'Registered',
        last_name: 'Delegate',
        phone: '',
        qr_code: qrCode,
      };
    }

    scannedAttendee.value = attendeeData;
    scannedQrCode.value = qrCode;
    showResultModal.value = true;

    scanFeedback.value = {
      type: 'success',
      message: `Check-in recorded for QR code ${qrCode} at ${eventName}`,
    };
    if (res?.queued) {
      push.success({ title: 'Queued', message: `Scan for ${eventName} queued for sync.` });
    } else {
      push.success({ title: 'Success', message: `Check-in for ${eventName} processed successfully!` });
    }

    await fetchEventStats();
    await fetchLogs();
  } catch (err: any) {
    console.error('Scan processing error:', err);
    const rawMsg = err?.data?.message || err?.data?.error || err?.message;
    const msg = typeof rawMsg === 'string' ? rawMsg : (err?.data?.errors ? JSON.stringify(err.data.errors) : 'Check-in scan failed. Please verify QR code or attendee registration.');
    scanFeedback.value = { type: 'error', message: msg };
    push.error({ title: 'Scan Validation Error', message: msg });
  }
}

async function handleManualCheckin() {
  if (!manualQrCode.value.trim()) return;
  submitting.value = true;
  try {
    await processScan(manualQrCode.value.trim(), scanType.value, selectedServiceId.value);
    manualQrCode.value = '';
  } finally {
    submitting.value = false;
  }
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr.replace(' ', 'T')).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
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

.stat-icon-circle {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
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

.btn-emerald {
  background-color: var(--green-500);
  color: #ffffff;
  border: none;
}

.btn-emerald:hover:not(:disabled) {
  background-color: var(--green-600);
  color: #ffffff;
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

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
