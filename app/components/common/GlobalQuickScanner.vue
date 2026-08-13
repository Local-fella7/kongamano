<template>
  <CommonModal
    :model-value="modelValue"
    title="Instant Service Claiming Station"
    icon="bi-gift-fill"
    size="md"
    @update:model-value="$emit('update:modelValue', $event)"
    @close="handleClose"
  >
    <div class="service-claiming-station p-1">
      <!-- 1. Scan Feedback Alert -->
      <div v-if="scanFeedback" class="alert fs-8 py-2 px-3 mb-3 rounded-3 shadow-2xs" :class="scanFeedback.type === 'success' ? 'alert-success' : 'alert-danger'">
        <i :class="['bi me-1.5', scanFeedback.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill']"></i>
        {{ scanFeedback.message }}
      </div>

      <!-- 2. Active Service Window Banner -->
      <div v-if="activeCurrentService" class="p-3 bg-emerald-50 rounded-3 border border-emerald-200 mb-3 text-center">
        <span class="fs-8 text-uppercase text-emerald-700 fw-extrabold tracking-wider">
          <i class="bi bi-gift-fill me-1"></i> Active Service Window
        </span>
        <h4 class="fw-extrabold text-slate-900 mb-1 fs-5 mt-1">🎁 {{ activeCurrentService.name }}</h4>
        <span v-if="activeCurrentService.start_time || activeCurrentService.end_time" class="badge bg-white text-dark border border-slate-400 fs-7 fw-bold px-3 py-1.5 shadow-2xs style-black-time" style="color: #000000 !important; font-weight: 800;">
          <i class="bi bi-clock-fill me-1 text-dark" style="color: #000000 !important;"></i> {{ formatServiceTimeRange(activeCurrentService.start_time, activeCurrentService.end_time) }}
        </span>
      </div>

      <!-- 3. Scanned Delegate Summary & Claim Action Cards -->
      <div v-if="scannedAttendee" class="delegate-claim-card bg-light p-3 rounded-3 border mb-3">
        <div class="d-flex align-items-center gap-3 mb-3">
          <div class="flex-grow-1 overflow-hidden">
            <h6 class="fw-bold text-slate-900 mb-0 fs-6 text-truncate">{{ formatAttendeeDisplayName(scannedAttendee) }}</h6>
            <div class="d-flex align-items-center flex-wrap gap-1.5 fs-8 text-muted mt-0.5">
              <span v-if="getAttendeePhoneNumber(scannedAttendee)">
                <i class="bi bi-phone me-1"></i>{{ getAttendeePhoneNumber(scannedAttendee) }}
              </span>
              <span v-if="getAttendeePhoneNumber(scannedAttendee)">•</span>
              <code>{{ scannedAttendee?.qr_code || scannedQrCode }}</code>
            </div>
          </div>
          <div>
            <span v-if="isAttendeeCheckedIn" class="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2.5 py-1 fs-8 fw-bold">
              <i class="bi bi-check-circle-fill me-1"></i> Checked In
            </span>
            <span v-else class="badge bg-warning-subtle text-warning border border-warning-subtle rounded-pill px-2.5 py-1 fs-8 fw-bold">
              <i class="bi bi-clock-history me-1"></i> Not Checked In
            </span>
          </div>
        </div>

        <!-- Only Show Currently Active Service Button -->
        <div v-if="activeCurrentService" class="d-flex flex-column gap-2 mb-2">
          <button
            type="button"
            class="btn btn-emerald btn-lg w-100 rounded-3 py-2.5 fw-extrabold fs-6 shadow-sm d-flex align-items-center justify-content-center gap-2"
            @click="confirmInstantClaim('service', activeCurrentService.id)"
          >
            <i class="bi bi-check-circle-fill fs-5"></i>
            <span>Yes!</span>
          </button>
        </div>

        <!-- Case 2: Delegate Not Checked In Yet & No Unclaimed Services -->
        <div v-else-if="!isAttendeeCheckedIn" class="mb-2">
          <button
            type="button"
            class="btn btn-emerald btn-lg w-100 rounded-3 py-2.5 fw-extrabold fs-6 shadow-sm d-flex align-items-center justify-content-center gap-2"
            @click="confirmInstantClaim('check_in')"
          >
            <i class="bi bi-qr-code-scan fs-5"></i>
            <span>Confirm Entry & Check-In Today</span>
          </button>
        </div>

        <!-- Case 3: All Event Services Claimed -->
        <div v-else-if="areAllServicesClaimedToday" class="p-3 bg-emerald-50 rounded-3 border border-emerald-200 text-center mb-2">
          <i class="bi bi-check-circle-fill text-emerald-600 fs-2 d-block mb-1"></i>
          <h6 class="fw-bold text-slate-900 fs-7 mb-1">All Event Services Claimed!</h6>
          <p class="fs-8 text-muted mb-0">All services configured for this event have been claimed by this delegate.</p>
        </div>

        <!-- Case 4: Event Has No Services Configured -->
        <div v-else class="p-3 bg-light rounded-3 border text-center mb-2">
          <i class="bi bi-info-circle-fill text-primary fs-2 d-block mb-1"></i>
          <h6 class="fw-bold text-slate-900 fs-7 mb-1">Delegate Verified & Checked In</h6>
          <p class="fs-8 text-muted mb-0">Delegate entry is verified. No scannable services are configured for this event.</p>
        </div>

        <div v-if="isAttendeeCheckedIn" class="text-center mt-1">
          <button
            type="button"
            class="btn btn-link text-danger btn-sm text-decoration-none fs-8 fw-semibold"
            @click="confirmInstantClaim('check_out')"
          >
            <i class="bi bi-door-closed me-1"></i> Check-Out Delegate
          </button>
        </div>
      </div>

      <!-- 4. Default Ready State when waiting for scan -->
      <div v-else class="p-4 bg-light rounded-3 border text-center mb-3">
        <i class="bi bi-qr-code-scan fs-1 text-emerald-600 d-block mb-2"></i>
        <h6 class="fw-bold text-slate-900 fs-7 mb-1">Ready for Next Badge Scan</h6>
        <p class="fs-8 text-muted mb-0">Scan any badge QR code or type code below. Event & service details auto-resolve instant.</p>
      </div>

      <!-- 5. Collapsible Camera & Code Input Drawer -->
      <div class="border-top pt-2 mt-2">
        <div class="d-flex align-items-center justify-content-between mb-2">
          <button
            class="btn btn-link text-slate-700 btn-sm text-decoration-none p-0 fw-bold fs-8"
            @click="showScannerDrawer = !showScannerDrawer"
          >
            <i :class="['bi me-1', showScannerDrawer ? 'bi-chevron-up' : 'bi-camera-fill']"></i>
            {{ showScannerDrawer ? 'Hide Camera / Code Entry' : 'Open Camera / Code Entry' }}
          </button>
        </div>

        <div v-if="showScannerDrawer" class="scanner-drawer-content p-2 bg-white rounded-3 border">
          <div class="btn-group btn-group-sm w-100 rounded-pill border p-0.5 bg-light mb-2">
            <button
              class="btn btn-xs rounded-pill py-1 fw-bold fs-8"
              :class="activeTab === 'manual' ? 'btn-emerald shadow-2xs' : 'btn-light text-muted'"
              @click="switchTab('manual')"
            >
              <i class="bi bi-keyboard-fill me-1"></i> Manual Entry
            </button>
            <button
              class="btn btn-xs rounded-pill py-1 fw-bold fs-8"
              :class="activeTab === 'camera' ? 'btn-emerald shadow-2xs' : 'btn-light text-muted'"
              @click="switchTab('camera')"
            >
              <i class="bi bi-camera-fill me-1"></i> Camera Scanner
            </button>
          </div>

          <form v-if="activeTab === 'manual'" @submit.prevent="handleManualSubmit">
            <div class="input-group input-group-sm">
              <input
                v-model="manualCode"
                type="text"
                class="form-control rounded-start-3 py-1.5 fs-7"
                placeholder="Enter badge code (e.g. REG-1-TEST001)"
                required
              />
              <button type="submit" class="btn btn-emerald px-3 fw-bold fs-8">
                Scan Code
              </button>
            </div>
          </form>

          <div v-else class="camera-drawer-viewport rounded-3 border bg-slate-900 p-2 text-center">
            <div id="global-qr-reader" style="width: 100%;"></div>
            <button
              v-if="!scanningActive"
              class="btn btn-emerald btn-sm rounded-pill fw-bold fs-8 px-3 py-1 mt-1"
              @click="startScanner"
            >
              <i class="bi bi-play-fill me-1"></i> Start Camera
            </button>
          </div>
        </div>
      </div>
    </div>
  </CommonModal>
