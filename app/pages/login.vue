<template>
  <div class="split-login-container">
    <div class="row g-0 min-vh-100">
      <!-- Left Hero Banner -->
      <div class="col-lg-6 d-none d-lg-flex flex-column justify-content-between p-5 hero-banner">
        <div class="brand-header d-flex align-items-center justify-content-center gap-3 mt-5 pt-4">
          <img src="/mana ministries.png" alt="Mana Ministries Logo" class="brand-logo shadow-sm" style="width: 76px; height: 76px; object-fit: contain; background: white; padding: 7px; border-radius: 18px;" />
          <div class="text-start">
            <span class="fs-2 fw-bold text-white tracking-wide d-block mb-0" style="line-height: 1.1;">Kongamano</span>
            <small class="text-slate-300 fs-6">Mana Ministries</small>
          </div>
        </div>

        <div class="hero-content text-white text-start my-auto py-5 ps-2">
          <div class="d-flex justify-content-center mb-3">
            <span class="badge bg-green-accent px-3 py-2 rounded-pill fs-7">
              <i class="bi bi-shield-check me-1"></i> Event Management System
            </span>
          </div>
          <h1 class="display-4 fw-extrabold mb-3">Manage Events & Attendees Seamlessly.</h1>
          <p class="lead text-slate-300 max-w-lg mb-4">
            Unified portal for event scheduling, registration tracking, attendance scanning, and payment management.
          </p>
          <div class="d-flex align-items-center gap-4 pt-3 border-top border-secondary-subtle">
            <div>
              <h4 class="fw-bold mb-0 text-green-300">100%</h4>
              <small class="text-slate-300">Secure Access</small>
            </div>
            <div class="vr bg-secondary"></div>
            <div>
              <h4 class="fw-bold mb-0 text-green-300">Real-time</h4>
              <small class="text-slate-300">Attendee Tracking</small>
            </div>
          </div>
        </div>

        <div class="hero-footer text-slate-300 fs-7 ps-2">
          &copy; {{ new Date().getFullYear() }} Kongamano Platform. All rights reserved.
        </div>
      </div>

      <!-- Right Login Form Section with Split Curved Wavy Header -->
      <div class="col-lg-6 d-flex align-items-center justify-content-center p-3 p-md-5 login-right-section position-relative overflow-hidden">
        <div class="form-wrapper w-100 rounded-4 shadow-lg bg-white overflow-hidden border border-slate-100 position-relative" style="max-width: 450px;">
          <!-- Curved Wavy Header Banner -->
          <div class="card-wavy-header position-relative px-4 pt-4 pb-5 text-white">
            <div class="d-flex align-items-center gap-3 mb-2">
              <div class="wavy-header-logo-box shadow-2xs">
                <i class="bi bi-person-badge-fill fs-5"></i>
              </div>
              <div>
                <h4 class="fw-bold text-white mb-0 fs-5">Account Sign In</h4>
                <small class="text-slate-200 fs-7">Kongamano Platform</small>
              </div>
            </div>

            <!-- SVG Wave Bottom Mask -->
            <div class="wave-svg-box">
              <svg viewBox="0 0 500 150" preserveAspectRatio="none" style="height: 100%; width: 100%;">
                <path d="M0.00,49.98 C150.00,150.00 349.20,-49.98 500.00,49.98 L500.00,150.00 L0.00,150.00 Z" style="stroke: none; fill: #ffffff;"></path>
              </svg>
            </div>
          </div>

          <!-- Card Content Body -->
          <div class="p-4 px-sm-5 pb-sm-5 pt-0">
            <!-- Mobile Brand Logo -->
            <div class="d-flex d-lg-none align-items-center gap-3 mb-4">
              <img src="/mana ministries.png" alt="Mana Ministries Logo" class="brand-logo sm shadow-sm" style="width: 52px; height: 52px; object-fit: contain; background: white; padding: 4px; border-radius: 12px; border: 1px solid #e2e8f0;" />
              <div>
                <span class="fs-4 fw-bold text-slate-900 d-block">Kongamano</span>
                <small class="text-slate-500 fs-7">Mana Ministries</small>
              </div>
            </div>

            <div class="mb-4">
              <h5 class="fw-bold text-slate-900 mb-1">Welcome back</h5>
              <p class="text-slate-500 fs-7">Please enter your credentials to access your account.</p>
            </div>

          <form @submit.prevent="handleLogin" class="needs-validation">
            <!-- Username Field -->
            <div class="mb-3">
              <label for="username" class="form-label fw-semibold text-slate-700">Username</label>
              <div class="input-group">
                <span class="input-group-text bg-light text-slate-500 border-end-0">
                  <i class="bi bi-person"></i>
                </span>
                <input
                  id="username"
                  v-model="username"
                  type="text"
                  class="form-control border-start-0 ps-0"
                  :class="{ 'is-invalid': errors.username }"
                  placeholder="e.g. admin"
                  autocomplete="username"
                  required
                />
              </div>
              <div v-if="errors.username" class="invalid-feedback d-block mt-1 fs-7">
                {{ errors.username }}
              </div>
            </div>

            <!-- PIN Field (Numeric Only) -->
            <div class="mb-3">
              <div class="d-flex justify-content-between align-items-center">
                <label for="pin" class="form-label fw-semibold text-slate-700 mb-1">Numeric PIN</label>
                <NuxtLink to="/forgot-password" class="text-green-500 text-decoration-none fs-7 fw-semibold">
                  Forgot PIN?
                </NuxtLink>
              </div>
              <div class="input-group">
                <span class="input-group-text bg-light text-slate-500 border-end-0">
                  <i class="bi bi-lock"></i>
                </span>
                <input
                  id="pin"
                  v-model="pin"
                  :type="showPin ? 'text' : 'password'"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  maxlength="8"
                  class="form-control border-start-0 border-end-0 ps-0"
                  :class="{ 'is-invalid': errors.pin }"
                  placeholder="Enter numeric PIN (e.g. 1234)"
                  @input="filterNumericInput"
                  @keyup="checkCapsLock"
                  @keydown="checkCapsLock"
                  autocomplete="current-password"
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
              <div v-if="isCapsLockOn" class="text-warning d-flex align-items-center gap-1 mt-1 fs-7 fw-semibold">
                <i class="bi bi-capslock-fill"></i>
                <span>Caps Lock is ON</span>
              </div>
              <div v-if="errors.pin" class="invalid-feedback d-block mt-1 fs-7">
                {{ errors.pin }}
              </div>
            </div>

            <!-- Options Row -->
            <div class="d-flex align-items-center justify-content-between mb-4">
              <div class="form-check">
                <input id="remember" type="checkbox" class="form-check-input" v-model="rememberMe" />
                <label for="remember" class="form-check-label text-slate-600 fs-7 select-none" style="cursor: pointer;">
                  Remember username
                </label>
              </div>
            </div>

            <!-- Alert Box for Error -->
            <div v-if="errorMessage" class="alert alert-danger d-flex align-items-center gap-2 mb-4 py-2 px-3 fs-7" role="alert">
              <i class="bi bi-exclamation-triangle-fill flex-shrink-0"></i>
              <div>{{ errorMessage }}</div>
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              class="btn btn-primary w-100 py-2-5 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
              :disabled="loading"
            >
              <span v-if="loading" class="spinner-border spinner-border-sm" role="status"></span>
              <span>{{ loading ? 'Authenticating...' : 'Sign In' }}</span>
              <i v-if="!loading" class="bi bi-arrow-right"></i>
            </button>
          </form>

          <!-- Support Footer -->
          <div class="mt-4 pt-3 text-center border-top">
            <p class="text-slate-500 fs-7 mb-0">
              Need assistance?
              <a href="mailto:support@kongamano.org" class="text-green-500 text-decoration-none fw-semibold ms-1">
                Contact System Administrator
              </a>
            </p>
          </div>
        </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod';
