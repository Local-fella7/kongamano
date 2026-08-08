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

  try {
    const regId = props.registration.id;
    const eventId = props.registration.event_id;
    const endpoint = eventId
      ? `/api/events/${eventId}/registrations/${regId}/qr-code`
      : `/api/registrations/${regId}/qr-code`;

    const rawCode = props.registration.qr_code || `REG-${eventId}-${regId}`;
    const origin = import.meta.client ? window.location.origin : '';
    const fullQrUrl = `${origin}/scannings?code=${encodeURIComponent(rawCode)}`;

    qrDataUrl.value = await QRCode.toDataURL(fullQrUrl, {
      width: 250,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
  } catch (err: any) {
    console.error('Failed to load or render QR code:', err);
    // Fallback client-side QR code generation if endpoint fails or returns error
    try {
      const rawCode = props.registration.qr_code || `REG-${props.registration.event_id}-${props.registration.id}`;
      const origin = import.meta.client ? window.location.origin : '';
      const fullQrUrl = `${origin}/scannings?code=${encodeURIComponent(rawCode)}`;
      qrDataUrl.value = await QRCode.toDataURL(fullQrUrl, {
        width: 250,
        margin: 2,
      });
    } catch {
      error.value = 'Failed to generate QR code.';
    }
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
