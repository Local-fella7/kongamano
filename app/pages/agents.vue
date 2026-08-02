<template>
  <div class="agents-page d-flex flex-column min-vh-100">
    <!-- Page Header -->
    <div class="page-header d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
      <div class="d-flex align-items-center gap-3">
        <div class="header-icon-box">
          <i class="bi bi-person-badge-fill"></i>
        </div>
        <div>
          <h2 class="page-heading">Registration Agents</h2>
          <p class="page-subheading">Manage external registration agents, regional assignments, and user linkages.</p>
        </div>
      </div>
      <button class="btn-create" @click="openCreateModal">
        <i class="bi bi-plus-lg fs-6"></i>
        <span>Add Agent</span>
      </button>
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
            <th>Agent Name</th>
            <th>Reg No</th>
            <th>Linked Account</th>
            <th>Region / Country</th>
            <th>District / Ward</th>
            <th>Created At</th>
            <th class="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(agent, index) in crud.paginatedItems.value" :key="agent.id">
            <td class="row-index">{{ (crud.currentPage.value - 1) * crud.perPage.value + index + 1 }}</td>
            <td>
              <div class="agent-name-cell d-flex align-items-center gap-2.5">
                <span class="agent-badge">
                  <i class="bi bi-person-badge-fill"></i>
                </span>
                <span class="fw-semibold text-slate-900">{{ agent.name }}</span>
              </div>
            </td>
            <td>
              <span class="badge bg-green-subtle text-green-700 border border-green-200 rounded-pill px-2.5 py-1 fs-8 fw-bold">
                {{ agent.registration_no || 'N/A' }}
              </span>
            </td>
            <td>
              <span v-if="agent.user" class="fw-semibold text-slate-800 fs-7">
                <i class="bi bi-person-circle me-1 text-muted"></i>
                @{{ agent.user.username }}
              </span>
              <span v-else-if="agent.user_id" class="fw-medium text-slate-700 fs-7">
                User #{{ agent.user_id }}
              </span>
              <span v-else class="text-muted fs-7">—</span>
            </td>
            <td>
              <span class="fw-medium text-slate-800 fs-7">
                <i class="bi bi-geo-alt-fill text-danger me-1 fs-8"></i>
                {{ agent.region || '—' }} <span v-if="agent.country" class="text-muted">({{ agent.country }})</span>
              </span>
            </td>
            <td>
              <span class="text-slate-600 fs-7">
                {{ agent.district || '—' }} <span v-if="agent.ward">/ {{ agent.ward }}</span>
              </span>
            </td>
            <td>
              <span class="text-slate-600 fs-7">{{ agent.created_at ? formatDate(agent.created_at) : '—' }}</span>
            </td>
            <td class="text-end">
              <div class="action-btns">
                <button class="btn-icon-action btn-view" @click="openViewModal(agent)" title="View Agent Details">
                  <i class="bi bi-eye-fill"></i>
                </button>
                <button class="btn-icon-action btn-edit" @click="openEditModal(agent)" title="Edit Agent">
                  <i class="bi bi-pencil-fill"></i>
                </button>
                <button class="btn-icon-action btn-delete" @click="confirmDelete(agent)" title="Delete Agent">
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
      :title="editingId ? 'Edit Registration Agent' : 'Add Registration Agent'"
      icon="bi-person-badge-fill"
      size="lg"
    >
      <form @submit.prevent="handleSubmit">
        <div class="row g-3 mb-3">
          <!-- Agent Name (50%) -->
          <div class="col-12 col-md-6">
            <label class="form-label fw-semibold text-slate-700">Agent Name <span class="text-danger">*</span></label>
            <input
              v-model="form.name"
              type="text"
              class="form-control py-2 rounded-3"
              placeholder="e.g. Nairobi Central Agent"
              required
              autofocus
            />
          </div>

          <!-- Registration Number (50%) -->
          <div class="col-12 col-md-6">
            <label class="form-label fw-semibold text-slate-700">Registration Number</label>
            <input
              v-model="form.registration_no"
              type="text"
              class="form-control py-2 rounded-3"
              placeholder="e.g. AG-100"
            />
          </div>
        </div>

        <div class="row g-3 mb-3">
          <!-- Linked User Account (50%) -->
          <div class="col-12 col-md-6">
            <label class="form-label fw-semibold text-slate-700">Linked User Account</label>
            <select v-model="form.user_id" class="form-select py-2 rounded-3">
              <option :value="null">-- None (Unlinked) --</option>
              <option v-for="u in usersList" :key="u.id" :value="u.id">
                {{ u.first_name }} {{ u.last_name }} (@{{ u.username }})
              </option>
            </select>
          </div>

          <!-- Country (50%) -->
          <div class="col-12 col-md-6">
            <label class="form-label fw-semibold text-slate-700">Country</label>
            <input
              v-model="form.country"
              type="text"
              class="form-control py-2 rounded-3"
              placeholder="e.g. Kenya"
            />
          </div>
        </div>

        <div class="row g-3 mb-4">
          <!-- Region (33%) -->
          <div class="col-12 col-md-4">
            <label class="form-label fw-semibold text-slate-700">Region</label>
            <input
              v-model="form.region"
              type="text"
              class="form-control py-2 rounded-3"
              placeholder="e.g. Nairobi"
            />
          </div>

          <!-- District (33%) -->
          <div class="col-12 col-md-4">
            <label class="form-label fw-semibold text-slate-700">District</label>
            <input
              v-model="form.district"
              type="text"
              class="form-control py-2 rounded-3"
              placeholder="e.g. Westlands"
            />
          </div>

          <!-- Ward (33%) -->
          <div class="col-12 col-md-4">
            <label class="form-label fw-semibold text-slate-700">Ward</label>
            <input
              v-model="form.ward"
              type="text"
              class="form-control py-2 rounded-3"
              placeholder="e.g. Kilimani"
            />
          </div>
        </div>

        <div v-if="formError" class="invalid-feedback d-block mb-3">{{ formError }}</div>

        <div class="modal-footer-row">
          <button type="button" class="btn-cancel" @click="showModal = false">Cancel</button>
          <button type="submit" class="btn-submit" :disabled="crud.saving.value">
            <span v-if="crud.saving.value" class="spinner-border spinner-border-sm me-2"></span>
            {{ editingId ? 'Update Agent' : 'Save Agent' }}
          </button>
        </div>
      </form>
    </CommonModal>

    <!-- View Agent Details Modal -->
    <CommonModal
      v-model="showViewModal"
      title="Agent Details"
      icon="bi-person-badge-fill"
      size="md"
    >
      <div v-if="viewingItem" class="p-1">
        <div class="d-flex align-items-center gap-3 p-3 bg-light rounded-3 mb-3">
          <div class="header-icon-box shadow-2xs">
            <i class="bi bi-person-badge-fill"></i>
          </div>
          <div>
            <h6 class="fw-bold text-slate-900 mb-0.5">{{ viewingItem.name }}</h6>
            <span class="badge bg-green-subtle text-green-700 border border-green-200 rounded-pill px-2.5 py-1 fs-8 fw-bold">
              {{ viewingItem.registration_no || 'No Reg No' }}
            </span>
          </div>
        </div>

        <div class="row g-3 text-slate-700 fs-7 mb-3">
          <div class="col-6">
            <span class="text-muted d-block fs-8">Linked User</span>
            <span class="fw-semibold">{{ viewingItem.user ? `@${viewingItem.user.username}` : (viewingItem.user_id ? `User #${viewingItem.user_id}` : 'None') }}</span>
          </div>
          <div class="col-6">
            <span class="text-muted d-block fs-8">Country</span>
            <span class="fw-semibold">{{ viewingItem.country || '—' }}</span>
          </div>
          <div class="col-6">
            <span class="text-muted d-block fs-8">Region</span>
            <span class="fw-semibold">{{ viewingItem.region || '—' }}</span>
          </div>
          <div class="col-6">
            <span class="text-muted d-block fs-8">District</span>
            <span class="fw-semibold">{{ viewingItem.district || '—' }}</span>
          </div>
          <div class="col-6">
            <span class="text-muted d-block fs-8">Ward</span>
            <span class="fw-semibold">{{ viewingItem.ward || '—' }}</span>
          </div>
        </div>

        <div class="row g-2 text-slate-700 fs-8 border-top pt-3">
          <div class="col-6">
            <span class="text-muted d-block">Created At</span>
            <span class="fw-semibold">{{ viewingItem.created_at ? formatDate(viewingItem.created_at) : '—' }}</span>
          </div>
          <div class="col-6">
            <span class="text-muted d-block">Updated At</span>
            <span class="fw-semibold">{{ viewingItem.updated_at ? formatDate(viewingItem.updated_at) : '—' }}</span>
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
      title="Delete Agent"
      icon="bi-exclamation-triangle-fill"
      variant="danger"
      size="sm"
    >
      <div class="text-center">
        <p class="text-slate-700 fs-6 mb-1">
          Are you sure you want to delete <strong>{{ deletingItem?.name }}</strong>?
        </p>
        <p class="text-muted fs-7 mb-4">This action cannot be undone.</p>
        <div class="modal-footer-row justify-content-center">
          <button class="btn-cancel" @click="showDeleteModal = false">Cancel</button>
          <button class="btn-danger-confirm" @click="handleDelete" :disabled="crud.saving.value">
            <span v-if="crud.saving.value" class="spinner-border spinner-border-sm me-2"></span>
            Delete Agent
          </button>
        </div>
      </div>
    </CommonModal>
  </div>