import { useAuthStore } from '~/stores/auth';
import type { ApiResponse } from '~/types/api';
import type { User } from '~/types/auth';

definePageMeta({
  layout: 'auth',
});

const authStore = useAuthStore();
const push = usePush(); // Notivue notifications

const username = ref('');
const pin = ref('');
const showPin = ref(false);
const rememberMe = ref(false);
const loading = ref(false);
const isCapsLockOn = ref(false);
const errorMessage = ref('');
const errors = ref<{ username?: string; pin?: string }>({});

onMounted(() => {
  if (import.meta.client) {
    const savedUsername = localStorage.getItem('kongamano_saved_username');
    if (savedUsername) {
      username.value = savedUsername;
      rememberMe.value = true;
    }
  }
});

function checkCapsLock(event: KeyboardEvent) {
  isCapsLockOn.value = event.getModifierState && event.getModifierState('CapsLock');
}

// Zod Validation Schema for Login
const loginSchema = z.object({
  username: z.string().min(1, 'Username is required.'),
  pin: z
    .string()
    .min(1, 'PIN is required.')
    .regex(/^\d+$/, 'PIN must contain only numeric digits (0-9).'),
});

// Enforce strict numeric digits (0-9) on input
function filterNumericInput(event: Event) {
  const target = event.target as HTMLInputElement;
  target.value = target.value.replace(/\D/g, '');
  pin.value = target.value;
}