</template>

<script setup lang="ts">
import { Html5Qrcode } from 'html5-qrcode';
import { dbStore } from '~/utils/db';
import { isActiveOrScheduledEvent } from '~/utils/eventDate';
import { formatServiceTimeRange } from '~/utils/timeFormat';

const props = defineProps<{
  modelValue: boolean;
  initialCode?: string;
  autoClaim?: boolean;
}>();

const emit = defineEmits(['update:modelValue', 'close', 'scanned']);

const { executeOrQueue } = useOfflineSync();
const push = usePush();
const token = useCookie<string | null>('token');

const eventsList = ref<any[]>([]);
const servicesList = ref<any[]>([]);
const selectedEventId = ref<number | string>('');
const showScannerDrawer = ref(false);
const activeTab = ref<'manual' | 'camera'>('manual');
const shouldAutoClaim = computed(() => props.autoClaim !== false);

const scanningActive = ref(false);
let html5QrcodeScanner: Html5Qrcode | null = null;

const manualCode = ref('');
const scanFeedback = ref<{ type: 'success' | 'error'; message: string } | null>(null);
const scannedAttendee = ref<any>(null);
const scannedQrCode = ref<string>('');

const cachedRegistrationsMap = ref<Map<string, any>>(new Map());
const recentLocalScans = ref<any[]>([]);

