<template>
  <div class="split-auth-container">
    <div class="row g-0 min-vh-100">
      <!-- Left Hero Banner -->
      <div class="col-lg-6 d-none d-lg-flex flex-column justify-content-between p-5 hero-banner">
        <div class="brand-header d-flex align-items-center justify-content-center gap-3 mt-5 pt-4">
          <img
            src="/mana ministries.png"
            alt="Mana Ministries Logo"
            class="brand-logo shadow-sm"
            style="width: 76px; height: 76px; object-fit: contain; background: white; padding: 7px; border-radius: 18px;"
          />
          <div class="text-start">
            <span class="fs-2 fw-bold text-white tracking-wide d-block mb-0" style="line-height: 1.1;">Kongamano</span>
            <small class="text-slate-300 fs-6">Mana Ministries</small>
          </div>
        </div>

        <div class="hero-content text-white text-start my-auto py-5 ps-2">
          <div class="d-flex justify-content-center mb-3">
            <span class="badge bg-green-accent px-3 py-2 rounded-pill fs-7">
              <i class="bi bi-key me-1"></i> Account Recovery
            </span>
          </div>
          <h1 class="display-5 fw-extrabold mb-3">Reset Your PIN Securely.</h1>
          <p class="lead text-slate-300 max-w-lg mb-0">
            Verify your account with your registered mobile number, then set a new numeric PIN to regain access.
          </p>
        </div>

        <div class="hero-footer text-slate-300 fs-7 ps-2">
          &copy; {{ new Date().getFullYear() }} Kongamano Platform. All rights reserved.
        </div>
      </div>

      <!-- Right Form -->
      <div class="col-lg-6 d-flex align-items-center justify-content-center bg-white p-4 p-md-5">
        <div class="form-wrapper w-100" style="max-width: 440px;">
          <div class="d-flex d-lg-none align-items-center gap-3 mb-4">
            <img
              src="/mana ministries.png"
              alt="Mana Ministries Logo"
              class="brand-logo sm shadow-sm"
              style="width: 52px; height: 52px; object-fit: contain; background: white; padding: 4px; border-radius: 12px; border: 1px solid #e2e8f0;"
            />
            <div>
              <span class="fs-4 fw-bold text-slate-900 d-block">Kongamano</span>
              <small class="text-slate-500 fs-7">Mana Ministries</small>
            </div>
          </div>

          <div class="mb-4">
            <h2 class="fw-bold text-slate-900 mb-1">Forgot PIN</h2>
            <p class="text-slate-500 fs-6 mb-0">
              Enter your username and registered mobile number to receive a reset code.
            </p>
          </div>

          <AuthPasswordResetForm @success="handleResetSuccess" />

          <div v-if="resetComplete" class="alert alert-success mt-4 py-3 px-3 fs-7 mb-0">
            <i class="bi bi-check-circle-fill me-1"></i>
            Your PIN has been reset. You can now sign in with your new PIN.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' });

const resetComplete = ref(false);

function handleResetSuccess() {
  resetComplete.value = true;
  setTimeout(() => {
    navigateTo('/login');
  }, 1800);
}
</script>

<style scoped>
.split-auth-container {
  overflow-x: hidden;
}

.hero-banner {
  background: linear-gradient(135deg, var(--slate-900) 0%, #152414 50%, var(--green-900) 100%);
  position: relative;
}

.hero-banner::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 20% 30%, rgba(46, 125, 34, 0.25) 0%, transparent 60%);
  pointer-events: none;
}

.bg-green-accent {
  background-color: rgba(46, 125, 34, 0.3);
  color: var(--green-200);
  border: 1px solid rgba(155, 203, 143, 0.3);
}

.text-slate-300 {
  color: var(--slate-300) !important;
}

.text-slate-500 {
  color: var(--slate-500) !important;
}

.text-slate-900 {
  color: var(--slate-900) !important;
}

.fs-7 {
  font-size: 0.85rem;
}
</style>
