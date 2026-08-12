<template>
  <CommonModal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="Bulk QR Code Generation"
    icon="bi-qr-code-scan"
    size="md"
  >
    <form @submit.prevent="handleSubmit">
      <!-- Target Event -->
      <div class="mb-3">
        <label class="form-label required fs-7 fw-semibold text-slate-800 mb-1">Target Event</label>
        <select v-model.number="form.event_id" class="form-select form-select-sm rounded-3 py-2" required>
          <option value="" disabled>Select event for bulk QR generation...</option>
          <option v-for="ev in activeEventsList" :key="ev.id" :value="ev.id">{{ ev.name }}</option>
        </select>
      </div>

      <!-- Quantity & Payment Mode Row -->
      <div class="row g-3 mb-3">
        <div class="col-12 col-sm-6">
          <label class="form-label required fs-7 fw-semibold text-slate-800 mb-1">Quantity (Passes)</label>
          <input
            v-model.number="form.quantity"
            type="number"
            min="1"
            max="500"
            class="form-control form-control-sm rounded-3 py-2 fw-bold text-slate-900"
            placeholder="e.g. 500"
            required
          />
          <small class="text-muted fs-8 d-block mt-1">Backend limit: Max 500 passes per batch.</small>
        </div>

        <div class="col-12 col-sm-6">
          <label class="form-label required fs-7 fw-semibold text-slate-800 mb-1">Payment Mode</label>
          <select v-model.number="form.payment_mode_id" class="form-select form-select-sm rounded-3 py-2" required>
            <option value="" disabled>Select payment mode...</option>
            <option v-for="pm in paymentModesList" :key="pm.id" :value="pm.id">{{ pm.name }}</option>
          </select>
        </div>
      </div>

      <!-- Location Group (Region, District, Ward) -->
      <div class="p-3 bg-light rounded-3 border mb-3">
        <span class="fs-8 fw-bold text-uppercase text-muted d-block mb-2">Location Assignment (Optional)</span>
        
        <div class="mb-2">
          <label class="form-label fs-8 fw-semibold text-slate-700 mb-1">Region</label>
          <select v-model="form.region" class="form-select form-select-sm rounded-3" @change="handleRegionChange">
            <option value="">Select Region...</option>
            <option v-for="r in regionsList" :key="r" :value="r">{{ r }}</option>
          </select>
        </div>

        <div class="mb-2">
          <label class="form-label fs-8 fw-semibold text-slate-700 mb-1">District</label>
          <select v-model="form.district" class="form-select form-select-sm rounded-3" :disabled="!form.region" @change="handleDistrictChange">
            <option value="">Select District...</option>
            <option v-for="d in districtsList" :key="d" :value="d">{{ d }}</option>
          </select>
        </div>

        <div>
          <label class="form-label fs-8 fw-semibold text-slate-700 mb-1">Ward</label>
          <select v-model="form.ward" class="form-select form-select-sm rounded-3" :disabled="!form.district">
            <option value="">Select Ward...</option>
            <option v-for="w in wardsList" :key="w" :value="w">{{ w }}</option>
          </select>
        </div>
      </div>

      <div v-if="error" class="alert alert-danger fs-8 py-2 px-3 mb-3">{{ error }}</div>

      <div class="d-flex justify-content-end gap-2 mt-4 border-top pt-3">
        <button type="button" class="btn btn-outline-secondary btn-sm rounded-3 px-3 py-2 fw-semibold fs-7" @click="$emit('update:modelValue', false)">
          Cancel
        </button>
        <button type="submit" class="btn btn-emerald btn-sm rounded-3 px-4 py-2 fw-bold fs-7 shadow-2xs" :disabled="submitting">
          <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
          Generate {{ form.quantity || 0 }} Bulk QR Codes
        </button>
      </div>
    </form>
  </CommonModal>
</template>

<script setup lang="ts">
import { isActiveOrScheduledEvent } from '~/utils/eventDate';

const props = defineProps<{
  modelValue: boolean;
  eventsList: any[];
  defaultEventId?: number | string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'imported'): void;
  (e: 'openBulkQrDownload', eventId: number | string): void;
}>();

const { executeOrQueue } = useOfflineSync();
const push = usePush();

const activeEventsList = computed(() => {
  return (props.eventsList || []).filter(isActiveOrScheduledEvent);
});

const form = ref({
  event_id: '' as number | string,
  quantity: 10,
  payment_mode_id: '' as number | string,
  region: '',
  district: '',
  ward: '',
});

const paymentModesList = ref<any[]>([]);
const regionsList = ref<string[]>([]);
const districtsList = ref<string[]>([]);
const wardsList = ref<string[]>([]);

