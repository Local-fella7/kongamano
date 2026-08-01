<template>
  <div class="users-page">
    <!-- Page Header -->
    <div class="page-header d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
      <div class="d-flex align-items-center gap-3">
        <div class="header-icon-box">
          <i class="bi bi-shield-lock-fill"></i>
        </div>
        <div>
          <h2 class="page-heading">Users & Staff</h2>
          <p class="page-subheading">Manage system users, staff accounts, roles, and access credentials.</p>
        </div>
      </div>
      <button class="btn-create" @click="openCreate">
        <i class="bi bi-plus-lg fs-6"></i>
        <span>New User</span>
      </button>
    </div>

    <!-- Role Filter -->
    <div class="filter-bar card border-0 shadow-sm rounded-4 p-3 mb-4">
      <div class="d-flex align-items-center flex-wrap gap-3">
        <label class="filter-label mb-0">
          <i class="bi bi-funnel-fill me-1"></i>
          Filter by Role
        </label>
        <select
          v-model="roleFilter"
          class="form-select form-select-sm filter-select"
          :disabled="rolesLoading"
        >
          <option :value="null">All Roles</option>
          <option v-for="role in roles" :key="role.id" :value="role.id">
            {{ role.name }}
          </option>
        </select>
        <button
          v-if="roleFilter"
          class="btn btn-link btn-sm text-muted text-decoration-none p-0"
          @click="roleFilter = null"
        >
          Clear filter
        </button>
      </div>
    </div>

    <!-- Reusable Data Table -->
    <CommonDataTable
      v-model:searchQuery="crud.searchQuery.value"
      v-model:currentPage="crud.currentPage.value"
      v-model:perPage="crud.perPage.value"
      :loading="crud.loading.value"
      :totalCount="crud.filteredItems.value.length"
      :totalPages="crud.totalPages.value"
      :startIndex="crud.startIndex.value"
      :endIndex="crud.endIndex.value"
    >
      <table class="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>User</th>
            <th>Mobile</th>
            <th>Role</th>
            <th>Created At</th>
            <th class="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(user, index) in crud.paginatedItems.value" :key="user.id">
            <td class="row-index">{{ (crud.currentPage.value - 1) * crud.perPage.value + index + 1 }}</td>
            <td>
              <div class="user-name-cell">
                <span class="user-avatar">{{ getInitials(user) }}</span>
                <div>
                  <span class="fw-semibold text-slate-900 d-block">{{ user.first_name }} {{ user.last_name }}</span>
                  <small class="text-muted">@{{ user.username }}</small>
                </div>
              </div>
            </td>
            <td class="text-muted fs-7">{{ user.mobile || '—' }}</td>
            <td>
              <span class="role-pill">{{ user.role || getRoleName(user.role_id) }}</span>
            </td>
            <td class="text-muted fs-7">{{ user.created_at ? formatDate(user.created_at) : '—' }}</td>
            <td class="text-end">
              <div class="action-btns">
                <button class="btn-icon-action btn-view" @click="openView(user)" title="View Details">
                  <i class="bi bi-eye-fill"></i>
                </button>
                <button class="btn-icon-action btn-edit" @click="openEdit(user)" title="Edit">
                  <i class="bi bi-pencil-fill"></i>
                </button>
                <button class="btn-icon-action btn-delete" @click="confirmDelete(user)" title="Delete">
                  <i class="bi bi-trash-fill"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </CommonDataTable>

    <!-- Create / Edit Modal -->
    <CommonModal
      v-model="showModal"
      :title="editingUser ? 'Edit User' : 'New User'"
      :icon="editingUser ? 'bi-pencil-square' : 'bi-person-plus-fill'"
      size="lg"
    >
      <form @submit.prevent="handleSubmit">
        <div class="row g-3 mb-3">
          <div class="col-md-6">
            <label class="form-label fw-semibold text-slate-700">First Name <span class="text-danger">*</span></label>
            <input
              v-model="form.first_name"
              type="text"
              class="form-control"
              :class="{ 'is-invalid': formErrors.first_name }"
              placeholder="e.g. Bryson"
              required
              autofocus
            />
            <div v-if="formErrors.first_name" class="invalid-feedback d-block mt-1">{{ formErrors.first_name }}</div>
          </div>
          <div class="col-md-6">
            <label class="form-label fw-semibold text-slate-700">Last Name <span class="text-danger">*</span></label>
            <input
              v-model="form.last_name"
              type="text"
              class="form-control"
              :class="{ 'is-invalid': formErrors.last_name }"
              placeholder="e.g. Mmari"
              required
            />
            <div v-if="formErrors.last_name" class="invalid-feedback d-block mt-1">{{ formErrors.last_name }}</div>
          </div>
        </div>

        <div class="row g-3 mb-3">
          <div class="col-md-6">
            <label class="form-label fw-semibold text-slate-700">Username <span class="text-danger">*</span></label>
            <input
              v-model="form.username"
              type="text"
              class="form-control"
              :class="{ 'is-invalid': formErrors.username }"
              placeholder="e.g. brymmari"
              required
            />
            <div v-if="formErrors.username" class="invalid-feedback d-block mt-1">{{ formErrors.username }}</div>
          </div>
          <div class="col-md-6">
            <label class="form-label fw-semibold text-slate-700">Mobile <span class="text-danger">*</span></label>
            <input
              v-model="form.mobile"
              type="tel"
              class="form-control"
              :class="{ 'is-invalid': formErrors.mobile }"
              placeholder="e.g. 0769032050"
              required
            />
            <div v-if="formErrors.mobile" class="invalid-feedback d-block mt-1">{{ formErrors.mobile }}</div>
          </div>
        </div>

        <div class="row g-3 mb-4">
          <div class="col-md-6">
            <label class="form-label fw-semibold text-slate-700">
              PIN
              <span v-if="!editingUser" class="text-danger">*</span>
            </label>
            <input
              v-if="!editingUser"
              v-model="form.pin"
              type="password"
              class="form-control"
              :class="{ 'is-invalid': formErrors.pin }"
              placeholder="Enter login PIN"
              required
              autocomplete="new-password"
            />
            <input
              v-else
              type="text"
              class="form-control bg-light"
              value="••••"
              disabled
              aria-label="PIN hidden for security"
            />
            <small v-if="editingUser" class="text-muted fs-8 d-block mt-1">PIN cannot be changed from this form.</small>
            <div v-if="formErrors.pin" class="invalid-feedback d-block mt-1">{{ formErrors.pin }}</div>
          </div>
          <div class="col-md-6">
            <label class="form-label fw-semibold text-slate-700">Role <span class="text-danger">*</span></label>
            <select
              v-model="form.role_id"
              class="form-select"
              :class="{ 'is-invalid': formErrors.role_id }"
              required
              :disabled="rolesLoading"
            >
              <option value="" disabled>Select a role</option>
              <option v-for="role in roles" :key="role.id" :value="role.id">
                {{ role.name }}
              </option>
            </select>
            <div v-if="formErrors.role_id" class="invalid-feedback d-block mt-1">{{ formErrors.role_id }}</div>
          </div>
        </div>

        <div class="modal-footer-row">
          <button type="button" class="btn-cancel" @click="showModal = false">Cancel</button>
          <button type="submit" class="btn-submit" :disabled="crud.saving.value">
            <span v-if="crud.saving.value" class="spinner-border spinner-border-sm me-2"></span>
            {{ editingUser ? 'Save Changes' : 'Create User' }}
          </button>
        </div>
      </form>
    </CommonModal>

    <!-- View Details Modal -->
    <CommonModal
      v-model="showViewModal"
      title="User Details"
      icon="bi-person-circle"
      size="md"
    >
      <div v-if="viewLoading" class="text-center py-4">
        <div class="spinner-border text-success" role="status"></div>
        <p class="mt-3 text-muted mb-0">Loading user details...</p>
      </div>
      <div v-else-if="viewingUser" class="p-1">
        <div class="d-flex align-items-center gap-3 p-3 bg-light rounded-3 mb-3">
          <div class="user-avatar user-avatar--lg">{{ getInitials(viewingUser) }}</div>
          <div>
            <h6 class="fw-bold text-slate-900 mb-0">{{ viewingUser.first_name }} {{ viewingUser.last_name }}</h6>
            <small class="text-muted">@{{ viewingUser.username }}</small>
          </div>
        </div>

        <div class="row g-3 text-slate-700 fs-7">
          <div class="col-6">
            <span class="text-muted d-block fs-8">Mobile</span>
            <span class="fw-semibold">{{ viewingUser.mobile || '—' }}</span>
          </div>
          <div class="col-6">
            <span class="text-muted d-block fs-8">Role</span>
            <span class="role-pill">{{ viewingUser.role || getRoleName(viewingUser.role_id) }}</span>
          </div>
          <div class="col-6">
            <span class="text-muted d-block fs-8">Created At</span>
            <span class="fw-semibold">{{ viewingUser.created_at ? formatDate(viewingUser.created_at) : '—' }}</span>
          </div>
          <div class="col-6">
            <span class="text-muted d-block fs-8">Updated At</span>
            <span class="fw-semibold">{{ viewingUser.updated_at ? formatDate(viewingUser.updated_at) : '—' }}</span>
          </div>
        </div>

        <div class="mt-4 text-end">
          <button class="btn-cancel" @click="showViewModal = false">Close</button>
        </div>
      </div>
    </CommonModal>

    <!-- Delete Confirm Modal -->
    <CommonModal
      v-model="showDeleteModal"
      title="Delete User"
      icon="bi-exclamation-triangle-fill"
      variant="danger"
      size="sm"
    >
      <div class="text-center">
        <p class="text-slate-700 fs-6 mb-1">
          Are you sure you want to delete
          <strong>{{ deletingUser?.first_name }} {{ deletingUser?.last_name }}</strong>?
        </p>
        <p class="text-muted fs-7 mb-4">This action cannot be undone.</p>
        <div class="modal-footer-row justify-content-center">
          <button class="btn-cancel" @click="showDeleteModal = false">Cancel</button>
          <button class="btn-danger-confirm" @click="handleDelete" :disabled="crud.saving.value">
            <span v-if="crud.saving.value" class="spinner-border spinner-border-sm me-2"></span>
            Yes, Delete
          </button>
        </div>
      </div>
    </CommonModal>
  </div>