const activeEventsList = computed(() => {
  return eventsList.value.filter(isActiveOrScheduledEvent);
});

const attendeeTodayLogs = computed(() => {
  if (!scannedAttendee.value && !scannedQrCode.value) return [];
  const qr = scannedAttendee.value?.qr_code || scannedQrCode.value;
  return recentLocalScans.value.filter((l: any) => l.qr_code === qr);
});

const isAttendeeCheckedIn = computed(() => {
  const logsToday = attendeeTodayLogs.value;
  if (logsToday.length === 0) return false;
  const latestScan = logsToday[0];
  if (latestScan?.scan_type === 'check_out') return false;
  return logsToday.some((l: any) => l.scan_type === 'check_in' || l.scan_type === 'service');
});

function formatAttendeeDisplayName(attendee: any): string {
  if (!attendee) return 'Delegate';
  const reg = attendee.registration || attendee;
  const fn = String(reg.first_name || '').trim();
  const ln = String(reg.last_name || '').trim();
  const cleanFn = (fn.toLowerCase() === 'null' || fn.toLowerCase() === 'undefined') ? '' : fn;
  const cleanLn = (ln.toLowerCase() === 'null' || ln.toLowerCase() === 'undefined') ? '' : ln;

  const fullName = `${cleanFn} ${cleanLn}`.trim();
  if (fullName) return fullName;

  const phone = String(reg.phone || attendee.phone || '').trim();
  if (phone && phone.toLowerCase() !== 'null' && phone.toLowerCase() !== 'undefined') {
    return `Phone: ${phone}`;
  }

  const qr = String(attendee.qr_code || reg.qr_code || '').trim();
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

function parseTimeToMinutes(timeStr: string): number | null {
  if (!timeStr) return null;
  const str = String(timeStr).trim();

  // Match 12-hour format e.g. "08:30 PM" or "8:30pm"
  const match12 = str.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const ampm = match12[3].toLowerCase();
    if (ampm === 'pm' && hours < 12) hours += 12;
    if (ampm === 'am' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  // Match 24-hour format e.g. "20:30:00" or "20:30"
  const match24 = str.match(/^(\d{1,2}):(\d{2})(?::\d{2})?/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    return hours * 60 + minutes;
  }

  return null;
}

function isServiceActiveRightNow(srv: any): boolean {
  if (!srv?.start_time || !srv?.end_time) return true;
  const startMins = parseTimeToMinutes(srv.start_time);
  const endMins = parseTimeToMinutes(srv.end_time);
  if (startMins === null || endMins === null) return true;

  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();
  return currentMins >= startMins && currentMins <= endMins;
}

function indexRegistrations(regList: any[]) {
  const map = new Map<string, any>();
  for (const r of regList) {
    if (!r) continue;
    if (r.qr_code) map.set(String(r.qr_code).trim(), r);
    if (r.id) {
      map.set(String(r.id), r);
      if (r.event_id) map.set(`REG-${r.event_id}-${r.id}`, r);
    }
  }
  cachedRegistrationsMap.value = map;
}

async function preloadRegistrations(eventId: number | string) {
  if (!eventId) return;
  try {
    const cached = await dbStore.getCachedRegistrations(eventId);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      indexRegistrations(cached);
      return;
    }
    if (import.meta.client && navigator.onLine) {
      const res = await $fetch<any>(`/api/registrations?event_id=${eventId}`, {
        headers: { ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}), Accept: 'application/json' },
      });
      const freshList = Array.isArray(res?.data?.registrations) ? res.data.registrations : (Array.isArray(res?.data) ? res.data : []);
      if (freshList.length > 0) {
        indexRegistrations(freshList);
        await dbStore.cacheRegistrations(eventId, freshList);
      }
    }
  } catch (err) {
    console.warn('Quick scanner preload notice:', err);
  }
}

