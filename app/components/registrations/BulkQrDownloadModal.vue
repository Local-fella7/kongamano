<template>
  <CommonModal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="Bulk QR Code ZIP Exporter"
    icon="bi-file-earmark-zip-fill"
    size="md"
    @close="cancelExport"
  >
    <div class="p-1">
      <div v-if="!exporting && !exportComplete">
        <!-- Target Event Selection -->
        <div class="mb-3">
          <label class="form-label required fs-7 fw-semibold text-slate-800 mb-1">Target Event</label>
          <select
            v-model.number="selectedEventId"
            class="form-select form-select-sm rounded-3 py-2"
            :disabled="loadingCount"
            @change="fetchEventRegistrationsCount"
          >
            <option value="" disabled>Select event to export QR codes...</option>
            <option v-for="ev in eventsList" :key="ev.id" :value="ev.id">{{ ev.name }}</option>
          </select>
        </div>

        <!-- Filter / Target Status Selection -->
        <div class="row g-3 mb-3">
          <div class="col-12 col-sm-6">
            <label class="form-label fs-7 fw-semibold text-slate-800 mb-1">Filter by Status</label>
            <select v-model="selectedStatus" class="form-select form-select-sm rounded-3 py-2" @change="fetchEventRegistrationsCount">
              <option value="">All Statuses</option>
              <option value="Confirmed">Confirmed Passes</option>
              <option value="Pending">Pending Passes</option>
            </select>
          </div>

          <div class="col-12 col-sm-6">
            <label class="form-label fs-7 fw-semibold text-slate-800 mb-1">Available Passes</label>
            <div class="form-control form-control-sm rounded-3 py-2 bg-light fw-bold text-emerald-700 d-flex align-items-center justify-content-between">
              <span>{{ loadingCount ? 'Counting...' : `${targetRegistrations.length} Passes` }}</span>
              <i class="bi bi-qr-code"></i>
            </div>
          </div>
        </div>

        <!-- Header Label Preview Info Box -->
        <div class="p-3 bg-emerald-50 rounded-3 border border-emerald-200 mb-3">
          <span class="fs-8 text-uppercase text-emerald-800 fw-bold d-block mb-1">Header Code Format Preview</span>
          <div class="fs-8 text-slate-700">
            <p class="mb-1">
              Every exported PNG badge features top header code: <code class="bg-white px-1.5 py-0.5 rounded text-emerald-800 border fw-bold">YYYY-[LocationLetter]-00001</code>
            </p>
            <ul class="mb-0 ps-3">
              <li>Dodoma: <code class="bg-white px-1.5 py-0.5 rounded text-emerald-800 border">2026-D-00001</code></li>
              <li>Dar es Salaam: <code class="bg-white px-1.5 py-0.5 rounded text-emerald-800 border">2026-D-00002</code></li>
              <li>Default (Mwombaji / Unspecified): <code class="bg-white px-1.5 py-0.5 rounded text-emerald-800 border">2026-M-00001</code> up to <code class="bg-white px-1.5 py-0.5 rounded text-emerald-800 border">2026-M-10000</code></li>
            </ul>
          </div>
        </div>

        <div v-if="errorMessage" class="alert alert-danger fs-8 py-2 px-3 mb-3">
          {{ errorMessage }}
        </div>

        <div class="d-flex justify-content-end gap-2 mt-4 border-top pt-3">
          <button
            type="button"
            class="btn btn-outline-secondary btn-sm rounded-3 px-3 py-2 fw-semibold fs-7"
            @click="$emit('update:modelValue', false)"
          >
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-emerald btn-sm rounded-3 px-4 py-2 fw-bold fs-7 shadow-2xs d-inline-flex align-items-center gap-2"
            :disabled="loadingCount || targetRegistrations.length === 0"
            @click="startBulkExport"
          >
            <i class="bi bi-download"></i>
            <span>Export {{ targetRegistrations.length }} QR Codes (ZIP)</span>
          </button>
        </div>
      </div>

      <!-- Export In Progress State -->
      <div v-else-if="exporting" class="py-4 text-center">
        <div class="mb-3">
          <div class="spinner-border text-emerald-600" role="status" style="width: 3rem; height: 3rem;">
            <span class="visually-hidden">Generating ZIP...</span>
          </div>
        </div>

        <h6 class="fw-bold text-slate-900 fs-6 mb-1">Generating Labeled QR Codes...</h6>
        <p class="fs-8 text-muted mb-3">
          Processing badge {{ processedCount }} of {{ targetRegistrations.length }} ({{ progressPercent }}%)
        </p>

        <!-- Progress Bar -->
        <div class="progress mb-3 rounded-pill" style="height: 12px; background-color: #e2e8f0;">
          <div
            class="progress-bar progress-bar-striped progress-bar-animated bg-emerald-500 rounded-pill"
            role="progressbar"
            :style="{ width: `${progressPercent}%` }"
          ></div>
        </div>

        <p class="fs-8 text-slate-600 mb-4">
          Header Label: <code>{{ currentSampleLabel }}</code>
        </p>

        <button
          type="button"
          class="btn btn-outline-danger btn-sm rounded-3 px-3 py-1.5 fs-8 fw-semibold"
          @click="cancelExport"
        >
          Cancel Export
        </button>
      </div>

      <!-- Export Complete State -->
      <div v-else-if="exportComplete" class="py-4 text-center">
        <div class="avatar-circle-lg bg-emerald-100 text-emerald-600 mx-auto mb-3 d-flex align-items-center justify-content-center" style="width: 56px; height: 56px; border-radius: 50%;">
          <i class="bi bi-check-circle-fill fs-2"></i>
        </div>

        <h5 class="fw-extrabold text-slate-900 fs-6 mb-1">Export Completed Successfully!</h5>
        <p class="fs-8 text-muted mb-4">
          Successfully bundled <strong>{{ processedCount }}</strong> labeled QR code images into a ZIP archive.
        </p>

        <button
          type="button"
          class="btn btn-emerald btn-md rounded-3 px-4 py-2 fw-bold fs-7 shadow-2xs"
          @click="resetAndClose"
        >
          Done
        </button>
      </div>
    </div>
  </CommonModal>
