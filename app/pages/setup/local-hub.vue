<template>
  <div class="local-hub-page container-fluid py-3 py-md-4">
    <!-- Page Header -->
    <div class="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4 pb-3 border-bottom">
      <div class="d-flex align-items-center gap-3">
        <div class="hub-icon-box rounded-3 p-3 text-white d-flex align-items-center justify-content-center shadow-2xs" style="background-color: #43766C;">
          <i class="bi bi-router-fill fs-3"></i>
        </div>
        <div>
          <h2 class="fs-4 fw-bold text-slate-900 mb-1">Local Event Hub & Router-Free Station</h2>
          <p class="fs-7 text-muted mb-0">Coordinate 10+ scanning tablets offline without internet using the laptop's Wi-Fi hotspot.</p>
        </div>
      </div>

      <div class="d-flex align-items-center gap-2">
        <button
          type="button"
          class="btn btn-outline-secondary btn-sm rounded-pill px-3 py-1.5 fs-8 fw-semibold"
          @click="refreshHubInfo"
        >
          <i class="bi bi-arrow-clockwise me-1" :class="{ 'spin-icon': refreshing }"></i> Refresh
        </button>

        <button
          type="button"
          class="btn btn-sm rounded-pill px-3 py-1.5 fs-8 fw-semibold text-white"
          style="background-color: #43766C;"
          @click="navigateTo('/scan')"
        >
          <i class="bi bi-qr-code-scan me-1"></i> Open Scanner
        </button>
      </div>
    </div>

    <!-- Status Overview Bar -->
    <div class="row g-3 mb-4">
      <div class="col-12 col-sm-6 col-lg-3">
        <div class="card border-0 shadow-2xs rounded-3 p-3 bg-white h-100">
          <span class="fs-8 text-uppercase fw-bold text-muted tracking-wider">Local Hub IP</span>
          <div class="d-flex align-items-center justify-content-between mt-1">
            <code class="fs-6 fw-bold text-slate-900">{{ hubInfo?.primary_ip || 'Detecting...' }}:3000</code>
            <span class="badge rounded-pill bg-success-subtle text-success border border-success-subtle px-2 py-1 fs-8">Active</span>
          </div>
          <span class="fs-8 text-muted mt-1">Tablets connect to this address</span>
        </div>
      </div>

      <div class="col-12 col-sm-6 col-lg-3">
        <div class="card border-0 shadow-2xs rounded-3 p-3 bg-white h-100">
          <span class="fs-8 text-uppercase fw-bold text-muted tracking-wider">Active Event</span>
          <div class="d-flex align-items-center justify-content-between mt-1">
            <h6 class="fs-6 fw-bold text-slate-900 mb-0 text-truncate">{{ hubInfo?.active_event_name || 'None Preloaded' }}</h6>
          </div>
          <span class="fs-8 text-muted mt-1">{{ preloadedAttendeesCount }} delegates preloaded</span>
        </div>
      </div>

      <div class="col-12 col-sm-6 col-lg-3">
        <div class="card border-0 shadow-2xs rounded-3 p-3 bg-white h-100">
          <span class="fs-8 text-uppercase fw-bold text-muted tracking-wider">Local Scans Recorded</span>
          <div class="d-flex align-items-center justify-content-between mt-1">
            <h4 class="fs-4 fw-extrabold text-slate-900 mb-0">{{ hubInfo?.total_local_scans || 0 }}</h4>
            <i class="bi bi-check2-all fs-4 text-emerald-600"></i>
          </div>
          <span class="fs-8 text-muted mt-1">Collected across all tablets</span>
        </div>
      </div>

      <div class="col-12 col-sm-6 col-lg-3">
        <div class="card border-0 shadow-2xs rounded-3 p-3 bg-white h-100">
          <span class="fs-8 text-uppercase fw-bold text-muted tracking-wider">Pending Cloud Upload</span>
          <div class="d-flex align-items-center justify-content-between mt-1">
            <h4 class="fs-4 fw-extrabold mb-0" :class="(hubInfo?.pending_cloud_sync_count || 0) > 0 ? 'text-warning-emphasis' : 'text-slate-900'">
              {{ hubInfo?.pending_cloud_sync_count || 0 }}
            </h4>
            <button
              v-if="(hubInfo?.pending_cloud_sync_count || 0) > 0"
              type="button"
              class="btn btn-sm btn-emerald rounded-pill px-2.5 py-0.5 fs-8 fw-bold"
              :disabled="isSyncingCloud"
              @click="syncAllScansToCloud"
            >
              <span v-if="isSyncingCloud" class="spinner-border spinner-border-sm me-1"></span>
              <i v-else class="bi bi-cloud-arrow-up-fill me-1"></i> Sync Now
            </button>
          </div>
          <span class="fs-8 text-muted mt-1">Awaiting sync to mwakasege.co.tz</span>
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="row g-4">
      <!-- Left Column: Step 1 (Pairing QR) & Step 2 (Preload) -->
      <div class="col-12 col-lg-5">
        <!-- Tablet Pairing QR Code Card -->
        <div class="card border-0 shadow-2xs rounded-3 bg-white p-3 p-sm-4 mb-4">
          <div class="d-flex align-items-center justify-content-between mb-3">
            <h5 class="fs-6 fw-bold text-slate-900 mb-0">
              <span class="badge rounded-circle text-white me-2 px-2 py-1 fs-8" style="background-color: #43766C;">1</span>
              Connect Tablets to Laptop Hotspot
            </h5>
            <span class="badge bg-light text-slate-700 border fs-8">No Router Needed</span>
          </div>

          <div class="alert alert-info py-2 px-3 fs-8 rounded-3 mb-3 d-flex align-items-start gap-2">
            <i class="bi bi-info-circle-fill text-info fs-6 mt-0.5"></i>
            <div>
              <strong>Turn on Laptop Hotspot:</strong> In Windows, press <kbd class="px-1 py-0.5 bg-dark text-white rounded fs-8">Win</kbd> + <kbd class="px-1 py-0.5 bg-dark text-white rounded fs-8">A</kbd> &gt; Click <strong>Mobile Hotspot</strong>. Connect the tablets to this Wi-Fi.
            </div>
          </div>

          <div class="text-center p-3 bg-light rounded-3 border mb-3">
            <canvas ref="qrCanvasRef" class="mx-auto shadow-2xs rounded-2 bg-white p-2" style="max-width: 220px; height: auto;"></canvas>
            <div class="mt-2">
              <span class="fs-8 text-muted d-block">Point tablet cameras at this QR code to open the scanner station:</span>
              <div class="input-group input-group-sm mt-2 max-w-sm mx-auto" style="max-width: 320px;">
                <input type="text" class="form-control form-control-sm fs-8 text-center fw-semibold" :value="tabletUrl" readonly />
                <button type="button" class="btn btn-outline-secondary btn-sm" @click="copyTabletUrl">
                  <i class="bi" :class="copied ? 'bi-check-lg text-success' : 'bi-clipboard'"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Preload Event Data Card -->
        <div class="card border-0 shadow-2xs rounded-3 bg-white p-3 p-sm-4">
          <div class="d-flex align-items-center justify-content-between mb-3">
            <h5 class="fs-6 fw-bold text-slate-900 mb-0">
              <span class="badge rounded-circle text-white me-2 px-2 py-1 fs-8" style="background-color: #43766C;">2</span>
              Preload Event for Offline Mode
            </h5>
            <span class="badge rounded-pill px-2.5 py-1 fs-8" style="background-color: #F8FAE5; color: #76453B; border: 1px solid #B19470;">
              Before Event
            </span>
          </div>

          <p class="fs-8 text-muted mb-3">
            Download all attendee badges, registrations, and services from the cloud to the laptop so scanning operates at 100% speed with zero internet at the venue.
          </p>

          <div class="mb-3">
            <label class="form-label fs-8 fw-semibold text-slate-700">Select Event to Preload:</label>
            <select v-model="selectedEventId" class="form-select form-select-sm fs-8 rounded-3">
              <option value="" disabled>Choose Event...</option>
              <option v-for="ev in eventsList" :key="ev.id" :value="Number(ev.id)">
                {{ ev.name || `Event #${ev.id}` }}
              </option>
            </select>
          </div>

          <button
            type="button"
            class="btn btn-emerald w-100 rounded-3 py-2 fw-bold fs-8 shadow-2xs d-flex align-items-center justify-content-center gap-2"
            :disabled="!selectedEventId || isPreloading"
            @click="preloadEventData"
          >
            <span v-if="isPreloading" class="spinner-border spinner-border-sm"></span>
            <i v-else class="bi bi-cloud-arrow-down-fill fs-6"></i>
            <span>{{ isPreloading ? 'Downloading Attendee Badges...' : 'Download Event for Offline Scanning' }}</span>
          </button>
        </div>
      </div>

      <!-- Right Column: Live Hub Scan Feed & Cloud Sync -->
      <div class="col-12 col-lg-7">
        <div class="card border-0 shadow-2xs rounded-3 bg-white p-3 p-sm-4 h-100 d-flex flex-column">
          <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3 pb-2 border-bottom">
            <div>
              <h5 class="fs-6 fw-bold text-slate-900 mb-0">
                <span class="badge rounded-circle text-white me-2 px-2 py-1 fs-8" style="background-color: #43766C;">3</span>
                Live Connected Tablet Scans Feed
              </h5>
              <span class="fs-8 text-muted">Streaming live from all tablets on the local hotspot</span>
            </div>

            <button
              type="button"
              class="btn btn-outline-primary btn-sm rounded-pill px-3 py-1 fs-8 fw-semibold shadow-2xs d-flex align-items-center gap-1.5"
              :disabled="isSyncingCloud || (hubInfo?.pending_cloud_sync_count || 0) === 0"
              @click="syncAllScansToCloud"
            >
              <span v-if="isSyncingCloud" class="spinner-border spinner-border-sm"></span>
              <i v-else class="bi bi-cloud-arrow-up-fill text-primary"></i>
              <span>Upload {{ hubInfo?.pending_cloud_sync_count || 0 }} Scans to Cloud</span>
            </button>
          </div>

          <!-- Live Scan Table -->
          <div class="table-responsive flex-grow-1" style="max-height: 480px; overflow-y: auto;">
            <table class="table table-hover align-middle mb-0 fs-8">
              <thead class="table-light sticky-top">
                <tr>
                  <th>Time</th>
                  <th>Attendee</th>
                  <th>QR Code</th>
                  <th>Type</th>
                  <th>Sync Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="scan in liveScans" :key="scan.id">
                  <td class="text-muted text-nowrap">{{ formatTime(scan.created_at) }}</td>
                  <td>
                    <span class="fw-bold text-slate-900 d-block text-truncate" style="max-width: 180px;">
                      {{ formatAttendeeName(scan) }}
                    </span>
                  </td>
                  <td>
                    <code class="px-1.5 py-0.5 bg-light rounded text-slate-800">{{ scan.qr_code }}</code>
                  </td>
                  <td>
                    <span
                      class="badge rounded-pill border px-2 py-0.5 fs-9"
                      :class="scan.scan_type === 'check_out' ? 'bg-danger-subtle text-danger' : (scan.service_id ? 'bg-purple-subtle text-purple-700' : 'bg-success-subtle text-success')"
                    >
                      {{ scan.scan_type === 'check_out' ? 'Check-out' : (scan.service_id ? 'Service' : 'Check-in') }}
                    </span>
                  </td>
                  <td>
                    <span v-if="scan.synced_to_cloud" class="badge bg-success-subtle text-success border border-success-subtle rounded-pill fs-9">
                      <i class="bi bi-cloud-check-fill me-1"></i> Synced
                    </span>
                    <span v-else class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-pill fs-9">
                      <i class="bi bi-hdd-fill me-1"></i> Local Only
                    </span>
                  </td>
                </tr>
                <tr v-if="liveScans.length === 0">
                  <td colspan="5" class="text-center py-5 text-muted">
                    <i class="bi bi-qr-code-scan fs-2 d-block mb-2 text-slate-400"></i>
                    No scans recorded on Local Hub yet. Connect tablets to start scanning.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import QRCode from 'qrcode';