</template>

<script setup lang="ts">
import type { User, Role } from '~/types/auth';

definePageMeta({ layout: 'default' });

const push = usePush();
const token = useCookie<string | null>('token');

const roleFilter = ref<number | null>(null);
const queryParams = computed(() => (roleFilter.value ? { role_id: roleFilter.value } : {}));

const crud = useCrudApi<User>({
  endpoint: '/api/users',
  dataKey: 'users',
  itemKey: 'user',
  queryParams,
});

const roles = ref<Role[]>([]);
const rolesLoading = ref(false);

const showModal = ref(false);
const showViewModal = ref(false);
const showDeleteModal = ref(false);
const viewLoading = ref(false);
const viewingUser = ref<User | null>(null);
const editingUser = ref<User | null>(null);
const deletingUser = ref<User | null>(null);

const form = reactive({
  first_name: '',
  last_name: '',
  username: '',
  pin: '',
  mobile: '',
  role_id: '' as number | '',
});

const formErrors = reactive({
  first_name: '',
  last_name: '',
  username: '',
  pin: '',
  mobile: '',
  role_id: '',
});

function resetFormErrors() {
  formErrors.first_name = '';
  formErrors.last_name = '';
  formErrors.username = '';
  formErrors.pin = '';
  formErrors.mobile = '';
  formErrors.role_id = '';
}

