<template>
  <div class="role-features-page">
    <!-- Page Header -->
    <div class="page-header d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
      <div class="d-flex align-items-center gap-3">
        <div class="header-icon-box">
          <i class="bi bi-shield-lock-fill"></i>
        </div>
        <div>
          <h2 class="page-heading">Role Permissions Matrix</h2>
          <p class="page-subheading">Manage feature access control and administrative module privileges for each user role.</p>
        </div>
      </div>
      <button class="btn-create" @click="openAssignModal(undefined)">
        <i class="bi bi-plus-lg fs-6"></i>
        <span>Assign Features</span>
      </button>
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
      <p class="mt-3 text-muted mb-0">Loading permissions matrix...</p>
    </div>

    <!-- Role Cards Grid Container -->
    <div v-else class="role-grid-container d-flex flex-column justify-content-between flex-grow-1">
      <div class="row g-4 mb-4">
        <div
          v-for="roleGroup in paginatedRoleGroups"
          :key="roleGroup.role.id"
          class="col-12 col-md-6 col-xl-4"
        >
          <div class="card gradient-header-card h-100 border-0 shadow-sm rounded-4 overflow-hidden bg-white">
            <!-- Top Gradient Header Banner (Matches Events Page) -->
            <div class="card-gradient-header px-4 py-4 d-flex align-items-center justify-content-between">
              <div class="d-flex align-items-center gap-3 overflow-hidden">
                <div class="header-avatar-circle shadow-2xs">
                  <i class="bi bi-shield-fill-check"></i>
                </div>
                <div class="overflow-hidden">
                  <h5 class="fw-bold text-white mb-1 fs-6 text-truncate" :title="roleGroup.role.name">{{ roleGroup.role.name }}</h5>
                  <span class="role-feature-count-badge">
                    <i class="bi bi-key-fill me-1"></i>
                    {{ roleGroup.features.length }} {{ roleGroup.features.length === 1 ? 'Feature' : 'Features' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Card Body Content -->
            <div class="card-body p-4 d-flex flex-column justify-content-between">
              <div class="mb-3">
                <span class="fs-8 text-muted fw-semibold d-block mb-1.5">Role Privileges:</span>
                <p class="text-muted fs-7 mb-0 line-clamp-2" style="min-height: 2.4rem;">
                  {{ roleGroup.role.description || `Configured access privileges and feature permissions for ${roleGroup.role.name}.` }}
                </p>
              </div>

              <!-- Action Buttons Row inside Card Footer (Icon-only matching Events Page) -->
              <div class="d-flex align-items-center justify-content-end gap-2 pt-3 border-top mt-2">
                <div class="d-flex align-items-center gap-2">
                  <button
                    class="btn btn-outline-secondary btn-sm rounded-3 fw-semibold fs-7 d-flex align-items-center justify-content-center py-2 px-2.5 shadow-2xs"
                    @click="openViewModal(roleGroup)"
                    title="View Granted Features"
                  >
                    <i class="bi bi-eye-fill small-action-icon text-slate-700"></i>
                  </button>

                  <button
                    class="btn btn-outline-success btn-sm rounded-3 fw-semibold fs-7 d-flex align-items-center justify-content-center py-2 px-2.5 shadow-2xs"
                    @click="openEditPermissionsModal(roleGroup)"
                    title="Edit Role Permissions"
                  >
                    <i class="bi bi-pencil-fill small-action-icon"></i>
                  </button>

                  <button
                    class="btn btn-outline-danger btn-sm rounded-3 fw-semibold fs-7 d-flex align-items-center justify-content-center py-2 px-2.5 shadow-2xs"
                    @click="confirmClearAllRoleFeatures(roleGroup)"
                    title="Clear All Permissions"
                    :disabled="roleGroup.features.length === 0"
                  >
                    <i class="bi bi-trash-fill small-action-icon"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Pagination Bar -->
      <div v-if="filteredRoleGroups.length > 0" class="pagination-footer card border-0 shadow-sm rounded-4 d-flex align-items-center justify-content-between flex-nowrap gap-3 px-4 py-3 bg-white mt-auto">
        <!-- Left Side: Range Info & Per Page Selector in a single line -->
        <div class="d-flex align-items-center gap-3 fs-7 text-muted fw-medium text-nowrap flex-shrink-0">
          <div>
            Showing <span class="fw-bold text-slate-900">{{ (currentPage - 1) * perPage + 1 }}</span> to <span class="fw-bold text-slate-900">{{ Math.min(currentPage * perPage, filteredRoleGroups.length) }}</span> of <span class="fw-bold text-slate-900">{{ filteredRoleGroups.length }}</span> roles
          </div>

          <div class="d-flex align-items-center gap-1.5 ms-2">
            <span class="fs-8 text-muted fw-semibold">Per page:</span>
            <select v-model="perPage" class="form-select form-select-sm rounded-3 fs-8 py-1 px-2 border-slate-200 shadow-2xs" style="width: auto;">
              <option :value="6">6</option>
              <option :value="12">12</option>
              <option :value="24">24</option>
              <option :value="48">48</option>
            </select>
          </div>
        </div>

        <!-- Right Side: Page Numbers Navigation in a single line -->
        <nav v-if="totalPages > 1" aria-label="Page navigation" class="ms-auto flex-shrink-0">
          <ul class="pagination pagination-sm mb-0 gap-1 flex-nowrap">
            <li class="page-item" :class="{ disabled: currentPage === 1 }">
              <button class="page-link rounded-3 border-0 shadow-2xs d-flex align-items-center justify-content-center p-0" style="width: 32px; height: 32px;" @click="currentPage--" :disabled="currentPage === 1">
                <i class="bi bi-chevron-left fs-8"></i>
              </button>
            </li>
            <li
              v-for="page in totalPages"
              :key="page"
              class="page-item"
              :class="{ active: currentPage === page }"
            >
              <button class="page-link rounded-3 border-0 shadow-2xs d-flex align-items-center justify-content-center p-0" style="width: 32px; height: 32px;" @click="currentPage = page">
                {{ page }}
              </button>
            </li>
            <li class="page-item" :class="{ disabled: currentPage === totalPages }">
              <button class="page-link rounded-3 border-0 shadow-2xs d-flex align-items-center justify-content-center p-0" style="width: 32px; height: 32px;" @click="currentPage++" :disabled="currentPage === totalPages">
                <i class="bi bi-chevron-right fs-8"></i>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <!-- View Granted Features Modal -->
    <CommonModal
      v-model="showViewModal"
      :title="`Permissions: ${selectedRoleGroup?.role.name || 'Role'}`"
      icon="bi-shield-check"
      size="lg"
    >
      <div v-if="selectedRoleGroup">
        <div class="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
          <div>
            <span class="fs-7 text-muted fw-medium">Active granted features for this role:</span>
            <span class="badge bg-green-subtle text-green-700 rounded-pill px-2.5 py-1 ms-2 fs-7 fw-bold">
              {{ selectedRoleGroup.features.length }} Modules
            </span>
          </div>
        </div>

        <div v-if="selectedRoleGroup.features.length > 0" class="row g-2.5">
          <div
            v-for="item in selectedRoleGroup.features"
            :key="item.id"
            class="col-12 col-sm-6"
          >
            <div class="feature-item-row p-3 border rounded-3 bg-white d-flex align-items-center justify-content-between shadow-2xs">
              <div class="d-flex align-items-center gap-2.5">
                <span class="feature-icon-badge">
                  <i class="bi bi-box-seam"></i>
                </span>
                <div>
                  <span class="fw-semibold text-slate-900 d-block fs-7">{{ item.feature_name }}</span>
                  <small class="text-muted fs-8">Granted Module</small>
                </div>
              </div>
              <button
                class="btn btn-outline-danger btn-sm border-0 rounded-circle p-1 d-flex align-items-center justify-content-center"
                style="width: 32px; height: 32px;"
                @click="confirmRevoke(item)"
                title="Revoke Permission"
              >
                <i class="bi bi-trash-fill fs-7"></i>
              </button>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-5">
          <i class="bi bi-shield-slash text-muted opacity-40 fs-1"></i>
          <p class="fs-7 text-muted fw-medium mt-2 mb-0">No features assigned to this role yet.</p>
        </div>
      </div>
    </CommonModal>

    <!-- Assign Batch Features Modal -->
    <CommonModal
      v-model="showModal"
      :title="`Assign Features to ${getRoleName(Number(form.role_id))}`"
      icon="bi-plus-circle-fill"
      size="md"
    >
      <form @submit.prevent="handleSubmit">
        <div class="mb-3">
          <label class="form-label fw-semibold text-slate-700">Target Role <span class="text-danger">*</span></label>
          <select v-model.number="form.role_id" class="form-select py-2 rounded-3" required>
            <option value="" disabled>Select a role...</option>
            <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.name }}</option>
          </select>
        </div>

        <div class="mb-4">
          <div class="d-flex align-items-center justify-content-between mb-2">
            <label class="form-label fw-semibold text-slate-700 mb-0">Select Features to Grant</label>
            <button
              type="button"
              class="btn btn-link fs-8 p-0 text-decoration-none text-green-600 fw-semibold"
              @click="selectAllAvailableFeatures"
            >
              Select All Unassigned
            </button>
          </div>

          <div class="feature-checkboxes-container p-3 border rounded-3 bg-light-subtle max-vh-40 overflow-y-auto">
            <div
              v-for="feature in features"
              :key="feature.id"
              class="form-check p-2.5 rounded-2 hover-bg-white d-flex align-items-center justify-content-between mb-1"
            >
              <div class="d-flex align-items-center gap-2.5">
                <input
                  :id="`feat-${feature.id}`"
                  type="checkbox"
                  class="form-check-input mt-0 cursor-pointer"
                  :value="feature.id"
                  v-model="selectedFeatureIds"
                  :disabled="isFeatureAlreadyAssigned(feature.id)"
                />
                <label
                  :for="`feat-${feature.id}`"
                  class="form-check-label fs-7 fw-medium text-slate-800 cursor-pointer mb-0"
                  :class="{ 'opacity-50 text-decoration-line-through': isFeatureAlreadyAssigned(feature.id) }"
                >
                  {{ feature.name }}
                </label>
              </div>
              <span v-if="isFeatureAlreadyAssigned(feature.id)" class="badge bg-secondary-subtle text-secondary fs-8 rounded-pill px-2 py-1">
                Already Granted
              </span>
            </div>
          </div>
          <div v-if="formError" class="invalid-feedback d-block mt-2">{{ formError }}</div>
        </div>

        <div class="modal-footer-row">
          <button type="button" class="btn-cancel" @click="showModal = false">Cancel</button>
          <button type="submit" class="btn-submit" :disabled="saving || selectedFeatureIds.length === 0">
            <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
            Save Permissions ({{ selectedFeatureIds.length }})
          </button>
        </div>
      </form>
    </CommonModal>

    <!-- Revoke Single Permission Confirm Modal -->
    <CommonModal
      v-model="showDeleteModal"
      title="Revoke Permission"
      icon="bi-exclamation-triangle-fill"
      variant="danger"
      size="sm"
    >
      <div class="text-center">
        <p class="text-slate-700 fs-6 mb-1">
          Revoke feature <strong>{{ revokingItem?.feature_name }}</strong> from role <strong>{{ revokingItem?.role_name }}</strong>?
        </p>
        <p class="text-muted fs-7 mb-4">Users in this role will lose access to this module.</p>
        <div class="modal-footer-row justify-content-center">
          <button class="btn-cancel" @click="showDeleteModal = false">Cancel</button>
          <button class="btn-danger-confirm" @click="handleRevoke" :disabled="saving">
            <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
            Revoke
          </button>
        </div>
      </div>
    </CommonModal>

    <!-- Clear All Permissions Confirm Modal -->
    <CommonModal
      v-model="showClearAllModal"
      title="Clear All Permissions"
      icon="bi-exclamation-triangle-fill"
      variant="danger"
      size="sm"
    >
      <div class="text-center">
        <p class="text-slate-700 fs-6 mb-1">
          Clear all <strong>{{ clearingRoleGroup?.features.length }}</strong> permissions for role <strong>{{ clearingRoleGroup?.role.name }}</strong>?
        </p>
        <p class="text-muted fs-7 mb-4">All granted module accesses will be revoked for this role.</p>
        <div class="modal-footer-row justify-content-center">
          <button class="btn-cancel" @click="showClearAllModal = false">Cancel</button>
          <button class="btn-danger-confirm" @click="handleClearAllRoleFeatures" :disabled="saving">
            <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
            Clear All
          </button>
        </div>
      </div>
    </CommonModal>
  </div>