async function fetchServices() {
  if (!selectedEventId.value) {
    servicesList.value = [];
    return;
  }
  try {
    const url = `/api/event-services?event_id=${selectedEventId.value}`;
    const res = await cachedFetch<any>(url);
    const rawList = Array.isArray(res?.data?.event_services)
      ? res.data.event_services
      : (Array.isArray(res?.data) ? res.data : []);

    servicesList.value = rawList
      .map((es: any) => {
        if (es.service) return es.service;
        return {
          id: es.service_id || es.id,
          name: es.name || `Service #${es.service_id || es.id}`,
          start_time: es.start_time,
          end_time: es.end_time,
          requires_scan: es.requires_scan,
        };
      })
      .filter((s: any) => s && s.id);
  } catch (err) {
    servicesList.value = [];
  }
}

const unclaimedServices = computed(() => {
  if (!scannedAttendee.value) return servicesList.value;
  const qr = scannedAttendee.value?.qr_code || scannedQrCode.value;
  return servicesList.value.filter((srv: any) => {
    const alreadyClaimed = recentLocalScans.value.some((l: any) => {
      return l.qr_code === qr && l.service_id === Number(srv.id);
    });
    return !alreadyClaimed;
  });
});

const activeCurrentService = computed(() => {
  if (unclaimedServices.value.length === 0) return null;
  const timeMatched = unclaimedServices.value.find((srv: any) => isServiceActiveRightNow(srv));
  return timeMatched || null;
});

const areAllServicesClaimedToday = computed(() => {
  if (servicesList.value.length === 0) return false;
  const qr = scannedAttendee.value?.qr_code || scannedQrCode.value;
  return servicesList.value.every((srv: any) => {
    return recentLocalScans.value.some((l: any) => l.qr_code === qr && l.service_id === Number(srv.id));
  });
});

watch(selectedEventId, async (newEvId) => {
  if (newEvId) {
    await preloadRegistrations(newEvId);
    await fetchServices();
  }
});

async function findAttendeeByQrCode(qrCode: string): Promise<any> {
  const cleanCode = qrCode.trim();
  const prefixMatch = cleanCode.match(/^REG-(\d+)-/i);
  if (prefixMatch && prefixMatch[1]) {
    const matchedEventId = Number(prefixMatch[1]);
    if (Number(selectedEventId.value) !== matchedEventId) selectedEventId.value = matchedEventId;
  }

  let found = cachedRegistrationsMap.value.get(cleanCode);
  if (!found) {
    const rawId = cleanCode.split('-').pop();
    if (rawId) found = cachedRegistrationsMap.value.get(rawId);
  }

  if (found) {
    if (found.event_id && Number(selectedEventId.value) !== Number(found.event_id)) {
      selectedEventId.value = Number(found.event_id);
    }
    return found;
  }
  return null;
}

