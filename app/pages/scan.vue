<template>
  <div class="scan-page-container min-vh-100 d-flex flex-column bg-light">
    <!-- Clean Minimal Header -->
    <header class="scan-header bg-white px-3 py-2.5 d-flex align-items-center justify-content-between border-bottom shadow-2xs">
      <div class="d-flex align-items-center gap-2.5">
        <img src="/mana ministries.png" alt="Mana Ministries Logo" class="brand-logo" />
        <div>
          <h1 class="brand-title mb-0 fs-6 fw-bold text-slate-900">Kongamano Scan Station</h1>
          <span class="fs-8 text-muted">Attendee Scan Verification & Service Claiming</span>
        </div>
      </div>

      <div class="d-flex align-items-center gap-2">
        <div v-if="pendingCount > 0" class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-pill py-1.5 px-2.5 fs-8 fw-semibold d-flex align-items-center gap-1" title="Offline scans syncing in background">
          <span class="spinner-grow spinner-grow-sm text-warning" role="status"></span>
          <span>{{ pendingCount }} Syncing</span>
        </div>
        <div v-else class="badge bg-success-subtle text-success border border-success-subtle rounded-pill py-1.5 px-2.5 fs-8 fw-semibold d-flex align-items-center gap-1">
          <i class="bi bi-cloud-check-fill"></i>
          <span>Ready</span>
        </div>

        <button
          v-if="authStore.isAdmin"
          type="button"
          class="btn btn-outline-secondary btn-sm rounded-pill px-2.5 py-1 fs-8 fw-semibold"
          @click="navigateTo('/scannings')"
        >
          <i class="bi bi-grid me-1"></i> Dashboard
        </button>
      </div>
    </header>

    <!-- Main Body -->
    <main class="flex-grow-1 p-3 p-md-4 d-flex flex-column align-items-center justify-content-start">
      <div class="w-100" style="max-width: 540px;">

        <!-- Scan Feedback Notification Alert -->
        <div
          v-if="scanFeedback"
          class="alert py-2.5 px-3 mb-3 rounded-3 shadow-2xs d-flex align-items-center justify-content-between"
          :class="scanFeedback.type === 'success' ? 'alert-success' : 'alert-danger'"
        >
          <div class="d-flex align-items-center gap-2">
            <i :class="['bi fs-6', scanFeedback.type === 'success' ? 'bi-check-circle-fill text-success' : 'bi-exclamation-triangle-fill text-danger']"></i>
            <span class="fs-7 fw-semibold">{{ scanFeedback.message }}</span>
          </div>
          <button type="button" class="btn-close btn-close-sm" @click="scanFeedback = null"></button>
        </div>

        <!-- Resolving Spinner -->
        <div v-if="isResolving" class="text-center py-5 bg-white rounded-3 border shadow-2xs p-4 mb-3">
          <div class="spinner-border text-success mb-3" style="width: 2.5rem; height: 2.5rem;" role="status"></div>
          <h5 class="fw-bold text-slate-900 fs-6 mb-1">Verifying Badge QR Code...</h5>
          <p class="fs-8 text-muted mb-0">Resolving attendee and today's scan status</p>
        </div>

        <!-- ATTENDEE SCAN VERIFICATION CARD (Matches Attendee Scan Verification Modal exactly) -->
        <div v-else-if="scannedAttendee" class="bg-white rounded-3 border shadow-2xs overflow-hidden mb-3">
          <!-- Target Event Banner -->
          <div class="p-3 bg-emerald-50 rounded-top border-bottom border-emerald-200 position-relative text-center">
            <span class="fs-8 text-uppercase text-emerald-700 fw-bold d-block tracking-wider">Target Event</span>
            <h5 class="fw-extrabold text-slate-900 mb-0 fs-6 mt-0.5">{{ selectedEventName }}</h5>
            <button
              type="button"
              class="btn-close position-absolute top-50 end-0 translate-middle-y me-3"
              aria-label="Close and scan next badge"
              title="Close & Scan Next Badge"
              @click="resetAndOpenScanner"
            ></button>
          </div>

          <div class="p-3 p-sm-4">
            <!-- Delegate Information -->
            <div class="d-flex align-items-center flex-wrap gap-2 gap-sm-3 p-3 bg-light rounded-3 border mb-3">
              <div class="flex-grow-1 overflow-hidden">
                <h6 class="fw-bold text-slate-900 mb-0 fs-6 text-truncate">{{ attendeeFullName }}</h6>
                <div class="d-flex align-items-center flex-wrap gap-1.5 fs-8 text-muted mt-0.5">
                  <span v-if="attendeePhoneNumber">
                    <i class="bi bi-phone me-1"></i>{{ attendeePhoneNumber }}
                  </span>
                  <span v-if="attendeePhoneNumber" class="d-none d-sm-inline">•</span>
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
                <span v-else class="badge bg-warning-subtle text-warning border border-warning-subtle rounded-pill px-3 py-1 fs-8 fw-bold">
                  <i class="bi bi-clock-history me-1"></i> Not Checked In Today
                </span>
              </div>
            </div>

            <!-- Sequential Action Card -->
            <div class="mb-3">
              <!-- Option EXPIRED: Event Completed -->
              <div v-if="isSelectedEventCompleted" class="p-3 bg-danger-subtle rounded-3 border border-danger-subtle text-center">
                <i class="bi bi-slash-circle-fill text-danger fs-2 d-block mb-1"></i>
                <h6 class="fw-bold text-danger fs-7 mb-1">QR Code Disabled (Event Ended)</h6>
                <p class="fs-8 text-muted mb-0">
                  This QR code badge belongs to <strong>{{ selectedEventName }}</strong> which has already ended.
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
                  class="btn btn-emerald btn-lg w-100 rounded-3 py-2.5 fw-bold fs-7 shadow-2xs d-flex align-items-center justify-content-center gap-2"
                  :disabled="isSubmitting"
                  @click="handleConfirmCheckIn"
                >
                  <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1.5"></span>
                  <i v-else class="bi bi-qr-code-scan fs-6"></i>
                  <span>{{ isReentryToday ? 'Confirm Re-Entry & Check-in' : 'Confirm Entry & Check-in Today' }}</span>
                </button>
              </div>

              <!-- Option B: Currently Checked-in → Active Service Window Available -->
              <div v-else-if="activeCurrentService" class="p-3 bg-emerald-50 rounded-3 border border-emerald-200 text-center mb-2">
                <div v-if="checkInCountToday > 1" class="alert alert-info py-1 px-2.5 fs-8 mb-2 rounded-3 text-start d-flex align-items-center gap-2">
                  <i class="bi bi-info-circle-fill text-blue-600"></i>
                  <span>Re-entered delegate</span>
                </div>

                <div class="d-flex align-items-center justify-content-between mb-2">
                  <span class="fs-8 text-uppercase text-emerald-700 fw-bold tracking-wider">
                    <i class="bi bi-gift-fill me-1"></i> Active Service Window
                  </span>
                  <span v-if="activeCurrentService.start_time && activeCurrentService.end_time" class="badge bg-white text-slate-900 border border-slate-300 fs-8 fw-bold shadow-2xs">
                    <i class="bi bi-clock-fill me-1 text-primary"></i> {{ activeCurrentService.start_time }} – {{ activeCurrentService.end_time }}
                  </span>
                </div>
                <h5 class="fw-extrabold text-slate-900 fs-6 mb-1">{{ activeCurrentService.name }}</h5>
                <p class="fs-8 text-muted mb-3">{{ activeCurrentService.description || 'Scan to claim service privilege.' }}</p>

                <div class="d-flex flex-column gap-2">
                  <button
                    type="button"
                    class="btn btn-primary btn-md w-100 rounded-3 py-2 fw-bold shadow-2xs"
                    :disabled="isSubmitting"
                    @click="handleClaimService(activeCurrentService.id)"
                  >
                    <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1.5"></span>
                    <i v-else class="bi bi-check-circle-fill me-1.5"></i> Yes!
                  </button>

                  <button
                    type="button"
                    class="btn btn-outline-danger btn-sm w-100 rounded-3 py-1.5 fw-semibold fs-8"
                    :disabled="isSubmitting"
                    @click="handleConfirmCheckOut"
                  >
                    <i class="bi bi-door-closed me-1"></i> Check-Out Delegate
                  </button>
                </div>
              </div>

              <!-- Option C: All active services claimed today -->
              <div v-else-if="areAllServicesClaimedToday" class="p-3 bg-emerald-50 rounded-3 border border-emerald-200 text-center">
                <i class="bi bi-check-circle-fill text-emerald-600 fs-3 d-block mb-1"></i>
                <h6 class="fw-bold text-slate-900 fs-7 mb-1">All Services Claimed For Today!</h6>
                <p class="fs-8 text-muted mb-2">All scheduled services for today have been claimed by this delegate.</p>

                <button
                  type="button"
                  class="btn btn-outline-danger btn-sm w-100 rounded-3 py-1.5 fw-semibold fs-8"
                  :disabled="isSubmitting"
                  @click="handleConfirmCheckOut"
                >
                  <i class="bi bi-door-closed me-1"></i> Check-Out Delegate
                </button>
              </div>

              <!-- Option D: Checked in, but no active service in current time window -->
              <div v-else class="p-3 bg-light rounded-3 border text-center">
                <i class="bi bi-clock-history text-amber-500 fs-3 d-block mb-1"></i>
                <h6 class="fw-bold text-slate-900 fs-7 mb-1">No Active Service Right Now</h6>
                <p class="fs-8 text-muted mb-2">Delegate is checked in today. No scannable service is active in this current time window.</p>

                <button
                  type="button"
                  class="btn btn-outline-danger btn-sm w-100 rounded-3 py-1.5 fw-semibold fs-8"
                  :disabled="isSubmitting"
                  @click="handleConfirmCheckOut"
                >
                  <i class="bi bi-door-closed me-1"></i> Check-Out Delegate
                </button>
              </div>
            </div>

            <!-- Ready for Next Scan Button -->
            <div class="pt-2 border-top">
              <button
                type="button"
                class="btn btn-secondary btn-sm w-100 rounded-3 py-1.5 fw-bold fs-8"
                @click="resetAndOpenScanner"
              >
                <i class="bi bi-camera me-1"></i> Ready for Next Scan
              </button>
            </div>
          </div>
        </div>

        <!-- CAMERA SCANNER CARD -->
        <div class="bg-white rounded-3 border shadow-2xs p-3 mb-3">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <span class="fs-7 fw-bold text-slate-800">
              <i class="bi bi-camera me-1.5 text-primary"></i> Camera Scanner
            </span>
            <button
              type="button"
              class="btn btn-sm py-0.5 px-2 rounded-pill fs-8 fw-semibold"
              :class="isCameraActive ? 'btn-outline-danger' : 'btn-outline-primary'"
              @click="toggleCamera"
            >
              {{ isCameraActive ? 'Stop Camera' : 'Start Camera' }}
            </button>
          </div>

          <div class="camera-wrapper rounded-3 overflow-hidden border bg-dark position-relative">
            <div id="fast-qr-reader" class="w-100" style="min-height: 240px;"></div>
            <div v-if="!isCameraActive" class="position-absolute top-50 start-50 translate-middle text-center text-white">
              <i class="bi bi-camera-video-off fs-2 opacity-50 d-block mb-1"></i>
              <span class="fs-8 opacity-75">Camera Paused</span>
            </div>
          </div>

          <div class="mt-3 pt-3 border-top">
            <form @submit.prevent="submitManualCode" class="d-flex gap-2">
              <input
                v-model="manualCodeInput"
                type="text"
                class="form-control form-control-sm fs-8 rounded-3"
                placeholder="Or enter Badge QR Code / ID..."
              />
              <button
                type="submit"
                class="btn btn-emerald btn-sm rounded-3 px-3 fw-bold fs-8 flex-shrink-0"
                :disabled="!manualCodeInput.trim() || isResolving"
              >
                Scan
              </button>
            </form>
          </div>
        </div>

      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { Html5Qrcode } from 'html5-qrcode';