</template>

<script setup lang="ts">
import type { RoleFeature } from '~/types/role-feature';
import type { Role } from '~/types/auth';
import type { Feature } from '~/types/feature';

definePageMeta({ layout: 'default' });

const push = usePush();
const token = useCookie<string | null>('token');

const roles = ref<Role[]>([]);
const features = ref<Feature[]>([]);
const roleFeatures = ref<RoleFeature[]>([]);

const loading = ref(true);
const saving = ref(false);
const searchQuery = ref('');

// Modal state
const showModal = ref(false);
const showViewModal = ref(false);
const showDeleteModal = ref(false);
const revokingItem = ref<RoleFeature | null>(null);
const selectedRoleGroup = ref<any>(null);

function openViewModal(roleGroup: any) {
  selectedRoleGroup.value = roleGroup;
  showViewModal.value = true;
}

const form = reactive({
  role_id: '' as string | number,
  feature_id: '' as string | number,
});
const formError = ref('');

function authHeaders() {
  return {
    Authorization: `Bearer ${token.value}`,
    Accept: 'application/json',
  };
}

function getRoleName(roleId?: number) {
  if (!roleId) return 'Role';
  const found = roles.value.find((r) => r.id === Number(roleId));
  return found ? found.name : `Role #${roleId}`;
}