import { cachedFetch } from '~/utils/cachedFetch';

const push = usePush();
const token = useCookie('token');

const hubInfo = ref<any>(null);
const eventsList = ref<any[]>([]);
const selectedEventId = ref<number | ''>('');
const liveScans = ref<any[]>([]);

const refreshing = ref(false);
const isPreloading = ref(false);
const isSyncingCloud = ref(false);
const copied = ref(false);

const qrCanvasRef = ref<HTMLCanvasElement | null>(null);
let pollInterval: any = null;

const tabletUrl = computed(() => {
  const ip = hubInfo.value?.primary_ip || 'localhost';
  return `http://${ip}:3000/scan`;
});

const preloadedAttendeesCount = computed(() => {
  if (!hubInfo.value?.preloaded_events) return 0;
  const active = hubInfo.value.preloaded_events.find((e: any) => e.event_id === hubInfo.value.active_event_id);
  return active?.attendees_count || 0;
});

async function refreshHubInfo() {
  refreshing.value = true;
  try {
    const [infoRes, scansRes] = await Promise.all([
      $fetch<any>('/api/hub/info').catch(() => null),
      $fetch<any>('/api/hub/scans').catch(() => null),
    ]);

    if (infoRes?.data) {
      hubInfo.value = infoRes.data;
      if (hubInfo.value.active_event_id && !selectedEventId.value) {
        selectedEventId.value = hubInfo.value.active_event_id;
      }
    }

    if (scansRes?.data?.scannings) {
      liveScans.value = scansRes.data.scannings;
    }

    await nextTick();
    renderQrCode();
  } catch (err) {
    console.error('Failed to refresh Hub info:', err);
  } finally {
    refreshing.value = false;
  }
}

