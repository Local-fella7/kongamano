<template>
  <div class="roles-page">

    <!-- Page Header -->
    <div class="page-header d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
      <div class="d-flex align-items-center gap-3">
        <div class="header-icon-box">
          <i class="bi bi-shield-lock-fill"></i>
        </div>
        <div>
          <h2 class="page-heading">Roles Management</h2>
          <p class="page-subheading">Configure user access roles, security levels, and administrative privileges.</p>
        </div>
      </div>
      <button class="btn-create" @click="openCreate">
        <i class="bi bi-plus-lg fs-6"></i>
        <span>New Role</span>
      </button>
    </div>

    <!-- Table Card Container -->
    <div class="table-card shadow-sm rounded-4 border-0">

      <!-- Table Header Toolbar / Search -->
      <div class="table-toolbar d-flex align-items-center justify-content-between p-3 border-bottom flex-wrap gap-3">
        <div class="d-flex align-items-center gap-2">
          <span class="badge bg-green-subtle text-green-700 rounded-pill px-3 py-2 fs-7 fw-semibold">
            <i class="bi bi-layers-fill me-1"></i> {{ filteredRoles.length }} Total Roles
          </span>
        </div>

        <div class="search-box position-relative">
          <i class="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted fs-7"></i>
          <input
            v-model="searchQuery"
            type="text"
            class="form-control form-control-sm ps-5 pe-4 py-2 rounded-pill border-slate-200 search-input"
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

      <!-- Loading -->
      <div v-if="loading" class="state-box">
        <div class="spinner-border text-success" role="status"></div>
        <p class="mt-3 text-muted">Loading roles...</p>
      </div>

      <!-- Empty -->
      <div v-else-if="filteredRoles.length === 0" class="state-box">
        <i class="bi bi-shield-exclamation empty-icon"></i>
        <p class="mt-3 fw-semibold text-slate-700">No roles found</p>
        <p class="text-muted fs-7">
          {{ searchQuery ? 'Try adjusting your search criteria.' : 'Create your first role to get started.' }}
        </p>
        <button v-if="!searchQuery" class="btn-create mt-2" @click="openCreate">
          <i class="bi bi-plus-lg"></i> New Role
        </button>
        <button v-else class="btn btn-outline-secondary btn-sm mt-2 rounded-3 px-3" @click="searchQuery = ''">
          Clear Search
        </button>
      </div>

      <!-- Table -->
      <div v-else class="data-table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Role Name</th>
              <th>Created At</th>
              <th class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(role, index) in paginatedRoles" :key="role.id">
              <td class="row-index">{{ (currentPage - 1) * perPage + index + 1 }}</td>
              <td>
                <div class="role-name-cell">
                  <span class="role-badge">
                    <i class="bi bi-shield-fill-check"></i>
                  </span>
                  <span class="fw-semibold text-slate-900">{{ role.name }}</span>
                </div>
              </td>
              <td class="text-muted fs-7">{{ role.created_at ? formatDate(role.created_at) : '—' }}</td>
              <td class="text-end">
                <div class="action-btns">
                  <button class="btn-icon-action btn-edit" @click="openEdit(role)" title="Edit">
                    <i class="bi bi-pencil-fill"></i>
                  </button>
                  <button class="btn-icon-action btn-delete" @click="confirmDelete(role)" title="Delete">
                    <i class="bi bi-trash-fill"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div v-if="filteredRoles.length > 0" class="pagination-footer d-flex align-items-center justify-content-between flex-wrap gap-3 px-4 py-3 border-top bg-light-subtle">
        <div class="fs-7 text-muted fw-medium">
          Showing <span class="fw-bold text-slate-900">{{ startIndex + 1 }}</span> to <span class="fw-bold text-slate-900">{{ Math.min(endIndex, filteredRoles.length) }}</span> of <span class="fw-bold text-slate-900">{{ filteredRoles.length }}</span> entries
        </div>

        <div class="d-flex align-items-center gap-3">
          <!-- Items Per Page Dropdown -->
          <div class="d-flex align-items-center gap-2">
            <span class="fs-7 text-muted fw-medium text-nowrap">Show:</span>
            <select v-model="perPage" class="form-select form-select-sm rounded-pill fs-7 border-slate-200 shadow-2xs cursor-pointer px-3" style="width: auto;">
              <option :value="5">5 rows</option>
              <option :value="10">10 rows</option>
              <option :value="25">25 rows</option>
              <option :value="50">50 rows</option>
            </select>
          </div>

          <!-- Page Navigation -->
          <nav v-if="totalPages > 1" aria-label="Page navigation">
            <ul class="pagination pagination-sm mb-0 gap-1">
              <li class="page-item" :class="{ disabled: currentPage === 1 }">
                <button class="page-link rounded-circle border-0 shadow-2xs d-flex align-items-center justify-content-center p-0" style="width: 30px; height: 30px;" @click="currentPage--" :disabled="currentPage === 1">
                  <i class="bi bi-chevron-left fs-8"></i>
                </button>
              </li>
              <li
                v-for="page in totalPages"
                :key="page"
                class="page-item"
                :class="{ active: currentPage === page }"
              >
                <button class="page-link rounded-circle border-0 shadow-2xs d-flex align-items-center justify-content-center p-0" style="width: 30px; height: 30px;" @click="currentPage = page">
                  {{ page }}
                </button>
              </li>
              <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                <button class="page-link rounded-circle border-0 shadow-2xs d-flex align-items-center justify-content-center p-0" style="width: 30px; height: 30px;" @click="currentPage++" :disabled="currentPage === totalPages">
                  <i class="bi bi-chevron-right fs-8"></i>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>

    <!-- Create / Edit Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-box p-0 overflow-hidden position-relative">
          <div class="modal-header-row modal-header-gradient text-white p-3 px-4 mb-0 d-flex align-items-center justify-content-center">
            <h5 class="modal-title text-white fw-bold d-flex align-items-center justify-content-center gap-2 mb-0">
              <i :class="['bi', editingRole ? 'bi-pencil-square' : 'bi-plus-circle-fill']"></i>
              <span>{{ editingRole ? 'Edit Role' : 'New Role' }}</span>
            </h5>
            <button class="modal-close text-white opacity-75 hover-opacity-100 position-absolute end-0 me-3" @click="closeModal">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <form @submit.prevent="handleSubmit" class="p-4">
            <div class="mb-4">
              <label class="form-label fw-semibold text-slate-700">Role Name <span class="text-danger">*</span></label>
              <input
                v-model="form.name"
                type="text"
                class="form-control"
                :class="{ 'is-invalid': formError }"
                placeholder="e.g. Supervisor, Coordinator"
                required
                autofocus
              />
              <div v-if="formError" class="invalid-feedback d-block mt-1">{{ formError }}</div>
            </div>

            <div class="modal-footer-row">
              <button type="button" class="btn-cancel" @click="closeModal">Cancel</button>
              <button type="submit" class="btn-submit" :disabled="saving">
                <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
                {{ editingRole ? 'Save Changes' : 'Create Role' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirm Modal -->
    <Teleport to="body">
      <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
        <div class="modal-box modal-box--sm">
          <div class="delete-icon-wrap">
            <i class="bi bi-trash-fill"></i>
          </div>
          <h5 class="fw-bold text-slate-900 text-center mt-3">Delete Role</h5>
          <p class="text-muted text-center fs-7 mt-1">
            Are you sure you want to delete <strong>{{ deletingRole?.name }}</strong>?
            This action cannot be undone.
          </p>
          <div class="modal-footer-row mt-4">
            <button class="btn-cancel" @click="showDeleteModal = false">Cancel</button>
            <button class="btn-danger-confirm" @click="handleDelete" :disabled="saving">
              <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
              Yes, Delete
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import type { Role } from '~/types/auth';
import type { ApiResponse } from '~/types/api';

definePageMeta({ layout: 'default' });

const push = usePush();
const token = useCookie<string | null>('token');

const roles = ref<Role[]>([]);
const loading = ref(true);
const saving = ref(false);

// Search, Filter & Pagination State
const searchQuery = ref('');
const currentPage = ref(1);
const perPage = ref(10);

// Modal state
const showModal = ref(false);
const showDeleteModal = ref(false);
const editingRole = ref<Role | null>(null);
const deletingRole = ref<Role | null>(null);

const form = reactive({ name: '' });
const formError = ref('');

// Reset pagination when search query or perPage changes
watch([searchQuery, perPage], () => {
  currentPage.value = 1;
});

// ── Computed Properties ─────────────────────────────
const filteredRoles = computed(() => {
  let list = [...roles.value];

  // Search filter
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    list = list.filter((r) => r.name.toLowerCase().includes(q));
  }

  // Sort descending by ID (newest first)
  list.sort((a, b) => b.id - a.id);

  return list;
});

const totalPages = computed(() => {
  return Math.ceil(filteredRoles.value.length / perPage.value) || 1;
});

const startIndex = computed(() => {
  return (currentPage.value - 1) * perPage.value;
});

const endIndex = computed(() => {
  return startIndex.value + perPage.value;
});

const paginatedRoles = computed(() => {
  return filteredRoles.value.slice(startIndex.value, endIndex.value);
});

// ── Helpers ──────────────────────────────────────────
function authHeaders() {
  return {
    Authorization: `Bearer ${token.value}`,
    Accept: 'application/json',
  };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-KE', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ── Fetch ─────────────────────────────────────────────
async function fetchRoles() {
  loading.value = true;
  try {
    const res = await $fetch<any>('/api/roles', {
      headers: authHeaders(),
    });

    if (Array.isArray(res?.data?.roles)) {
      roles.value = res.data.roles;
    } else if (Array.isArray(res?.data)) {
      roles.value = res.data;
    } else if (Array.isArray(res)) {
      roles.value = res;
    } else {
      roles.value = [];
    }
  } catch (err: any) {
    console.error('[Roles] Fetch error:', err);
    push.error({ title: 'Error', message: err?.data?.message || 'Failed to load roles.' });
  } finally {
    loading.value = false;
  }
}

// ── Create ────────────────────────────────────────────
function openCreate() {
  editingRole.value = null;
  form.name = '';
  formError.value = '';
  showModal.value = true;
}

// ── Edit ──────────────────────────────────────────────
function openEdit(role: Role) {
  editingRole.value = role;
  form.name = role.name;
  formError.value = '';
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  editingRole.value = null;
  form.name = '';
  formError.value = '';
}

// ── Submit ────────────────────────────────────────────
async function handleSubmit() {
  if (!form.name.trim()) {
    formError.value = 'Role name is required.';
    return;
  }

  formError.value = '';
  saving.value = true;

  try {
    if (editingRole.value) {
      await $fetch(`/api/roles/${editingRole.value.id}`, {
        method: 'PUT',
        body: { name: form.name },
        headers: authHeaders(),
      });
      push.success({ title: 'Updated', message: `Role "${form.name}" updated successfully.` });
    } else {
      await $fetch('/api/roles', {
        method: 'POST',
        body: { name: form.name },
        headers: authHeaders(),
      });
      push.success({ title: 'Created', message: `Role "${form.name}" created successfully.` });
    }

    closeModal();
    await fetchRoles();
  } catch (err: any) {
    formError.value = err?.data?.message || 'Something went wrong. Please try again.';
  } finally {
    saving.value = false;
  }
}

// ── Delete ────────────────────────────────────────────
function confirmDelete(role: Role) {
  deletingRole.value = role;
  showDeleteModal.value = true;
}

async function handleDelete() {
  if (!deletingRole.value) return;
  saving.value = true;
  try {
    await $fetch(`/api/roles/${deletingRole.value.id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    push.success({ title: 'Deleted', message: `Role "${deletingRole.value.name}" has been removed.` });
    showDeleteModal.value = false;
    deletingRole.value = null;
    await fetchRoles();
  } catch (err: any) {
    push.error({ title: 'Error', message: err?.data?.message || 'Failed to delete role.' });
  } finally {
    saving.value = false;
  }
}

onMounted(fetchRoles);
</script>

<style scoped>
/* ── Header Icon Box ──────────────────────────────── */
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

.search-input {
  width: 260px;
  transition: width 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.search-input:focus {
  width: 320px;
  border-color: var(--green-500);
  box-shadow: 0 0 0 3px rgba(46, 125, 34, 0.15);
}

.bg-green-subtle {
  background-color: var(--green-50);
}

.text-green-700 {
  color: var(--green-700);
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

/* ── Create Button ─────────────────────────────────── */
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

/* ── Table Card ────────────────────────────────────── */
.table-card {
  background: #fff;
  border-radius: 14px;
  border: 1px solid var(--color-border);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.data-table-wrapper {
  flex: 1;
  overflow-x: auto;
}

.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.empty-icon {
  font-size: 3rem;
  color: var(--slate-100);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead tr {
  background: var(--green-50);
  border-bottom: 1.5px solid var(--green-100);
}

.data-table th {
  padding: 0.85rem 1.25rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--green-700);
}

.data-table td {
  padding: 0.9rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
  font-size: 0.875rem;
  color: var(--slate-700);
  vertical-align: middle;
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.data-table tbody tr:hover {
  background: var(--green-50);
}

.row-index {
  color: var(--slate-300);
  font-size: 0.8rem;
  width: 40px;
}

.role-name-cell {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.role-badge {
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

/* ── Action Buttons ────────────────────────────────── */
.action-btns {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: flex-end;
}

.btn-icon-action {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.18s;
  background: transparent;
}

.btn-edit {
  border: 1.5px solid var(--green-500);
  color: var(--green-600);
}

.btn-edit:hover {
  background: var(--green-500);
  color: #fff;
}

.btn-delete {
  border: 1.5px solid var(--red-500);
  color: var(--red-500);
}

.btn-delete:hover {
  background: var(--red-500);
  color: #fff;
}

/* ── Pagination Styling ───────────────────────────── */
.pagination .page-item .page-link {
  color: var(--slate-700);
  background-color: #fff;
  border: 1px solid var(--color-border);
  font-weight: 500;
  transition: all 0.18s ease;
}

.pagination .page-item .page-link:hover:not(:disabled) {
  background-color: var(--green-50);
  color: var(--green-700);
}

.pagination .page-item.active .page-link {
  background-color: var(--green-500) !important;
  color: #fff !important;
  font-weight: 700;
  box-shadow: 0 4px 10px rgba(46, 125, 34, 0.3);
}

.pagination .page-item.disabled .page-link {
  color: var(--slate-300);
  background-color: transparent;
  opacity: 0.5;
}

/* ── Modal ─────────────────────────────────────────── */
.modal-header-gradient {
  background: linear-gradient(135deg, var(--green-600) 0%, var(--green-500) 50%, var(--green-700) 100%);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(28, 28, 36, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(2px);
  padding: 1rem;
}

.modal-box {
  background: #fff;
  border-radius: 16px;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  animation: modalIn 0.2s ease;
}

.modal-box--sm {
  max-width: 380px;
}

@keyframes modalIn {
  from { opacity: 0; transform: translateY(-12px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.modal-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title {
  font-size: 1.05rem;
  font-weight: 700;
  margin: 0;
}

.modal-close {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  border-radius: 8px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
  transition: all 0.18s;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.3);
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

/* ── Delete Modal ──────────────────────────────────── */
.delete-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--red-50);
  color: var(--red-500);
  font-size: 1.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
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
</style>