import { dbStore } from '~/utils/db';
import { cachedFetch } from '~/utils/cachedFetch';
import { useAuthStore } from '~/stores/auth';
import { useOfflineSync } from '~/composables/useOfflineSync';

definePageMeta({
  layout: false,
});

const route = useRoute();
const token = useCookie('token');
const authStore = useAuthStore();
const push = usePush();
const { pendingCount, executeOrQueue } = useOfflineSync();

// Reactive State
const scannedQrCode = ref('');
const scannedAttendee = ref<any | null>(null);
const selectedEventId = ref<number | null>(null);
const selectedEventName = ref('Kongamano Event');
const isSelectedEventCompleted = ref(false);
const isResolving = ref(false);
const isSubmitting = ref(false);
const isCameraActive = ref(false);
const manualCodeInput = ref('');
const scanFeedback = ref<{ type: 'success' | 'error'; message: string } | null>(null);

const servicesList = ref<any[]>([]);
const allScanLogs = ref<any[]>([]);
let html5QrCodeScanner: Html5Qrcode | null = null;

// Initial Code from Query Parameter
const initialCode = computed(() => {
  const code = route.query.code;
  return typeof code === 'string' ? code.trim() : '';
});

// Helper for today's Date string in EAT timezone (Africa/Nairobi)
function getTodayDateStr(): string {
  try {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Nairobi' });
  } catch {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

const attendeeFullName = computed(() => {
  if (!scannedAttendee.value) return 'Delegate';
  const first = scannedAttendee.value.first_name || '';
  const last = scannedAttendee.value.last_name || '';
  return `${first} ${last}`.trim() || 'Delegate';
});

const attendeePhoneNumber = computed(() => {
  if (!scannedAttendee.value) return '';
  const phone = scannedAttendee.value.phone || scannedAttendee.value.registration?.phone || '';
  const trimmed = String(phone).trim();
  if (!trimmed || trimmed.toLowerCase() === 'no phone' || trimmed === '—' || trimmed === '-') {
    return '';
  }
  return trimmed;
});

// Attendee's Logs for Today (matches scannings.vue logic)
const attendeeTodayLogs = computed(() => {
  if (!scannedQrCode.value && !scannedAttendee.value?.id) return [];
  const todayStr = getTodayDateStr();
  const regId = scannedAttendee.value?.id;
  const realQr = scannedAttendee.value?.qr_code || scannedQrCode.value;

  const filtered = allScanLogs.value.filter((l: any) => {
    const logQr = l.qr_code || l.registration?.qr_code || '';
    const logRegId = l.registration_id || l.registration?.id;
    const matchesAttendee = (realQr && logQr === realQr) || (scannedQrCode.value && logQr === scannedQrCode.value) || (regId && Number(logRegId) === Number(regId));
    if (!matchesAttendee) return false;

    // Filter by today's date in EAT
    if (l.created_at) {
      let parseable = String(l.created_at).trim().replace(' ', 'T');
      if (!/Z|[+-]\d{2}:?\d{2}$/i.test(parseable)) {
        parseable += 'Z';
      }
      const logDateStr = new Date(parseable).toLocaleDateString('en-CA', { timeZone: 'Africa/Nairobi' });
      return logDateStr === todayStr;
    }
    return true;
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
    return false;
  }

  return logsToday.some((l: any) => l.scan_type === 'check_in' || !l.service_id);
});

const isAttendeeCheckedOutToday = computed(() => {
  const logsToday = attendeeTodayLogs.value;
  return logsToday.length > 0 && logsToday[0]?.scan_type === 'check_out';
});

const checkInCountToday = computed(() => {
  return attendeeTodayLogs.value.filter((l: any) => l.scan_type === 'check_in' && !l.service_id && !l.service).length;
});

const isReentryToday = computed(() => {
  return checkInCountToday.value > 1 || (checkInCountToday.value >= 1 && isAttendeeCheckedOutToday.value);
});

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

// Active Service Window Logic (Strict EAT Time Window Check)
const availableScannableServices = computed(() => {
  if (!scannedQrCode.value && !scannedAttendee.value?.id) return [];
  const currentMinutes = getEATCurrentMinutes();

  return servicesList.value.filter((srv: any) => {
    const requiresScan = srv.requires_scan === true || srv.requires_scan === 1 || srv.requires_scan === '1' || srv.requires_scan === undefined;
    if (!requiresScan) return false;

    const regId = scannedAttendee.value?.id;
    const realQr = scannedAttendee.value?.qr_code || scannedQrCode.value;
    const todayStr = getTodayDateStr();

    const alreadyClaimed = allScanLogs.value.some((l: any) => {
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
  const regId = scannedAttendee.value?.id;
  const realQr = scannedAttendee.value?.qr_code || scannedQrCode.value;
  const todayStr = getTodayDateStr();

  const scannableServices = servicesList.value.filter((srv: any) =>
    srv.requires_scan === true || srv.requires_scan === 1 || srv.requires_scan === '1' || srv.requires_scan === undefined
  );
  if (scannableServices.length === 0) return false;

  return scannableServices.every((srv: any) => {
    return allScanLogs.value.some((l: any) => {
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
  });
});

// Audio & Vibration Feedback Helper
function triggerSuccessFeedback() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate([60, 40, 100]);
    } catch {}
  }
  if (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch {}
  }
}

// Ultra-Fast QR Resolution using IndexedDB First
async function resolveBadgeCode(rawCode: string) {
  if (!rawCode || !rawCode.trim()) return;
  let cleanCode = rawCode.trim();

  // Strip URL prefix if QR contains full URL (e.g. https://domain.com/scan?code=REG-1-0001)
  if (cleanCode.includes('?code=')) {
    const parts = cleanCode.split('?code=');
    if (parts[1]) {
      cleanCode = decodeURIComponent(parts[1].split('&')[0]);
    }
  }

  isResolving.value = true;
  scanFeedback.value = null;
  scannedQrCode.value = cleanCode;

  try {
    // 1. Try to extract event_id from badge code format (e.g. REG-1-00001)
    let extractedEventId: number | null = null;
    const match = cleanCode.match(/^REG-(\d+)-/i);
    if (match && match[1]) {
      extractedEventId = parseInt(match[1], 10);
      selectedEventId.value = extractedEventId;
    }

    // 2. Query IndexedDB Cache first (Zero Network Delay)
    let foundAttendee: any = null;
    if (extractedEventId) {
      const cached = await dbStore.getCachedRegistrations(extractedEventId);
      if (Array.isArray(cached) && cached.length > 0) {
        foundAttendee = cached.find((r: any) => {
          const regId = String(r.id);
          const fullCode = r.qr_code || `REG-${r.event_id || extractedEventId}-${regId}`;
          return r.qr_code === cleanCode || fullCode === cleanCode || regId === cleanCode;
        });
      }
    }

    // 3. If Event ID not resolved yet, fetch default active event
    if (!foundAttendee && !selectedEventId.value) {
      try {
        const eventsRes = await cachedFetch<any>('/api/events');
        const evList = Array.isArray(eventsRes?.data?.events) ? eventsRes.data.events : (Array.isArray(eventsRes?.data) ? eventsRes.data : []);
        if (evList.length > 0) {
          selectedEventName.value = evList[0].name || selectedEventName.value;
          selectedEventId.value = evList[0].id;
        }
      } catch {}
    }

    // 4. Fallback Network Lookup if not found in IndexedDB Cache
    if (!foundAttendee && selectedEventId.value) {
      try {
        const res = await $fetch<any>(`/api/registrations?event_id=${selectedEventId.value}`, {
          headers: { ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}), Accept: 'application/json' },
        });
        const list = Array.isArray(res?.data?.registrations) ? res.data.registrations : (Array.isArray(res?.data) ? res.data : []);
        if (list.length > 0) {
          await dbStore.cacheRegistrations(selectedEventId.value, list);
          foundAttendee = list.find((r: any) => {
            const regId = String(r.id);
            const fullCode = r.qr_code || `REG-${r.event_id || selectedEventId.value}-${regId}`;
            return r.qr_code === cleanCode || fullCode === cleanCode || regId === cleanCode;
          });
        }
      } catch (err) {
        console.warn('Network lookup fallback warning:', err);
      }
    }

    // 5. Fetch Services for the Event (cached)
    if (selectedEventId.value) {
      try {
        const srvRes = await cachedFetch<any>(`/api/event-services?event_id=${selectedEventId.value}`);
        const rawServices = Array.isArray(srvRes?.data?.event_services)
          ? srvRes.data.event_services
          : (Array.isArray(srvRes?.data) ? srvRes.data : []);

        servicesList.value = rawServices.map((es: any) => {
          const srvStart = es.start_time || es.service?.start_time || null;
          const srvEnd = es.end_time || es.service?.end_time || null;
          const srvScan = es.requires_scan !== undefined ? es.requires_scan : (es.service?.requires_scan ?? true);
          const srvName = es.name || es.service?.name || `Service #${es.service_id || es.id}`;
          const srvDesc = es.description || es.service?.description || '';

          return {
            id: es.service_id || es.service?.id || es.id,
            name: srvName,
            start_time: srvStart,
            end_time: srvEnd,
            requires_scan: srvScan,
            description: srvDesc,
          };
        });
      } catch {}
    }

    // 6. Fetch Existing Scannings / Attendance Status Today (Targeted API query)
    if (selectedEventId.value) {
      try {
        const logsRes = await cachedFetch<any>(`/api/scannings?event_id=${selectedEventId.value}`);
        const rawLogs = Array.isArray(logsRes?.data?.scannings)
          ? logsRes.data.scannings
          : (Array.isArray(logsRes?.data) ? logsRes.data : []);
        if (rawLogs.length > 0) {
          const existingIds = new Set(allScanLogs.value.map(l => l.id));
          const freshLogs = rawLogs.filter((l: any) => !existingIds.has(l.id));
          allScanLogs.value = [...allScanLogs.value, ...freshLogs];
        }
      } catch {}
    }

    // Set Final Scanned Attendee State
    scannedAttendee.value = foundAttendee || {
      first_name: 'Registered',
      last_name: 'Delegate',
      phone: '',
      qr_code: cleanCode,
      event_id: selectedEventId.value,
    };

    if (foundAttendee?.event?.name) {
      selectedEventName.value = foundAttendee.event.name;
    }

    triggerSuccessFeedback();
  } catch (err: any) {
    console.error('Error resolving badge code:', err);
    scanFeedback.value = {
      type: 'error',
      message: err?.message || 'Unable to resolve badge QR code.',
    };
  } finally {
    isResolving.value = false;
  }
}

// Action Handlers
async function handleConfirmCheckIn() {
  await executeScanAction('check_in');
}

async function handleConfirmCheckOut() {
  await executeScanAction('check_out');
}

async function handleClaimService(serviceId: number | string) {
  await executeScanAction('service', serviceId);
}

async function executeScanAction(type: 'check_in' | 'service' | 'check_out', serviceId?: number | string) {
  if (!selectedEventId.value || !scannedQrCode.value) return;

  isSubmitting.value = true;
  const qr = scannedQrCode.value;
  const attendee = scannedAttendee.value;
  const serviceObj = serviceId ? servicesList.value.find((s) => s.id === Number(serviceId)) : null;

  const actionLabel = type === 'check_out'
    ? 'Check-out'
    : (type === 'service' ? `Claimed ${serviceObj?.name || 'Service'}` : 'Event Entry Check-in');

  // 1. Optimistic Local Update
  const localScanEntry = {
    id: `scan-${Date.now()}`,
    qr_code: qr,
    scan_type: type,
    service_id: serviceId ? Number(serviceId) : null,
    event_id: Number(selectedEventId.value),
    registration: attendee,
    created_at: new Date().toISOString(),
  };

  allScanLogs.value = [localScanEntry, ...allScanLogs.value];

  // 2. User Feedback Alert & Sound
  triggerSuccessFeedback();
  scanFeedback.value = {
    type: 'success',
    message: `${actionLabel} recorded for ${attendeeFullName.value}!`,
  };

  push.success({
    title: 'Scan Recorded',
    message: `${actionLabel} recorded for ${attendeeFullName.value}`,
  });

  // 3. Background Non-Blocking Sync
  try {
    const validBackendScanType = type === 'check_out' ? 'check_out' : 'check_in';
    const bodyPayload: Record<string, any> = {
      qr_code: qr,
      scan_type: validBackendScanType,
      event_id: Number(selectedEventId.value),
    };
    if (serviceId) {
      bodyPayload.service_id = parseInt(String(serviceId), 10);
    }

    const endpoint = `/api/events/${selectedEventId.value}/scannings`;
    executeOrQueue({
      url: endpoint,
      method: 'POST',
      body: bodyPayload,
      label: `${actionLabel} - ${attendeeFullName.value} (${qr})`,
    }).catch((err) => {
      console.warn('Background sync notice:', err);
    });

    if (type === 'check_out' || type === 'service') {
      // Completed final action (service claimed or checked out) -> close card and re-arm camera
      scannedAttendee.value = null;
      scannedQrCode.value = '';
      if (route.query.code) {
        navigateTo({ path: '/scan' }, { replace: true });
      }
      await startCamera();
    } else {
      // type === 'check_in': Keep the modal open!
      // The attendee status is now Checked In, and the card will smoothly display the
      // Active Service Window to claim immediately, or show that no active service is scheduled right now.
      push.info({
        title: 'Entry Check-in Confirmed',
        message: 'Attendee is checked in. You can now claim active services below.',
      });
    }
  } finally {
    isSubmitting.value = false;
  }
}

function submitManualCode() {
  if (!manualCodeInput.value.trim()) return;
  const code = manualCodeInput.value.trim();
  manualCodeInput.value = '';
  resolveBadgeCode(code);
}

async function toggleCamera() {
  if (isCameraActive.value) {
    await stopCamera();
  } else {
    await startCamera();
  }
}

async function startCamera() {
  try {
    isCameraActive.value = true;
    if (!html5QrCodeScanner) {
      html5QrCodeScanner = new Html5Qrcode('fast-qr-reader');
    }
    await html5QrCodeScanner.start(
      { facingMode: 'environment' },
      {
        fps: 15,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      async (decodedText) => {
        await stopCamera();
        await resolveBadgeCode(decodedText);
      },
      () => {}
    );
  } catch (err: any) {
    console.error('Camera start error:', err);
    isCameraActive.value = false;
    scanFeedback.value = {
      type: 'error',
      message: err?.message || 'Unable to access camera.',
    };
  }
}

async function stopCamera() {
  if (html5QrCodeScanner && isCameraActive.value) {
    try {
      await html5QrCodeScanner.stop();
      html5QrCodeScanner.clear();
    } catch {}
    html5QrCodeScanner = null;
    isCameraActive.value = false;
  }
}

function resetAndOpenScanner() {
  scannedAttendee.value = null;
  scannedQrCode.value = '';
  if (route.query.code) {
    navigateTo({ path: '/scan' }, { replace: true });
  }
  startCamera();
}

onMounted(async () => {
  if (!token.value) {
    navigateTo({ path: '/login', query: { redirect: route.fullPath } });
    return;
  }

  if (initialCode.value) {
    await resolveBadgeCode(initialCode.value);
  } else {
    startCamera();
  }
});

watch(
  () => route.query.code,
  async (newCode) => {
    if (typeof newCode === 'string' && newCode.trim().length > 0) {
      await resolveBadgeCode(newCode.trim());
    }
  }
);

onBeforeUnmount(() => {
  stopCamera();
});
</script>

<style scoped>
.scan-page-container {
  min-height: 100vh;
}

.brand-logo {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.brand-title {
  color: #43766C;
}

.btn-emerald {
  background-color: #43766C;
  border-color: #43766C;
  color: #ffffff;
}

.btn-emerald:hover {
  background-color: #355e56;
  border-color: #355e56;
  color: #ffffff;
}

.bg-emerald-50 {
  background-color: #f0fdf4 !important;
}

.border-emerald-200 {
  border-color: #bbf7d0 !important;
}

.camera-wrapper {
  background-color: #000;
  min-height: 240px;
}
</style>
