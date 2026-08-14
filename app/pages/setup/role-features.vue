<template>
  <div class="role-features-page">
    <!-- Page Header -->
    <div class="page-header d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
      <div class="d-flex align-items-center gap-3">
        <div class="header-icon-box">
          <i class="bi bi-shield-lock-fill"></i>
        </div>
        <div>
          <h2 class="page-heading">Role Permissions</h2>
          <p class="page-subheading">Manage which actions each role is granted across feature groups.</p>
        </div>
      </div>
    </div>

    <!-- Search Toolbar -->
    <div class="card border-0 shadow-sm rounded-4 p-3 mb-4">
      <div class="d-flex align-items-center justify-content-between flex-wrap gap-3">
        <h6 class="fw-bold text-slate-900 mb-0">Role Profiles</h6>

        <div class="search-box position-relative" style="min-width: 280px;">
          <i class="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted fs-7"></i>
          <input
            v-model="searchQuery"
            type="text"
            class="form-control form-control-sm ps-5 pe-4 py-2 rounded-pill border-slate-200"
            placeholder="Search roles..."
          />
          <button
            v-if="searchQuery"
            @click="searchQuery = ''"
            class="btn btn-link position-absolute top-50 end-0 translate-middle-y text-muted text-decoration-none pe-3 py-0"
            style="font-size: 0.8rem;"
          >
            <i class="bi bi-x-circle-fill"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="state-box card border-0 shadow-sm rounded-4">
      <div class="spinner-border text-success" role="status"></div>
      <p class="mt-3 text-muted mb-0">Loading roles...</p>
    </div>

    <!-- Role Cards Grid Container -->
    <div v-else class="role-grid-container d-flex flex-column justify-content-between flex-grow-1">
      <div class="row g-4 mb-4">
        <div
          v-for="role in paginatedRoles"
          :key="role.id"
          class="col-12 col-md-6 col-xl-4"
        >
          <div class="card gradient-header-card h-100 border-0 shadow-sm rounded-4 overflow-hidden bg-white">
            <!-- Top Gradient Header Banner -->
            <div class="card-gradient-header px-4 py-4 d-flex align-items-center justify-content-between">
              <div class="d-flex align-items-center gap-3 overflow-hidden">
                <div class="header-avatar-circle shadow-2xs">
                  <i class="bi bi-shield-fill-check"></i>
                </div>
                <div class="overflow-hidden">
                  <h5 class="fw-bold text-white mb-1 fs-6 text-truncate" :title="role.name">{{ role.name }}</h5>
                  <span class="role-feature-count-badge">
                    <i class="bi bi-key-fill me-1"></i>
                    {{ assignedActionCount(role.id) }} / {{ actions.length }} actions
                  </span>
                </div>
              </div>
            </div>

            <!-- Card Body Content -->
            <div class="card-body p-4 d-flex flex-column justify-content-between">
              <div class="mb-3">
                <span class="fs-8 text-muted fw-semibold d-block mb-1.5">Role Privileges:</span>
                <p class="text-muted fs-7 mb-0 line-clamp-2" style="min-height: 2.4rem;">
                  Configured access privileges and feature permissions for {{ role.name }}.
                </p>
              </div>

              <!-- Action Buttons Row -->
              <div class="d-flex align-items-center justify-content-end gap-2 pt-3 border-top mt-2">
                <button
                  class="btn btn-outline-success btn-sm rounded-3 fw-semibold fs-7 d-flex align-items-center gap-2 py-2 px-3 shadow-2xs"
                  @click="openPermissionsModal(role)"
                  title="Manage Permissions"
                >
                  <i class="bi bi-sliders small-action-icon"></i>
                  <span>Manage Permissions</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="filteredRoles.length === 0" class="state-box card border-0 shadow-sm rounded-4">
        <i class="bi bi-shield-slash text-muted opacity-40 fs-1"></i>
        <p class="fs-7 text-muted fw-medium mt-2 mb-0">No roles match your search.</p>
      </div>

      <!-- Bottom Pagination Bar -->
      <div v-if="filteredRoles.length > 0" class="pagination-footer card border-0 shadow-sm rounded-4 gap-3 px-4 py-3 bg-white mt-auto">
        <!-- Left Column: Range Info -->
        <div class="pagination-footer__meta fs-7 text-muted fw-medium text-nowrap">
          Showing <span class="fw-bold text-slate-900">{{ (currentPage - 1) * perPage + 1 }}</span> to <span class="fw-bold text-slate-900">{{ Math.min(currentPage * perPage, filteredRoles.length) }}</span> of <span class="fw-bold text-slate-900">{{ filteredRoles.length }}</span> roles
        </div>

        <!-- Center Column: Page Numbers Navigation -->
        <div class="pagination-footer__pages">
          <AppPagination
            :current-page="currentPage"
            :total-pages="totalPages"
            @update:current-page="currentPage = $event"
          />
        </div>

        <!-- Right Column: Per Page Selector -->
        <div class="pagination-footer__per-page d-flex align-items-center gap-1.5 text-nowrap">
          <span class="fs-8 text-muted fw-semibold">Per Page:</span>
          <select v-model="perPage" class="form-select form-select-sm rounded-3 fs-8 py-1 px-2 border-slate-200 shadow-2xs" style="width: auto;">
            <option :value="6">6</option>
            <option :value="12">12</option>
            <option :value="24">24</option>
            <option :value="48">48</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Manage Permissions Modal -->
    <SetupRolePermissionsModal
      v-model="showPermissionsModal"
      :role="selectedRole"
      :feature-groups="featureGroups"
      :features="features"
      :actions="actions"
      :role-actions="roleActions"
      @saved="fetchData"
    />
  </div>