async function renderQrCode() {
  if (!qrCanvasRef.value) return;
  try {
    await QRCode.toCanvas(qrCanvasRef.value, tabletUrl.value, {
      width: 200,
      margin: 1,
      color: {
        dark: '#1e293b',
        light: '#ffffff',
      },
    });
  } catch (e) {
    console.error('Failed to generate pairing QR:', e);
  }
}

async function copyTabletUrl() {
  try {
    await navigator.clipboard.writeText(tabletUrl.value);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
    push.success({ title: 'Copied!', message: 'Tablet Station URL copied to clipboard.' });
  } catch {}
}

async function loadEvents() {
  try {
    const res = await cachedFetch<any>('/api/events');
    const evList = Array.isArray(res?.data?.events) ? res.data.events : (Array.isArray(res?.data) ? res.data : []);
    eventsList.value = evList;
    if (evList.length > 0 && !selectedEventId.value) {
      selectedEventId.value = Number(evList[0].id);
    }
  } catch {}
}

async function preloadEventData() {
  if (!selectedEventId.value) return;
  isPreloading.value = true;
  try {
    const res = await $fetch<any>('/api/hub/preload', {
      method: 'POST',
      body: { event_id: selectedEventId.value },
      headers: { ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}) },
    });

    if (res?.success) {
      push.success({
        title: 'Event Preloaded Successfully',
        message: res.message || 'All attendee badges and services are now saved on this laptop.',
      });
      await refreshHubInfo();
    }
  } catch (err: any) {
    push.error({
      title: 'Preload Failed',
      message: err?.data?.message || err?.message || 'Could not download event data from cloud.',
    });
  } finally {
    isPreloading.value = false;
  }
}

