<template>
  <div class="password-reset-form">
    <!-- Step Indicator -->
    <div class="step-indicator d-flex align-items-center gap-2 mb-4">
      <div class="step-pill" :class="{ 'step-pill--active': reset.step.value === 1, 'step-pill--done': reset.step.value > 1 }">
        <span>1</span>
        <small>Request Code</small>
      </div>
      <div class="step-line"></div>
      <div class="step-pill" :class="{ 'step-pill--active': reset.step.value === 2 }">
        <span>2</span>
        <small>Reset PIN</small>
      </div>
    </div>

    <!-- Step 1 -->
    <form v-if="reset.step.value === 1" @submit.prevent="handleRequestOtp">
      <div class="mb-3">
        <label class="form-label fw-semibold text-slate-700">Username</label>
        <div class="input-group">
          <span class="input-group-text bg-light text-slate-500 border-end-0">
            <i class="bi bi-person"></i>
          </span>
          <input
            v-model="reset.username.value"
            type="text"
            class="form-control border-start-0 ps-0"
            :class="{ 'is-invalid': reset.errors.value.username }"
            :readonly="lockIdentity"
            placeholder="Enter your username"
            required
          />
        </div>
        <div v-if="reset.errors.value.username" class="invalid-feedback d-block mt-1 fs-7">
          {{ reset.errors.value.username }}
        </div>
      </div>

      <div class="mb-4">
        <label class="form-label fw-semibold text-slate-700">Registered Mobile</label>
        <div class="input-group">
          <span class="input-group-text bg-light text-slate-500 border-end-0">
            <i class="bi bi-phone"></i>
          </span>
          <input
            v-model="reset.mobile.value"
            type="tel"
            class="form-control border-start-0 ps-0"
            :class="{ 'is-invalid': reset.errors.value.mobile }"
            :readonly="lockIdentity"
            placeholder="Enter registered mobile number"
            required
          />
        </div>
        <div v-if="reset.errors.value.mobile" class="invalid-feedback d-block mt-1 fs-7">
          {{ reset.errors.value.mobile }}
        </div>
      </div>

      <div v-if="reset.errorMessage.value" class="alert alert-danger d-flex align-items-center gap-2 mb-3 py-2 px-3 fs-7">
        <i class="bi bi-exclamation-triangle-fill flex-shrink-0"></i>
        <div>{{ reset.errorMessage.value }}</div>
      </div>

      <button type="submit" class="btn btn-primary w-100 py-2 fw-bold" :disabled="reset.loading.value">
        <span v-if="reset.loading.value" class="spinner-border spinner-border-sm me-2"></span>
        Send Reset Code
      </button>
    </form>

    <!-- Step 2 -->
    <form v-else @submit.prevent="handleResetPin">
      <div v-if="reset.successMessage.value" class="alert alert-success py-2 px-3 fs-7 mb-3">
        <i class="bi bi-check-circle-fill me-1"></i>
        {{ reset.successMessage.value }}
      </div>

      <div v-if="reset.expiresAt.value" class="alert alert-info py-2 px-3 fs-7 mb-3">
        <i class="bi bi-clock me-1"></i>
        Code expires at {{ formatExpiry(reset.expiresAt.value) }}
      </div>

      <div v-if="reset.devOtp.value" class="alert alert-warning py-2 px-3 fs-7 mb-3">
        <i class="bi bi-key me-1"></i>
        Reset code: <strong>{{ reset.devOtp.value }}</strong>
      </div>

      <div class="mb-3">
        <label class="form-label fw-semibold text-slate-700">Reset Code (OTP)</label>
        <div class="input-group">
          <span class="input-group-text bg-light text-slate-500 border-end-0">
            <i class="bi bi-shield-lock"></i>
          </span>
          <input
            v-model="reset.otp.value"
            type="text"
            inputmode="numeric"
            class="form-control border-start-0 ps-0"
            :class="{ 'is-invalid': reset.errors.value.otp }"
            placeholder="Enter the code sent to your mobile"
            required
          />
        </div>
        <div v-if="reset.errors.value.otp" class="invalid-feedback d-block mt-1 fs-7">
          {{ reset.errors.value.otp }}
        </div>
      </div>

      <div class="mb-3">
        <label class="form-label fw-semibold text-slate-700">New PIN</label>
        <div class="input-group">
          <span class="input-group-text bg-light text-slate-500 border-end-0">
            <i class="bi bi-lock"></i>
          </span>
          <input
            v-model="reset.pin.value"
            :type="showPin ? 'text' : 'password'"
            inputmode="numeric"
            maxlength="8"
            class="form-control border-start-0 border-end-0 ps-0"
            :class="{ 'is-invalid': reset.errors.value.pin }"
            placeholder="Enter new numeric PIN"
            @input="onPinInput"
            required
          />
          <button
            type="button"
            class="input-group-text bg-light text-slate-500 border-start-0"
            @click="showPin = !showPin"
            tabindex="-1"
          >
            <i :class="['bi', showPin ? 'bi-eye-fill' : 'bi-eye-slash-fill']"></i>
          </button>
        </div>
        <div v-if="reset.errors.value.pin" class="invalid-feedback d-block mt-1 fs-7">
          {{ reset.errors.value.pin }}
        </div>
      </div>

      <div class="mb-4">
        <label class="form-label fw-semibold text-slate-700">Confirm New PIN</label>
        <div class="input-group">
          <span class="input-group-text bg-light text-slate-500 border-end-0">
            <i class="bi bi-lock-fill"></i>
          </span>
          <input
            v-model="reset.pinConfirmation.value"
            :type="showConfirmPin ? 'text' : 'password'"
            inputmode="numeric"
            maxlength="8"
            class="form-control border-start-0 border-end-0 ps-0"
            :class="{ 'is-invalid': reset.errors.value.pin_confirmation }"
            placeholder="Re-enter new PIN"
            @input="onConfirmPinInput"
            required
          />
          <button
            type="button"
            class="input-group-text bg-light text-slate-500 border-start-0"
            @click="showConfirmPin = !showConfirmPin"
            tabindex="-1"
          >
            <i :class="['bi', showConfirmPin ? 'bi-eye-fill' : 'bi-eye-slash-fill']"></i>
          </button>
        </div>
        <div v-if="reset.errors.value.pin_confirmation" class="invalid-feedback d-block mt-1 fs-7">
          {{ reset.errors.value.pin_confirmation }}
        </div>
      </div>

      <div v-if="reset.errorMessage.value" class="alert alert-danger d-flex align-items-center gap-2 mb-3 py-2 px-3 fs-7">
        <i class="bi bi-exclamation-triangle-fill flex-shrink-0"></i>
        <div>{{ reset.errorMessage.value }}</div>
      </div>

      <div class="d-flex flex-column flex-sm-row gap-2">
        <button type="button" class="btn btn-outline-secondary flex-fill py-2" @click="reset.resetFlow()" :disabled="reset.loading.value">
          Back
        </button>
        <button type="submit" class="btn btn-primary flex-fill py-2 fw-bold" :disabled="reset.loading.value">
          <span v-if="reset.loading.value" class="spinner-border spinner-border-sm me-2"></span>
          Reset PIN
        </button>
      </div>
    </form>

    <div v-if="showBackToLogin && reset.step.value === 1" class="mt-4 pt-3 text-center border-top">
      <NuxtLink to="/login" class="text-green-500 text-decoration-none fw-semibold fs-7">
        <i class="bi bi-arrow-left me-1"></i>
        Back to Sign In
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    initialUsername?: string;
    initialMobile?: string;
    lockIdentity?: boolean;
    showBackToLogin?: boolean;
  }>(),
  {
    initialUsername: '',
    initialMobile: '',
    lockIdentity: false,
    showBackToLogin: true,
  }
);