async function handleLogin() {
  errorMessage.value = '';
  errors.value = {};

  // Handle Remember Username persistence
  if (import.meta.client) {
    if (rememberMe.value && username.value) {
      localStorage.setItem('kongamano_saved_username', username.value);
    } else {
      localStorage.removeItem('kongamano_saved_username');
    }
  }

  // Validate with Zod
  const validation = loginSchema.safeParse({ username: username.value, pin: pin.value });
  if (!validation.success) {
    const formatted = validation.error.format();
    errors.value = {
      username: formatted.username?._errors[0],
      pin: formatted.pin?._errors[0],
    };
    return;
  }

  loading.value = true;
  try {
    const response = await $fetch<ApiResponse<{ token: string; user?: User }>>(apiPath('/api/auth/login'), {
      method: 'POST',
      body: {
        username: username.value,
        pin: pin.value,
      },
    });

    if (response && response.data && response.data.token) {
      authStore.setToken(response.data.token);
      if (response.data.user) {
        authStore.setUser(response.data.user);
      } else {
        await authStore.fetchCurrentUser();
      }

      // Flush pending cookie writes. useCookie writes to document.cookie via an
      // async Vue watcher, so without this tick the global auth middleware can run
      // before token/role_id are persisted and bounce us straight back to /login.
      await nextTick();

      push.success({
        title: 'Authentication Successful',
        message: `Welcome back, ${authStore.user?.first_name || username.value}!`,
      });

      const route = useRoute();
      // Non-admin users (scanners) go directly to /scan or /scannings — no dashboard detour.
      // If a redirect URL is present (e.g. /scan?code=...), navigate directly to it.
      // (Cookies were flushed above with await nextTick(), so the auth middleware
      // will see the new token/role_id on this client-side navigation.)
      let redirectTarget = (route.query.redirect as string) || '';
      if (redirectTarget.startsWith('/scannings?code=')) {
        redirectTarget = redirectTarget.replace('/scannings?code=', '/scan?code=');
      }
      if (!authStore.isAdmin) {
        const dest = (redirectTarget && (redirectTarget.startsWith('/scan') || redirectTarget.startsWith('/scannings')))
          ? redirectTarget
          : '/scan';
        await navigateTo(dest);
      } else {
        await navigateTo(redirectTarget || '/');
      }
    } else {
      errorMessage.value = response?.message || 'Invalid username or PIN.';
      push.error({ title: 'Login Failed', message: errorMessage.value });
    }
  } catch (err: any) {
    console.error('Login error:', err);
    errorMessage.value = err?.data?.message || 'Authentication failed. Please check your username and PIN.';
    push.error({ title: 'Login Error', message: errorMessage.value });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.split-login-container {
  overflow-x: hidden;
}

.hero-banner {
  background: linear-gradient(135deg, var(--slate-900) 0%, #152414 50%, var(--green-900) 100%);
  position: relative;
}

.hero-banner::before {
  content: '';
  position: absolute;
  top: 0; right: 0; bottom: 0; left: 0;
  background: radial-gradient(circle at 20% 30%, rgba(46, 125, 34, 0.25) 0%, transparent 60%);
  pointer-events: none;
}

.brand-logo {
  width: 44px;
  height: 44px;
  background-color: var(--green-500);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bg-green-accent {
  background-color: rgba(46, 125, 34, 0.3);
  color: var(--green-200);
  border: 1px solid rgba(155, 203, 143, 0.3);
}

.text-green-300 {
  color: var(--green-300) !important;
}

.text-green-500 {
  color: var(--green-500) !important;
}

.text-slate-300 {
  color: var(--slate-300) !important;
}

.text-slate-500 {
  color: var(--slate-500) !important;
}

.text-slate-700 {
  color: var(--slate-700) !important;
}

.text-slate-900 {
  color: var(--slate-900) !important;
}

.fs-7 {
  font-size: 0.85rem;
}

.py-2-5 {
  padding-top: 0.65rem;
  padding-bottom: 0.65rem;
}

/* ── Split Curved Wavy Header Card Design with Luxury Warm Cream & Tan Background ───────── */
.login-right-section {
  background-color: #F8FAE5;
  background-image: 
    radial-gradient(at 0% 0%, rgba(177, 148, 112, 0.18) 0px, transparent 50%),
    radial-gradient(at 100% 100%, rgba(67, 118, 108, 0.14) 0px, transparent 50%),
    radial-gradient(rgba(177, 148, 112, 0.2) 0.6px, transparent 0.6px);
  background-size: 100% 100%, 100% 100%, 22px 22px;
}

.card-wavy-header {
  background: linear-gradient(135deg, var(--green-900) 0%, var(--green-600) 50%, var(--green-500) 100%);
  overflow: hidden;
}

.wavy-header-logo-box {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(4px);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.25);
}

.wave-svg-box {
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 48px;
  pointer-events: none;
}</style>