</template>

<script setup lang="ts">
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { generateLabeledQrCanvasBlob } from '~/utils/qrCanvas';

const props = defineProps<{
  modelValue: boolean;
  eventsList: any[];
  defaultEventId?: number | string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const token = useCookie<string | null>('token');

const selectedEventId = ref<number | string>('');
const selectedStatus = ref<string>('');
const targetRegistrations = ref<any[]>([]);
const loadingCount = ref(false);

const exporting = ref(false);
const exportComplete = ref(false);
const processedCount = ref(0);
const currentSampleLabel = ref('');
const errorMessage = ref<string | null>(null);

let shouldCancel = false;

const progressPercent = computed(() => {
  if (targetRegistrations.value.length === 0) return 0;
  return Math.round((processedCount.value / targetRegistrations.value.length) * 100);
});

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen) {
      selectedEventId.value = props.defaultEventId || props.eventsList[0]?.id || '';
      selectedStatus.value = '';
      exporting.value = false;
      exportComplete.value = false;
      processedCount.value = 0;
      errorMessage.value = null;
      shouldCancel = false;
      await fetchEventRegistrationsCount();
    }
  }
);

async function fetchEventRegistrationsCount() {
  if (!selectedEventId.value) {
    targetRegistrations.value = [];
    return;
  }
  loadingCount.value = true;
  errorMessage.value = null;

  try {
    const res = await $fetch<any>(`/api/registrations?event_id=${selectedEventId.value}`, {
      headers: { Authorization: `Bearer ${token.value}`, Accept: 'application/json' },
    });
    let list = Array.isArray(res?.data?.registrations) ? res.data.registrations : (Array.isArray(res?.data) ? res.data : []);
    
    if (selectedStatus.value) {
      list = list.filter((r: any) => r.status === selectedStatus.value);
    }

    // Sort ascending by ID (oldest first) so sequential numbers continue seamlessly (00001..01000, 01001..02000)
    list.sort((a: any, b: any) => Number(a.id) - Number(b.id));

    targetRegistrations.value = list;
  } catch (err: any) {
    console.error('Failed to fetch registrations for bulk export:', err);
    targetRegistrations.value = [];
    errorMessage.value = 'Failed to load registrations for the selected event.';
  } finally {
    loadingCount.value = false;
  }
}

async function startBulkExport() {
  if (targetRegistrations.value.length === 0) return;

  exporting.value = true;
  exportComplete.value = false;
  processedCount.value = 0;
  shouldCancel = false;
  errorMessage.value = null;

  const zip = new JSZip();
  const origin = import.meta.client ? window.location.origin : '';
  const total = targetRegistrations.value.length;

  const ev = props.eventsList.find(e => Number(e.id) === Number(selectedEventId.value));
  const eventName = (ev?.name || `Event_${selectedEventId.value}`).replace(/[^a-zA-Z0-9_-]/g, '_');

  try {
    const batchSize = 25; // Process in small async batches to keep browser fluid
    for (let i = 0; i < total; i++) {
      if (shouldCancel) {
        exporting.value = false;
        return;
      }

      const reg = targetRegistrations.value[i];
      const { blob, fileName, headerText } = await generateLabeledQrCanvasBlob({
        registration: reg,
        index: i,
        totalCount: total,
        originUrl: origin,
      });

      zip.file(fileName, blob);
      processedCount.value = i + 1;
      currentSampleLabel.value = headerText;

      // Yield event loop every batchSize items to prevent UI freezing
      if (i % batchSize === 0) {
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    if (shouldCancel) return;

    currentSampleLabel.value = 'Compressing ZIP file...';
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${eventName}_QRCodes_${total}.zip`);

    exporting.value = false;
    exportComplete.value = true;
  } catch (err: any) {
    console.error('Bulk QR export failed:', err);
    errorMessage.value = 'Failed during bulk QR generation or ZIP packaging.';
    exporting.value = false;
  }
}

function cancelExport() {
  shouldCancel = true;
  exporting.value = false;
}

function resetAndClose() {
  exportComplete.value = false;
  emit('update:modelValue', false);
}
</script>

<style scoped>
.btn-emerald {
  background-color: #10b981;
  color: #ffffff;
  border: none;
}

.btn-emerald:hover:not(:disabled) {
  background-color: #059669;
  color: #ffffff;
}

.bg-emerald-50 {
  background-color: #ecfdf5;
}

.bg-emerald-100 {
  background-color: #d1fae5;
}

.bg-emerald-500 {
  background-color: #10b981;
}

.text-emerald-600 {
  color: #059669;
}

.text-emerald-700 {
  color: #047857;
}

.text-emerald-800 {
  color: #065f46;
}

.border-emerald-200 {
  border-color: #a7f3d0;
}
</style>