</template>

<script setup lang="ts">
import type { Agent } from '~/types/agent';

definePageMeta({ layout: 'default' });

const token = useCookie<string | null>('token');
const usersList = ref<any[]>([]);

const crud = useCrudApi<Agent>({
  endpoint: '/api/agents',
  dataKey: 'agents',
  searchFields: ['name', 'registration_no', 'country', 'region', 'district', 'ward'],
});

// Modal state
const showModal = ref(false);
const showViewModal = ref(false);
const showDeleteModal = ref(false);
const editingId = ref<number | null>(null);
const viewingItem = ref<Agent | null>(null);
const deletingItem = ref<Agent | null>(null);

const form = reactive({
  name: '',
  user_id: null as number | null,
  registration_no: '',
  country: '',
  region: '',
  district: '',
  ward: '',
});
const formError = ref('');

async function fetchUsers() {
  try {
    const headers = { Authorization: `Bearer ${token.value}`, Accept: 'application/json' };
    const res = await $fetch<any>('/api/users', { headers });
    usersList.value = Array.isArray(res?.data?.users) ? res.data.users : (Array.isArray(res?.data) ? res.data : []);
  } catch (err) {
    console.error('Failed to load users for dropdown:', err);
  }
}

function openCreateModal() {
  editingId.value = null;
  form.name = '';
  form.user_id = null;
  form.registration_no = '';
  form.country = '';
  form.region = '';
  form.district = '';
  form.ward = '';
  formError.value = '';
  showModal.value = true;
}