function getFeatureName(featureId?: number) {
  if (!featureId) return 'Feature';
  const found = features.value.find((f) => f.id === Number(featureId));
  return found ? found.name : `Feature #${featureId}`;
}

async function fetchData() {
  loading.value = true;
  try {
    const [rolesRes, featuresRes, rfRes] = await Promise.all([
      $fetch<any>('/api/roles', { headers: authHeaders() }),
      $fetch<any>('/api/features', { headers: authHeaders() }),
      $fetch<any>('/api/role-features', { headers: authHeaders() }),
    ]);

    roles.value = Array.isArray(rolesRes?.data?.roles) ? rolesRes.data.roles : (Array.isArray(rolesRes?.data) ? rolesRes.data : []);
    features.value = Array.isArray(featuresRes?.data?.features) ? featuresRes.data.features : (Array.isArray(featuresRes?.data) ? featuresRes.data : []);
    roleFeatures.value = Array.isArray(rfRes?.data?.role_features) ? rfRes.data.role_features : (Array.isArray(rfRes?.data) ? rfRes.data : []);
  } catch (err: any) {
    console.error('Failed to load role features matrix data:', err);
    push.error({ title: 'Error', message: 'Failed to load permissions matrix.' });
  } finally {
    loading.value = false;
  }
}

