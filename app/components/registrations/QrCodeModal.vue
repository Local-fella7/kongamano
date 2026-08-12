<template>
  <CommonModal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="Registration QR Code"
    icon="bi-qr-code-scan"
    size="sm"
  >
    <div class="text-center py-2">
      <div v-if="loading" class="py-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading QR...</span>
        </div>
        <p class="fs-8 text-muted mt-2">Generating QR code...</p>
      </div>

      <div v-else-if="error" class="alert alert-danger fs-8 py-2 px-3 mb-0" role="alert">
        {{ error }}
      </div>

      <div v-else-if="qrDataUrl" class="d-flex flex-column align-items-center">
        <div class="qr-container p-3 bg-white rounded-3 border shadow-2xs mb-3">
          <img :src="qrDataUrl" alt="QR Code" class="img-fluid" style="width: 180px; height: 180px;" />
        </div>
        <h6 class="fw-bold text-slate-900 mb-1 fs-7">
          {{ registration?.first_name }} {{ registration?.last_name }}
        </h6>
        <p class="fs-8 text-muted mb-3">
          ID: {{ registration?.id }} • {{ registration?.status || 'Pending' }}
        </p>

        <a
          :href="qrDataUrl"
          :download="`QR_${registration?.first_name || 'Registration'}_${registration?.id || ''}.png`"
          class="btn btn-outline-primary btn-sm rounded-3 px-3 py-1.5 fs-8 fw-semibold"
        >
          <i class="bi bi-download me-1"></i> Download QR
        </a>
      </div>
    </div>
  </CommonModal>
</template>

<script setup lang="ts">
import QRCode from 'qrcode';

const props = defineProps<{
  modelValue: boolean;
  registration: Record<string, any> | null;
}>();

defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const qrDataUrl = ref<string>('');
const loading = ref<boolean>(false);
const error = ref<string | null>(null);

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen && props.registration) {
      await generateQrCode();
    } else {
      qrDataUrl.value = '';
      error.value = null;
    }
  }
);

async function generateQrCode() {
  if (!props.registration) return;
  if (props.registration.status !== 'Confirmed' && props.registration.payment_status !== 'Fully Paid') {
    error.value = 'QR Code Pass is locked. Full payment is required to generate entry pass.';
    loading.value = false;
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const regId = props.registration.id;
    const eventId = props.registration.event_id;
    const { useAuthStore } = await import('~/stores/auth');
    const auth = useAuthStore();
    const token = auth.token;

    let rawCode: string = props.registration.qr_code || '';
    try {
      const endpoint = eventId
        ? `/api/events/${eventId}/registrations/${regId}/qr-code`
        : `/api/registrations/${regId}/qr-code`;
      const res = await $fetch<any>(endpoint, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      const backendCode = res?.data?.qr_code || res?.qr_code || res?.data?.registration?.qr_code || res?.registration?.qr_code;
      if (backendCode) rawCode = backendCode;
    } catch {
      // Fallback
    }

    if (!rawCode) rawCode = `REG-${eventId}-${regId}`;
    const origin = import.meta.client ? window.location.origin : '';

    const { generateLabeledQrCanvasBlob } = await import('~/utils/qrCanvas');
    const { blob } = await generateLabeledQrCanvasBlob({
      registration: { ...props.registration, qr_code: rawCode },
      index: Math.max(0, (Number(props.registration.id) || 1) - 1),
      totalCount: 1,
      originUrl: origin,
    });

    qrDataUrl.value = URL.createObjectURL(blob);
  } catch (err: any) {
    console.error('Failed to generate QR code:', err);
    error.value = 'Failed to generate QR code.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.qr-container {
  display: inline-block;
  background: #ffffff;
}
</style>