function openEditModal(agent: Agent) {
  editingId.value = agent.id;
  form.name = agent.name;
  form.user_id = agent.user_id || null;
  form.registration_no = agent.registration_no || '';
  form.country = agent.country || '';
  form.region = agent.region || '';
  form.district = agent.district || '';
  form.ward = agent.ward || '';
  formError.value = '';
  showModal.value = true;
}

function openViewModal(agent: Agent) {
  viewingItem.value = agent;
  showViewModal.value = true;
}

function confirmDelete(agent: Agent) {
  deletingItem.value = agent;
  showDeleteModal.value = true;
}

async function handleSubmit() {
  if (!form.name.trim()) {
    formError.value = 'Agent name is required.';
    return;
  }
  formError.value = '';

  const payload: Record<string, any> = {
    name: form.name.trim(),
    user_id: form.user_id || null,
    registration_no: form.registration_no.trim() || null,
    country: form.country.trim() || null,
    region: form.region.trim() || null,
    district: form.district.trim() || null,
    ward: form.ward.trim() || null,
  };

  let success = false;
  if (editingId.value) {
    success = await crud.updateItem(editingId.value, payload, 'Agent updated successfully.');
  } else {
    success = await crud.createItem(payload, 'Agent created successfully.');
  }

  if (success) {
    showModal.value = false;
  }
}

async function handleDelete() {
  if (!deletingItem.value) return;
  const success = await crud.deleteItem(deletingItem.value.id, 'Agent deleted successfully.');
  if (success) {
    showDeleteModal.value = false;
    deletingItem.value = null;
  }
}

onMounted(() => {
  crud.fetchItems();
  fetchUsers();
});
</script>

<style scoped>
.agents-page {
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

.agent-name-cell {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.agent-badge {
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

.bg-green-subtle { background-color: var(--green-50); }
.text-green-700 { color: var(--green-700); }
.border-green-200 { border-color: var(--green-200) !important; }
</style>