async function fetchLogsForAttendee(qrCode: string) {
  if (!selectedEventId.value || !qrCode) return;
  try {
    const res = await cachedFetch<any>(`/api/scannings?event_id=${selectedEventId.value}`);
    const allLogs = Array.isArray(res?.data?.scannings) ? res.data.scannings : (Array.isArray(res?.data) ? res.data : []);
    const attendeeLogs = allLogs.filter((l: any) => {
      const logQr = l.qr_code || l.registration?.qr_code || '';
      return logQr === qrCode;
    });
    if (attendeeLogs.length > 0) {
      const existingScanTypes = attendeeLogs.map((l: any) => ({
        qr_code: qrCode,
        scan_type: l.scan_type || (l.service_id ? 'service' : 'check_in'),
        service_id: l.service_id ? Number(l.service_id) : null,
        created_at: l.created_at,
      }));
      // Merge with local scans avoiding duplicate entries
      const merged = [...recentLocalScans.value];
      for (const item of existingScanTypes) {
        if (!merged.some(m => m.qr_code === item.qr_code && m.scan_type === item.scan_type && m.service_id === item.service_id)) {
          merged.push(item);
        }
      }
      recentLocalScans.value = merged;
    }
  } catch (e) {
    console.warn('Logs fetch notice in scanner:', e);
  }
}

async function processQuickScan(rawCode: string) {
  let qrCode = rawCode.trim();
  if (qrCode.includes('?code=')) {
    const urlParts = qrCode.split('?code=');
    if (urlParts[1]) qrCode = decodeURIComponent(urlParts[1].split('&')[0]);
  }

  scannedQrCode.value = qrCode;
  const matched = await findAttendeeByQrCode(qrCode);
  scannedAttendee.value = matched || { first_name: 'Registered', last_name: 'Delegate', qr_code: qrCode };

  await fetchLogsForAttendee(qrCode);

  if (shouldAutoClaim.value) {
    if (activeCurrentService.value) {
      await confirmInstantClaim('service', activeCurrentService.value.id);
    } else if (!isAttendeeCheckedIn.value) {
      await confirmInstantClaim('check_in');
    }
  }
}

async function confirmInstantClaim(type: 'check_in' | 'service' | 'check_out', serviceId?: number | string) {
  if (!selectedEventId.value) return;
  const qr = scannedQrCode.value || scannedAttendee.value?.qr_code;
  if (!qr) return;

  const attendee = scannedAttendee.value;

  // Auto record entry check-in if delegate not checked in yet
  if (type === 'check_in' && isAttendeeCheckedIn.value) {
    push.info({
      title: 'Already Checked In',
      message: `${formatAttendeeDisplayName(attendee)} has already checked in today!`,
    });
    scanFeedback.value = {
      type: 'success',
      message: `${formatAttendeeDisplayName(attendee)} is already checked in today!`,
    };
    return;
  }

  if (type === 'service' && !isAttendeeCheckedIn.value) {
    recentLocalScans.value = [
      { qr_code: qr, scan_type: 'check_in', event_id: selectedEventId.value, created_at: new Date().toISOString() },
      ...recentLocalScans.value,
    ];
    executeOrQueue({
      url: `/api/events/${selectedEventId.value}/scannings`,
      method: 'POST',
      body: { qr_code: qr, scan_type: 'check_in', event_id: Number(selectedEventId.value) },
      label: `Auto Check-in - ${formatAttendeeDisplayName(attendee)}`,
    }).catch(() => {});
  }

  recentLocalScans.value = [
    { qr_code: qr, scan_type: type, service_id: serviceId ? Number(serviceId) : null, event_id: selectedEventId.value, created_at: new Date().toISOString() },
    ...recentLocalScans.value,
  ];

  const serviceObj = servicesList.value.find((s: any) => Number(s.id) === Number(serviceId));
  const serviceName = serviceObj?.name || 'Service';
  const scanLabel = type === 'check_out' ? 'Check-out' : (type === 'service' ? `${serviceName} Claimed` : 'Check-in Recorded');

  scanFeedback.value = {
    type: 'success',
    message: `${scanLabel} for ${formatAttendeeDisplayName(attendee)}`,
  };

  push.success({
    title: 'Instant Service Claimed',
    message: `${scanLabel} for ${formatAttendeeDisplayName(attendee)}`,
  });

  const bodyPayload: Record<string, any> = {
    qr_code: qr,
    scan_type: type === 'check_out' ? 'check_out' : 'check_in',
    event_id: Number(selectedEventId.value),
  };
  if (serviceId) {
    bodyPayload.service_id = Number(serviceId);
  }

  executeOrQueue({
    url: `/api/events/${selectedEventId.value}/scannings`,
    method: 'POST',
    body: bodyPayload,
    label: `${scanLabel} - ${formatAttendeeDisplayName(attendee)}`,
  }).catch((err) => console.warn('Background sync notice:', err));

  emit('scanned', { qr_code: qr, type, serviceId, attendee });
}