async function syncAllScansToCloud() {
  isSyncingCloud.value = true;
  try {
    const res = await $fetch<any>('/api/hub/sync-to-cloud', {
      method: 'POST',
      body: { event_id: selectedEventId.value || undefined },
      headers: { ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}) },
    });

    if (res?.success) {
      push.success({
        title: 'Cloud Sync Complete',
        message: res.message || `Uploaded ${res.synced_count} scans to mwakasege.co.tz.`,
      });
      await refreshHubInfo();
    }
  } catch (err: any) {
    push.error({
      title: 'Cloud Sync Error',
      message: err?.data?.message || err?.message || 'Failed to upload scans to cloud server.',
    });
  } finally {
    isSyncingCloud.value = false;
  }
}

function formatTime(isoStr?: string): string {
  if (!isoStr) return '—';
  try {
    return new Date(isoStr).toLocaleTimeString();
  } catch {
    return isoStr;
  }
}

function formatAttendeeName(scan: any): string {
  if (scan.registration) {
    const fn = scan.registration.first_name || '';
    const ln = scan.registration.last_name || '';
    return `${fn} ${ln}`.trim() || 'Delegate';
  }
  return scan.qr_code || 'Delegate';
}

onMounted(async () => {
  await Promise.all([refreshHubInfo(), loadEvents()]);
  pollInterval = setInterval(refreshHubInfo, 4000);
});

onBeforeUnmount(() => {
  if (pollInterval) clearInterval(pollInterval);
});
</script>

<style scoped>
.spin-icon {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}
</style>