function resetForm() {
  form.first_name = '';
  form.last_name = '';
  form.username = '';
  form.pin = '';
  form.mobile = '';
  form.role_id = '';
  resetFormErrors();
}

function getInitials(user: User) {
  const f = user.first_name?.[0] || 'U';
  const l = user.last_name?.[0] || '';
  return `${f}${l}`.toUpperCase();
}

function getRoleName(roleId: number) {
  return roles.value.find((role) => role.id === roleId)?.name || '—';
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-KE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

async function fetchRoles() {
  rolesLoading.value = true;
  try {
    const res = await $fetch<any>('/api/roles', {
      headers: {
        Authorization: `Bearer ${token.value}`,
        Accept: 'application/json',
      },
    });

    if (Array.isArray(res?.data?.roles)) {
      roles.value = res.data.roles;
    } else if (Array.isArray(res?.data)) {
      roles.value = res.data;
    }
  } catch (err: any) {
    push.error({ title: 'Error', message: err?.data?.message || 'Failed to load roles.' });
  } finally {
    rolesLoading.value = false;
  }
}

function openCreate() {
  editingUser.value = null;
  resetForm();
  showModal.value = true;
}

function openEdit(user: User) {
  editingUser.value = user;
  form.first_name = user.first_name;
  form.last_name = user.last_name;
  form.username = user.username;
  form.mobile = user.mobile;
  form.role_id = user.role_id;
  form.pin = '';
  resetFormErrors();
  showModal.value = true;
}

async function openView(user: User) {
  viewingUser.value = user;
  showViewModal.value = true;
  viewLoading.value = true;

  const details = await crud.fetchItem(user.id);
  if (details) {
    viewingUser.value = details;
  }

  viewLoading.value = false;
}

function validateForm() {
  resetFormErrors();
  let valid = true;

  if (!form.first_name.trim()) {
    formErrors.first_name = 'First name is required.';
    valid = false;
  }
  if (!form.last_name.trim()) {
    formErrors.last_name = 'Last name is required.';
    valid = false;
  }
  if (!form.username.trim()) {
    formErrors.username = 'Username is required.';
    valid = false;
  }
  if (!form.mobile.trim()) {
    formErrors.mobile = 'Mobile number is required.';
    valid = false;
  }
  if (!editingUser.value && !form.pin.trim()) {
    formErrors.pin = 'PIN is required for new users.';
    valid = false;
  }
  if (!form.role_id) {
    formErrors.role_id = 'Please select a role.';
    valid = false;
  }

  return valid;
}

async function handleSubmit() {
  if (!validateForm()) return;

  let success = false;

  if (editingUser.value) {
    success = await crud.updateItem(
      editingUser.value.id,
      {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        username: form.username.trim(),
        mobile: form.mobile.trim(),
        role_id: Number(form.role_id),
      },
      `User "${form.first_name} ${form.last_name}" updated successfully.`
    );
  } else {
    success = await crud.createItem(
      {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        username: form.username.trim(),
        pin: form.pin.trim(),
        mobile: form.mobile.trim(),
        role_id: Number(form.role_id),
      },
      `User "${form.first_name} ${form.last_name}" created successfully.`
    );
  }

  if (success) {
    showModal.value = false;
    resetForm();
  }
}

function confirmDelete(user: User) {
  deletingUser.value = user;
  showDeleteModal.value = true;
}

async function handleDelete() {
  if (!deletingUser.value) return;

  const success = await crud.deleteItem(
    deletingUser.value.id,
    `User "${deletingUser.value.first_name} ${deletingUser.value.last_name}" has been removed.`
  );

  if (success) {
    showDeleteModal.value = false;
    deletingUser.value = null;
  }
}

onMounted(async () => {
  await Promise.all([fetchRoles(), crud.fetchItems()]);
});
</script>

<style scoped>
.users-page {
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

.filter-bar {
  background: #fff;
}

.filter-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--slate-700);
}

.filter-select {
  max-width: 220px;
  border-radius: 9px;
  border-color: var(--color-border);
  font-size: 0.85rem;
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

.user-name-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--green-500);
  color: #fff;
  font-weight: 700;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-avatar--lg {
  width: 48px;
  height: 48px;
  font-size: 0.9rem;
}

.role-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  background: var(--green-50);
  color: var(--green-700);
  font-size: 0.75rem;
  font-weight: 600;
}

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

.btn-view {
  border: 1.5px solid var(--slate-300);
  color: var(--slate-700);
}

.btn-view:hover {
  background: var(--slate-700);
  color: #fff;
  border-color: var(--slate-700);
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

@media (max-width: 767.98px) {
  .filter-select {
    max-width: 100%;
    width: 100%;
  }
}
</style>