</template>

<script setup lang="ts">
import AppPagination from '~/components/common/AppPagination.vue';
import type { Role } from '~/types/auth';
import type { FeatureGroup } from '~/types/feature-group';
import type { Feature } from '~/types/feature';
import type { Action } from '~/types/action';
import type { RoleAction } from '~/types/role-action';

definePageMeta({ layout: 'default' });

const roles = ref<Role[]>([]);
const featureGroups = ref<FeatureGroup[]>([]);
const features = ref<Feature[]>([]);
const actions = ref<Action[]>([]);
const roleActions = ref<RoleAction[]>([]);

const loading = ref(true);
const searchQuery = ref('');

const showPermissionsModal = ref(false);
const selectedRole = ref<Role | null>(null);

function openPermissionsModal(role: Role) {
  selectedRole.value = role;
  showPermissionsModal.value = true;
}

function assignedActionCount(roleId: number): number {
  return roleActions.value.filter((ra) => ra.role_id === roleId).length;
}

async function fetchData() {
  loading.value = true;

  try {
    const rolesRes = await cachedFetch<any>('/api/roles');
    roles.value = Array.isArray(rolesRes?.data?.roles) ? rolesRes.data.roles : (Array.isArray(rolesRes?.data) ? rolesRes.data : []);
  } catch (err) {
    console.error('Failed to load roles:', err);
  }

  try {
    const groupsRes = await cachedFetch<any>('/api/feature-groups');
    featureGroups.value = Array.isArray(groupsRes?.data?.feature_groups) ? groupsRes.data.feature_groups : (Array.isArray(groupsRes?.data) ? groupsRes.data : []);
  } catch (err) {
    console.error('Failed to load feature groups:', err);
  }

  try {
    const featuresRes = await cachedFetch<any>('/api/features');
    features.value = Array.isArray(featuresRes?.data?.features) ? featuresRes.data.features : (Array.isArray(featuresRes?.data) ? featuresRes.data : []);
  } catch (err) {
    console.error('Failed to load features:', err);
  }

  try {
    const actionsRes = await cachedFetch<any>('/api/actions');
    actions.value = Array.isArray(actionsRes?.data?.actions) ? actionsRes.data.actions : (Array.isArray(actionsRes?.data) ? actionsRes.data : []);
  } catch (err) {
    console.error('Failed to load actions:', err);
  }

  try {
    const roleActionsRes = await cachedFetch<any>('/api/role-actions');
    roleActions.value = Array.isArray(roleActionsRes?.data?.role_actions) ? roleActionsRes.data.role_actions : (Array.isArray(roleActionsRes?.data) ? roleActionsRes.data : []);
  } catch (err) {
    console.error('Failed to load role-action assignments:', err);
  }

  loading.value = false;
}

const filteredRoles = computed(() => {
  if (!searchQuery.value.trim()) return roles.value;
  const q = searchQuery.value.toLowerCase().trim();
  return roles.value.filter((role) => role.name.toLowerCase().includes(q));
});

const currentPage = ref(1);
const perPage = ref(6);

watch([perPage, searchQuery], () => {
  currentPage.value = 1;
});

const totalPages = computed(() => {
  return Math.ceil(filteredRoles.value.length / perPage.value) || 1;
});

const paginatedRoles = computed(() => {
  const start = (currentPage.value - 1) * perPage.value;
  return filteredRoles.value.slice(start, start + perPage.value);
});

onMounted(fetchData);
</script>

<style scoped>
.role-features-page {
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

.gradient-header-card {
  transition: transform 0.22s ease, box-shadow 0.22s ease;
  min-height: 250px;
}

.gradient-header-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.08) !important;
}

.card-gradient-header {
  background: linear-gradient(135deg, var(--green-900) 0%, var(--green-500) 100%);
  padding: 1.25rem 1.5rem !important;
  min-height: 80px;
}

.header-avatar-circle {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(4px);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.25);
}

.role-feature-count-badge {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.15);
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
}

.small-action-icon {
  font-size: 0.82rem !important;
}

.bg-green-subtle { background-color: var(--green-50); }
.text-green-700 { color: var(--green-700); }
</style>
