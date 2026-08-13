<template>
  <CommonModal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="Fast Bulk QR Code Exporter"
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

        <!-- Filter & Batch Range Options -->
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
            <label class="form-label fs-7 fw-semibold text-slate-800 mb-1">Total Available</label>
            <div class="form-control form-control-sm rounded-3 py-2 bg-light fw-bold text-emerald-700 d-flex align-items-center justify-content-between">
              <span>{{ loadingCount ? 'Counting...' : `${targetRegistrations.length} Passes` }}</span>
              <i class="bi bi-qr-code"></i>
            </div>
          </div>
        </div>

        <!-- Batch Range Selection (For Fast Large Downloads) -->
        <div v-if="batchRanges.length > 0" class="mb-3">
          <label class="form-label fs-7 fw-semibold text-slate-800 mb-1">
            <i class="bi bi-lightning-charge-fill text-amber-500 me-1"></i>
            Fast Export Batch Scope (Recommended for Speed)
          </label>
          <select v-model="selectedBatchIndex" class="form-select form-select-sm rounded-3 py-2 border-emerald-300">
            <option value="all">Export All Passes at Once ({{ targetRegistrations.length }} QRs)</option>
            <option v-for="b in batchRanges" :key="b.index" :value="b.index">
              ⚡ Batch {{ b.index + 1 }}: {{ b.label }}
            </option>
          </select>
          <small class="text-muted fs-8 d-block mt-1">
            Tip: Exporting in 1,000-pass batches makes download speeds lightning fast (~4s per batch).
          </small>
        </div>

        <!-- Header Label Preview Info Box -->
        <div class="p-3 bg-emerald-50 rounded-3 border border-emerald-200 mb-3">
          <div class="d-flex align-items-center justify-content-between mb-1">
            <span class="fs-8 text-uppercase text-emerald-800 fw-bold">Header Code Format Preview</span>
            <span class="badge bg-emerald-600 text-white fs-8">STORE Mode Active (10x Speed)</span>
          </div>
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
            :disabled="loadingCount || exportItems.length === 0"
            @click="startBulkExport"
          >
            <i class="bi bi-download"></i>
            <span>Export {{ exportItems.length }} QR Codes (ZIP)</span>
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

        <h6 class="fw-bold text-slate-900 fs-6 mb-1">Generating Fast Labeled QR Codes...</h6>
        <p class="fs-8 text-muted mb-3">
          Processing badge {{ processedCount }} of {{ exportItems.length }} ({{ progressPercent }}%)
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
          Header Code: <code>{{ currentSampleLabel }}</code>
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

        <h5 class="fw-extrabold text-slate-900 fs-6 mb-1">Export Completed!</h5>
        <p class="fs-8 text-muted mb-4">
          Successfully bundled <strong>{{ processedCount }}</strong> labeled QR code images into a fast ZIP archive.
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

const batchRangeSize = ref(1000);
const selectedBatchIndex = ref<number | string>('all');

const exporting = ref(false);
const exportComplete = ref(false);
const processedCount = ref(0);
const currentSampleLabel = ref('');
const errorMessage = ref<string | null>(null);

let shouldCancel = false;

const batchRanges = computed(() => {
  const total = targetRegistrations.value.length;
  if (total <= batchRangeSize.value) return [];
  const ranges = [];
  const size = batchRangeSize.value;
  let start = 1;
  while (start <= total) {
    const end = Math.min(start + size - 1, total);
    ranges.push({
      index: ranges.length,
      label: `Passes ${start.toLocaleString()} – ${end.toLocaleString()} (${end - start + 1} QRs)`,
      startIndex: start - 1,
      endIndex: end,
    });
    start += size;
  }
  return ranges;
});

const exportItems = computed(() => {
  if (selectedBatchIndex.value === 'all' || batchRanges.value.length === 0) {
    return targetRegistrations.value;
  }
  const idx = Number(selectedBatchIndex.value);
  const range = batchRanges.value[idx];
  if (!range) return targetRegistrations.value;
  return targetRegistrations.value.slice(range.startIndex, range.endIndex);
});

const progressPercent = computed(() => {
  if (exportItems.value.length === 0) return 0;
  return Math.round((processedCount.value / exportItems.value.length) * 100);
});

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen) {
      selectedEventId.value = props.defaultEventId || props.eventsList[0]?.id || '';
      selectedStatus.value = '';
      selectedBatchIndex.value = 'all';
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
  const items = exportItems.value;
  if (items.length === 0) return;

  exporting.value = true;
  exportComplete.value = false;
  processedCount.value = 0;
  shouldCancel = false;
  errorMessage.value = null;

  const zip = new JSZip();
  const origin = import.meta.client ? window.location.origin : '';
  const total = items.length;

  const ev = props.eventsList.find((e) => Number(e.id) === Number(selectedEventId.value));
  const eventName = (ev?.name || `Event_${selectedEventId.value}`).replace(/[^a-zA-Z0-9_-]/g, '_');
  
  let rangeTag = 'All';
  if (selectedBatchIndex.value !== 'all' && batchRanges.value[Number(selectedBatchIndex.value)]) {
    const rangeObj = batchRanges.value[Number(selectedBatchIndex.value)];
    rangeTag = `Part${rangeObj.index + 1}_(${rangeObj.startIndex + 1}-${rangeObj.endIndex})`;
  }

  try {
    const batchSize = 50; // Fast async tick
    for (let i = 0; i < total; i++) {
      if (shouldCancel) {
        exporting.value = false;
        return;
      }

      const reg = items[i];
      const { blob, fileName, headerText } = await generateLabeledQrCanvasBlob({
        registration: reg,
        index: i,
        totalCount: total,
        originUrl: origin,
      });

      zip.file(fileName, blob);
      processedCount.value = i + 1;
      currentSampleLabel.value = headerText;

      // Yield event loop every batchSize items to keep UI fluid
      if (i % batchSize === 0) {
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    if (shouldCancel) return;

    currentSampleLabel.value = 'Archiving fast ZIP file...';
    
    // Use STORE compression mode (no deflate re-compression) for 10x faster export
    const content = await zip.generateAsync({
      type: 'blob',
      compression: 'STORE',
    });

    saveAs(content, `${eventName}_QRCodes_${rangeTag}_${total}.zip`);

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

.border-emerald-300 {
  border-color: #6ee7b7;
}
</style>