const submitting = ref(false);
const error = ref<string | null>(null);

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen) {
      form.value = {
        event_id: props.defaultEventId || props.eventsList[0]?.id || '',
        quantity: 10,
        payment_mode_id: '',
        region: '',
        district: '',
        ward: '',
      };
      districtsList.value = [];
      wardsList.value = [];
      error.value = null;
      await fetchPaymentModes();
      await fetchRegions();
    }
  }
);

function extractLocationList(res: any, key: string): string[] {
  const pluralKey = key.endsWith('y') ? `${key.slice(0, -1)}ies` : `${key}s`;
  const raw = res?.data?.[pluralKey] ?? res?.data?.[key] ?? (Array.isArray(res?.data) ? res.data : null) ?? res?.[pluralKey] ?? res?.[key] ?? (Array.isArray(res) ? res : []);
  if (!Array.isArray(raw)) return [];
  return raw.map((item: any) => {
    if (typeof item === 'string') return item;
    if (typeof item === 'object' && item !== null) {
      return item.name || item.title || item[key] || Object.values(item)[0] || String(item);
    }
    return String(item);
  }).filter(Boolean);
}

async function fetchPaymentModes() {
  try {
    const res = await cachedFetch<any>('/api/payment-modes');
    paymentModesList.value = Array.isArray(res?.data?.payment_modes)
      ? res.data.payment_modes
      : (Array.isArray(res?.data) ? res.data : []);
    if (paymentModesList.value.length > 0 && !form.value.payment_mode_id) {
      form.value.payment_mode_id = paymentModesList.value[0].id;
    }
  } catch (err) {
    console.error('Failed to fetch payment modes:', err);
  }
}

async function fetchRegions() {
  try {
    const res = await cachedFetch<any>('/api/registrations/tanzania-locations');
    regionsList.value = extractLocationList(res, 'region');
  } catch (err) {
    console.error('Failed to fetch regions for bulk import:', err);
  }
}

async function handleRegionChange() {
  form.value.district = '';
  form.value.ward = '';
  districtsList.value = [];
  wardsList.value = [];
  if (!form.value.region) return;
  try {
    const res = await cachedFetch<any>(`/api/registrations/tanzania-locations?region=${encodeURIComponent(form.value.region)}`);
    districtsList.value = extractLocationList(res, 'district');
  } catch (err) {
    console.error('Failed to fetch districts:', err);
  }
}

async function handleDistrictChange() {
  form.value.ward = '';
  wardsList.value = [];
  if (!form.value.district || !form.value.region) return;
  try {
    const res = await cachedFetch<any>(`/api/registrations/tanzania-locations?region=${encodeURIComponent(form.value.region)}&district=${encodeURIComponent(form.value.district)}`);
    wardsList.value = extractLocationList(res, 'ward');
  } catch (err) {
    console.error('Failed to fetch wards:', err);
  }
}

async function handleSubmit() {
  if (!form.value.event_id) {
    error.value = 'Please select a target event.';
    return;
  }
  if (!form.value.payment_mode_id) {
    error.value = 'Please select a payment mode.';
    return;
  }
  if (!form.value.quantity || form.value.quantity < 1) {
    error.value = 'Please enter a valid quantity (at least 1).';
    return;
  }

  submitting.value = true;
  error.value = null;

  try {
    const payload = {
      event_id: Number(form.value.event_id),
      quantity: Number(form.value.quantity),
      payment_mode_id: Number(form.value.payment_mode_id),
      region: form.value.region || undefined,
      district: form.value.district || undefined,
      ward: form.value.ward || undefined,
    };

    const res = await executeOrQueue({
      url: '/api/bulk-qrcodes',
      method: 'POST',
      body: payload,
      label: `Bulk Generate ${payload.quantity} QR Codes`,
    });

    if (res.queued) {
      push.success({ title: 'Queued', message: 'Bulk QR code generation queued for sync.' });
    } else {
      push.success({ title: 'Success', message: `Successfully generated ${payload.quantity} bulk QR codes.` });
    }

    emit('update:modelValue', false);
    emit('imported');
    emit('openBulkQrDownload', payload.event_id);
  } catch (err: any) {
    console.error('Bulk QR generation error:', err);
    const validationErrors = err?.data?.errors;
    if (validationErrors && typeof validationErrors === 'object') {
      const messages = Object.values(validationErrors).flat().join(' ');
      error.value = `Validation failed: ${messages}`;
    } else {
      error.value = err?.data?.message || err?.message || 'Failed to generate bulk QR codes.';
    }
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.btn-emerald {
  background-color: var(--green-500, #10b981);
  color: #ffffff;
  border: none;
}

.btn-emerald:hover:not(:disabled) {
  background-color: var(--green-600, #059669);
  color: #ffffff;
}
</style>
