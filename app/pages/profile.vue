<template>
  <div class="profile-page">
    <!-- Page Header -->
    <div class="page-header d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
      <div class="d-flex align-items-center gap-3">
        <div class="header-icon-box">
          <i class="bi bi-person-fill"></i>
        </div>
        <div>
          <h2 class="page-heading">My Profile</h2>
          <p class="page-subheading">View your account details and access credentials.</p>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="state-box card border-0 shadow-sm rounded-4">
      <div class="spinner-border text-success" role="status"></div>
      <p class="mt-3 text-muted mb-0">Loading profile...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="errorMessage" class="state-box card border-0 shadow-sm rounded-4">
      <i class="bi bi-person-exclamation text-muted opacity-40 fs-1"></i>
      <h6 class="fw-semibold text-slate-800 mt-3 mb-1">Unable to load profile</h6>
      <p class="text-muted fs-7 mb-3">{{ errorMessage }}</p>
      <button class="btn btn-outline-secondary btn-sm rounded-3 px-3" @click="fetchProfile">
        Retry
      </button>
    </div>

    <!-- Profile Card -->
    <div v-else-if="profile" class="profile-card card border-0 shadow-sm rounded-4 overflow-hidden">
      <!-- Gradient Banner -->
      <div class="profile-banner px-4 py-4 text-white">
        <div class="d-flex align-items-center gap-3 flex-wrap">
          <div class="profile-avatar">{{ initials }}</div>
          <div>
            <h4 class="fw-bold mb-0.5">{{ profile.first_name }} {{ profile.last_name }}</h4>
            <span class="profile-role-badge">
              <i class="bi bi-shield-check me-1"></i>
              {{ profile.role || 'System User' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Account Details -->
      <div class="p-4">
        <h6 class="fw-bold text-slate-900 mb-3">
          <i class="bi bi-person-vcard me-1 text-green-500"></i> Account Details
        </h6>
        <div class="row g-3">
          <!-- <div class="col-6 col-md-4">
            <span class="text-muted d-block fs-8">User ID</span>
            <span class="fw-semibold text-slate-900 fs-7">#{{ profile.id }}</span>
          </div> -->
          <div class="col-6 col-md-4">
            <span class="text-muted d-block fs-8">First Name</span>
            <span class="fw-semibold text-slate-900 fs-7">{{ profile.first_name || '—' }}</span>
          </div>
          <div class="col-6 col-md-4">
            <span class="text-muted d-block fs-8">Last Name</span>
            <span class="fw-semibold text-slate-900 fs-7">{{ profile.last_name || '—' }}</span>
          </div>
          <div class="col-6 col-md-4">
            <span class="text-muted d-block fs-8">Username</span>
            <span class="fw-semibold text-slate-900 fs-7">@{{ profile.username }}</span>
          </div>
          <div class="col-6 col-md-4">
            <span class="text-muted d-block fs-8">Mobile</span>
            <span class="fw-semibold text-slate-900 fs-7">
              <i class="bi bi-telephone-fill text-green-600 me-1 fs-8"></i>
              {{ profile.mobile || '—' }}
            </span>
          </div>
          <div class="col-6 col-md-4">
            <span class="text-muted d-block fs-8">Role</span>
            <span class="role-pill">{{ profile.role || `Role #${profile.role_id}` }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { User } from '~/types/auth';

definePageMeta({ layout: 'default' });

const authStore = useAuthStore();
const token = useCookie<string | null>('token');

const profile = ref<(User & { role?: string }) | null>(null);
const loading = ref(true);
const errorMessage = ref('');

const initials = computed(() => {
  if (!profile.value) return 'U';
  const f = profile.value.first_name?.[0] || '';
  const l = profile.value.last_name?.[0] || '';
  return `${f}${l}`.toUpperCase();
});

async function fetchProfile() {
  loading.value = true;
  errorMessage.value = '';
  try {
    const res = await $fetch<any>(apiPath('/api/auth/me'), {
      headers: {
        Authorization: `Bearer ${token.value}`,
        Accept: 'application/json',
      },
    });
    const user = res?.data?.user;
    if (!user) {
      throw new Error('No user data returned.');
    }
    profile.value = user;
    authStore.setUser(user);
  } catch (err: any) {
    console.error('Failed to load profile:', err);
    errorMessage.value = err?.data?.message || 'Failed to load your profile.';
  } finally {
    loading.value = false;
  }
}

onMounted(fetchProfile);
</script>

<style scoped>
.profile-page {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 120px);
}

.header-icon-box {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--green-50);
  color: var(--green-500);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  box-shadow: inset 0 0 0 1px rgba(46, 125, 34, 0.15);
}

.page-heading {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--slate-900);
  margin: 0;
}

.page-subheading {
  font-size: 0.82rem;
  color: var(--slate-500);
  margin: 0.2rem 0 0;
}

.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.profile-banner {
  background: linear-gradient(135deg, var(--green-700) 0%, var(--green-500) 60%, var(--green-400) 100%);
}

.profile-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #fff;
  color: var(--green-600);
  font-weight: 800;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
  flex-shrink: 0;
}

.profile-role-badge {
  display: inline-flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 999px;
  padding: 0.25rem 0.8rem;
  font-size: 0.78rem;
  font-weight: 600;
}

.role-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  background: var(--green-50);
  color: var(--green-700);
  font-size: 0.78rem;
  font-weight: 600;
}
</style>