function handleManualSubmit() {
  if (manualCode.value.trim()) {
    processQuickScan(manualCode.value.trim());
    manualCode.value = '';
  }
}

function switchTab(tab: 'camera' | 'manual') {
  activeTab.value = tab;
  if (tab === 'camera') startScanner();
  else stopScanner();
}

async function startScanner() {
  if (!selectedEventId.value) return;
  scanFeedback.value = null;
  try {
    if (!html5QrcodeScanner) html5QrcodeScanner = new Html5Qrcode('global-qr-reader');
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

    await html5QrcodeScanner.start(
      cameraConfig,
      { fps: 10, qrbox: { width: 180, height: 180 } },
      async (decodedText) => {
        await processQuickScan(decodedText);
      },
      () => {}
    );
  } catch (err: any) {
    scanningActive.value = false;
    scanFeedback.value = { type: 'error', message: err?.message || 'Camera access error.' };
  }
}

async function stopScanner() {
  if (html5QrcodeScanner && scanningActive.value) {
    try {
      await html5QrcodeScanner.stop();
      html5QrcodeScanner.clear();
    } catch {
      // Fallback
    } finally {
      html5QrcodeScanner = null;
      scanningActive.value = false;
    }
  }
}

function handleClose() {
  stopScanner();
  emit('close');
}

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen) {
      scanFeedback.value = null;
      const initialCode = props.initialCode?.trim();
      if (initialCode) {
        let cleanCode = initialCode;
        if (cleanCode.includes('?code=')) {
          const urlParts = cleanCode.split('?code=');
          if (urlParts[1]) cleanCode = decodeURIComponent(urlParts[1].split('&')[0]);
        }
        const eventIdMatch = cleanCode.match(/^REG-(\d+)-/i);
        if (eventIdMatch?.[1]) selectedEventId.value = Number(eventIdMatch[1]);
      }
      if (eventsList.value.length === 0) {
        try {
          const res = await cachedFetch<any>('/api/events');
          eventsList.value = Array.isArray(res?.data?.events) ? res.data.events : (Array.isArray(res?.data) ? res.data : []);
          if (activeEventsList.value.length > 0 && !selectedEventId.value) {
            selectedEventId.value = activeEventsList.value[0].id;
          }
        } catch (e) {
          console.warn('Events load error in quick scanner:', e);
        }
      }
      if (selectedEventId.value) {
        await preloadRegistrations(selectedEventId.value);
        await fetchServices();
      }
      if (initialCode) await processQuickScan(initialCode);
    } else {
      stopScanner();
    }
  }
);

onBeforeUnmount(() => {
  stopScanner();
});
</script>

<style scoped>
.bg-emerald-50 { background-color: #ecfdf5; }
.text-emerald-700 { color: #047857; }
.border-emerald-200 { border-color: #a7f3d0 !important; }
.border-emerald-300 { border-color: #6ee7b7 !important; }
.text-emerald-600 { color: #059669; }
.bg-emerald-500 { background-color: #10b981; }

.btn-emerald {
  background-color: var(--green-500);
  color: #ffffff;
  border: none;
}
.btn-emerald:hover {
  background-color: var(--green-600);
  color: #ffffff;
}
.btn-xs {
  font-size: 0.725rem;
  padding: 0.2rem 0.6rem;
}
</style>