const emit = defineEmits<{
  success: [];
}>();

const reset = usePasswordReset({
  username: props.initialUsername,
  mobile: props.initialMobile,
});

const showPin = ref(false);
const showConfirmPin = ref(false);

function formatExpiry(value: string) {
  return new Date(value).toLocaleString('en-KE', {
    timeZone: 'Africa/Nairobi',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function onPinInput(event: Event) {
  const target = event.target as HTMLInputElement;
  const filtered = reset.filterNumericInput(target.value);
  target.value = filtered;
  reset.pin.value = filtered;
}

function onConfirmPinInput(event: Event) {
  const target = event.target as HTMLInputElement;
  const filtered = reset.filterNumericInput(target.value);
  target.value = filtered;
  reset.pinConfirmation.value = filtered;
}

async function handleRequestOtp() {
  await reset.requestOtp();
}

async function handleResetPin() {
  const success = await reset.resetPin();
  if (success) {
    emit('success');
  }
}
</script>

<style scoped>
.step-indicator {
  width: 100%;
}

.step-pill {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  min-width: 72px;
}

.step-pill span {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
  background: var(--slate-100);
  color: var(--slate-500);
}

.step-pill small {
  font-size: 0.68rem;
  color: var(--slate-500);
  font-weight: 600;
}

.step-pill--active span {
  background: var(--green-500);
  color: #fff;
}

.step-pill--active small {
  color: var(--green-600);
}

.step-pill--done span {
  background: var(--green-100);
  color: var(--green-700);
}

.step-line {
  flex: 1;
  height: 2px;
  background: var(--slate-100);
  margin-bottom: 1rem;
}

.text-green-500 {
  color: var(--green-500) !important;
}

.text-slate-700 {
  color: var(--slate-700) !important;
}
</style>