// Group features under their respective roles
const roleGroups = computed(() => {
  return roles.value.map((role) => {
    const matched = roleFeatures.value
      .filter((rf) => rf.role_id === role.id)
      .map((rf) => {
        const feat = features.value.find((f) => f.id === rf.feature_id);
        return {
          ...rf,
          role_name: role.name,
          feature_name: feat ? feat.name : `Feature #${rf.feature_id}`,
        };
      });

    return {
      role,
      features: matched,
    };
  });
});

const filteredRoleGroups = computed(() => {
  if (!searchQuery.value.trim()) return roleGroups.value;
  const q = searchQuery.value.toLowerCase().trim();

  return roleGroups.value.filter((group) => {
    const roleMatches = group.role.name.toLowerCase().includes(q);
    const featureMatches = group.features.some((f) => f.feature_name.toLowerCase().includes(q));
    return roleMatches || featureMatches;
  });
});

const currentPage = ref(1);
const perPage = ref(6);

watch([perPage, searchQuery], () => {
  currentPage.value = 1;
});

const totalPages = computed(() => {
  return Math.ceil(filteredRoleGroups.value.length / perPage.value) || 1;
});

const paginatedRoleGroups = computed(() => {
  const start = (currentPage.value - 1) * perPage.value;
  return filteredRoleGroups.value.slice(start, start + perPage.value);
});

const selectedFeatureIds = ref<number[]>([]);

function isFeatureAlreadyAssigned(featureId: number): boolean {
  if (!form.role_id) return false;
  return roleFeatures.value.some(
    (rf) => rf.role_id === Number(form.role_id) && rf.feature_id === featureId
  );
}

function selectAllAvailableFeatures() {
  if (!form.role_id) return;
  const unassigned = features.value
    .filter((f) => !isFeatureAlreadyAssigned(f.id))
    .map((f) => f.id);
  selectedFeatureIds.value = [...unassigned];
}

function openAssignModal(roleId?: number) {
  form.role_id = roleId || roles.value[0]?.id || '';
  selectedFeatureIds.value = [];
  formError.value = '';
  showModal.value = true;
}

watch(() => form.role_id, () => {
  selectedFeatureIds.value = [];
});

async function handleSubmit() {
  if (!form.role_id) {
    formError.value = 'Please select a role.';
    return;
  }
  if (selectedFeatureIds.value.length === 0) {
    formError.value = 'Please select at least one feature to grant.';
    return;
  }

  formError.value = '';
  saving.value = true;

  try {
    const roleId = Number(form.role_id);
    const promises = selectedFeatureIds.value.map((featureId) =>
      $fetch('/api/role-features', {
        method: 'POST',
        body: { role_id: roleId, feature_id: featureId },
        headers: authHeaders(),
      })
    );

    await Promise.all(promises);

    push.success({ title: 'Batch Granted', message: `Granted ${selectedFeatureIds.value.length} feature(s) to ${getRoleName(roleId)}.` });
    showModal.value = false;
    selectedFeatureIds.value = [];
    await fetchData();
  } catch (err: any) {
    formError.value = err?.data?.message || 'Failed to grant some features.';
  } finally {
    saving.value = false;
  }
}

const showClearAllModal = ref(false);
const clearingRoleGroup = ref<any>(null);

function openEditPermissionsModal(roleGroup: any) {
  form.role_id = roleGroup.role.id;
  selectedFeatureIds.value = roleGroup.features.map((f: any) => f.feature_id);
  formError.value = '';
  showModal.value = true;
}

function confirmClearAllRoleFeatures(roleGroup: any) {
  clearingRoleGroup.value = roleGroup;
  showClearAllModal.value = true;
}

async function handleClearAllRoleFeatures() {
  if (!clearingRoleGroup.value || clearingRoleGroup.value.features.length === 0) return;
  saving.value = true;

  try {
    const promises = clearingRoleGroup.value.features.map((rf: any) =>
      $fetch(`/api/role-features/${rf.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
    );

    await Promise.all(promises);

    push.success({
      title: 'Permissions Cleared',
      message: `Cleared all features for role "${clearingRoleGroup.value.role.name}".`,
    });
    showClearAllModal.value = false;
    clearingRoleGroup.value = null;
    await fetchData();
  } catch (err: any) {
    push.error({ title: 'Error', message: err?.data?.message || 'Failed to clear features.' });
  } finally {
    saving.value = false;
  }
}

function confirmRevoke(item: RoleFeature) {
  revokingItem.value = item;
  showDeleteModal.value = true;
}

async function handleRevoke() {
  if (!revokingItem.value) return;
  saving.value = true;

  try {
    await $fetch(`/api/role-features/${revokingItem.value.id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });

    push.success({ title: 'Revoked', message: 'Permission revoked successfully.' });
    showDeleteModal.value = false;
    revokingItem.value = null;
    await fetchData();
  } catch (err: any) {
    push.error({ title: 'Error', message: err?.data?.message || 'Failed to revoke feature.' });
  } finally {
    saving.value = false;
  }
}

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

.btn-create {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--green-500);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 0.55rem 1.2rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.18s;
}

.btn-create:hover {
  background: var(--green-600);
}

.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

/* ── Role Matrix Card Styling ─────────────────────── */
.role-matrix-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  min-height: 240px;
}

.role-matrix-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08) !important;
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

.role-avatar-badge {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--green-50);
  color: var(--green-500);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.hover-bg-green-subtle:hover {
  background-color: var(--green-50) !important;
  color: var(--green-700) !important;
  border-color: var(--green-200) !important;
}

.small-action-icon {
  font-size: 0.72rem !important;
}

/* ── View Features Modal ───────────────────────────── */
.feature-item-row {
  transition: all 0.18s ease;
}

.feature-item-row:hover {
  border-color: var(--green-200) !important;
  background-color: var(--green-50) !important;
}

.feature-icon-badge {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--green-50);
  color: var(--green-500);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.modal-footer-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
}

.btn-cancel {
  background: var(--slate-50);
  border: 1px solid var(--color-border);
  border-radius: 9px;
  padding: 0.5rem 1.1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--slate-700);
  cursor: pointer;
  transition: background 0.18s;
}

.btn-cancel:hover {
  background: var(--slate-100);
}

.btn-submit {
  background: var(--green-500);
  border: none;
  border-radius: 9px;
  padding: 0.5rem 1.3rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  transition: background 0.18s;
  display: inline-flex;
  align-items: center;
}

.btn-submit:hover:not(:disabled) {
  background: var(--green-600);
}

.btn-submit:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.btn-danger-confirm {
  background: var(--red-500);
  border: none;
  border-radius: 9px;
  padding: 0.5rem 1.3rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  transition: background 0.18s;
  display: inline-flex;
  align-items: center;
}

.btn-danger-confirm:hover:not(:disabled) {
  background: var(--red-700);
}

.btn-danger-confirm:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.bg-green-subtle { background-color: var(--green-50); }
.text-green-700 { color: var(--green-700); }
.text-green-600 { color: var(--green-600); }
.text-green-500 { color: var(--green-500); }
.px-2-5 { padding-left: 0.65rem; padding-right: 0.65rem; }
</style>
