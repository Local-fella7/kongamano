<template>
  <CommonModal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="Bulk Registration Import"
    icon="bi-people-fill"
    size="xl"
  >
    <form @submit.prevent="handleSubmit">
      <!-- Target Event Selection -->
      <div class="mb-3 p-3 bg-light rounded-3 border">
        <label class="form-label required fs-7 fw-semibold text-slate-800 mb-1">Target Event</label>
        <select v-model.number="selectedEventId" class="form-select form-select-sm rounded-3" required>
          <option value="" disabled>Select event for bulk registration...</option>
          <option v-for="ev in eventsList" :key="ev.id" :value="ev.id">{{ ev.name }}</option>
        </select>
      </div>

      <!-- Toolbar Row (Above Table) -->
      <div class="d-flex align-items-center justify-content-between mb-2.5">
        <div class="d-flex align-items-center gap-2">
          <span class="fs-7 fw-bold text-slate-900">Attendees List</span>
          <span class="badge rounded-pill bg-success-subtle text-success border border-success-subtle px-2.5 py-1 fs-8 fw-bold">
            {{ rows.length }} {{ rows.length === 1 ? 'row' : 'rows' }}
          </span>
        </div>

        <div class="d-flex align-items-center gap-2">
          <div class="d-flex align-items-center gap-1 bg-white px-2 py-1 border rounded-3 shadow-2xs">
            <span class="fs-8 text-muted fw-semibold">Rows:</span>
            <input
              v-model.number="rowCountInput"
              type="number"
              min="1"
              max="50"
              class="form-control form-control-sm text-center p-0 border-0 fs-8 fw-bold"
              style="width: 45px;"
            />
          </div>
          <button
            type="button"
            class="btn-add-rows"
            @click="addMultipleRows"
            title="Add specified number of attendee rows"
          >
            <i class="bi bi-plus-lg fs-7"></i>
            <span>Add Rows</span>
          </button>
        </div>
      </div>

      <!-- Repeatable Rows Table -->
      <div class="table-responsive rounded-3 border mb-3" style="max-height: 420px; overflow-y: auto;">
        <table class="data-table align-middle mb-0">
          <thead class="sticky-top">
            <tr>
              <th class="text-center" style="width: 40px;">#</th>
              <th>First Name <span class="text-danger">*</span></th>
              <th>Last Name <span class="text-danger">*</span></th>
              <th style="width: 110px;">Gender</th>
              <th style="width: 135px;">Phone</th>
              <th style="width: 145px;">Region</th>
              <th style="width: 145px;">District</th>
              <th style="width: 145px;">Ward</th>
              <th class="text-center" style="width: 44px;"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in rows" :key="idx">
              <td class="text-center row-index">{{ idx + 1 }}</td>
              <td class="p-1.5">
                <input
                  v-model="row.first_name"
                  type="text"
                  class="form-control form-control-sm rounded-2 input-cell"
                  placeholder="First Name"
                  required
                />
              </td>
              <td class="p-1.5">
                <input
                  v-model="row.last_name"
                  type="text"
                  class="form-control form-control-sm rounded-2 input-cell"
                  placeholder="Last Name"
                  required
                />
              </td>
              <td class="p-1.5">
                <select v-model="row.gender" class="form-select form-select-sm rounded-2 select-cell">
                  <option value="">Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </td>
              <td class="p-1.5">
                <input
                  v-model="row.phone"
                  type="tel"
                  class="form-control form-control-sm rounded-2 input-cell"
                  placeholder="Phone"
                />
              </td>
              <td class="p-1.5">
                <select
                  v-model="row.region"
                  class="form-select form-select-sm rounded-2 select-cell"
                  @change="handleRegionChange(row)"
                >
                  <option value="">Region</option>
                  <option v-for="r in regionsList" :key="r" :value="r">{{ r }}</option>
                </select>
              </td>
              <td class="p-1.5">
                <select
                  v-model="row.district"
                  class="form-select form-select-sm rounded-2 select-cell"
                  :disabled="!row.region"
                  @change="handleDistrictChange(row)"
                >
                  <option value="">District</option>
                  <option v-for="d in row.districtsList" :key="d" :value="d">{{ d }}</option>
                </select>
              </td>
              <td class="p-1.5">
                <select
                  v-model="row.ward"
                  class="form-select form-select-sm rounded-2 select-cell"
                  :disabled="!row.district"
                >
                  <option value="">Ward</option>
                  <option v-for="w in row.wardsList" :key="w" :value="w">{{ w }}</option>
                </select>
              </td>
              <td class="text-center p-1.5">
                <button
                  type="button"
                  class="btn btn-outline-danger btn-sm rounded-2 p-1 border-0"
                  :disabled="rows.length <= 1"
                  @click="removeRow(idx)"
                  title="Remove row"
                >
                  <i class="bi bi-trash-fill"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="error" class="alert alert-danger fs-8 py-2 px-3 mb-3">{{ error }}</div>

      <div class="modal-footer-row mt-3">
        <button type="button" class="btn-cancel" @click="$emit('update:modelValue', false)">Cancel</button>
        <button type="submit" class="btn-submit" :disabled="submitting">
          <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
          Submit Bulk Import ({{ rows.length }})
        </button>
      </div>
    </form>
  </CommonModal>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean;
  eventsList: any[];
  defaultEventId?: number | string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'imported'): void;
}>();

const { executeOrQueue } = useOfflineSync();
const push = usePush();

interface BulkRow {
  first_name: string;
  last_name: string;
  gender: string;
  phone: string;
  region: string;
  district: string;
  ward: string;
  districtsList: string[];
  wardsList: string[];
}

const selectedEventId = ref<number | string>('');
const regionsList = ref<string[]>([]);
const rows = ref<BulkRow[]>([]);
const submitting = ref(false);
const error = ref<string | null>(null);

function createEmptyRow(): BulkRow {
  return {
    first_name: '',
    last_name: '',
    gender: '',
    phone: '',
    region: '',
    district: '',
    ward: '',
    districtsList: [],
    wardsList: [],
  };
}

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen) {
      selectedEventId.value = props.defaultEventId || props.eventsList[0]?.id || '';
      rows.value = [createEmptyRow(), createEmptyRow()];
      rowCountInput.value = 1;
      error.value = null;
      await fetchRegions();
    }
  }
);

function extractLocationList(res: any, key: string): string[] {
  const pluralKey = key.endsWith('y') ? `${key.slice(0, -1)}ies` : `${key}s`;
  const raw = res?.data?.[pluralKey] || res?.data?.[key] || res?.data || res || [];
  if (!Array.isArray(raw)) return [];
  return raw.map((item: any) => {
    if (typeof item === 'string') return item;
    if (typeof item === 'object' && item !== null) {
      return item.name || item[key] || item.title || Object.values(item)[0] || String(item);
    }
    return String(item);
  }).filter(Boolean);
}

async function fetchRegions() {
  try {
    const res = await cachedFetch<any>('/api/registrations/tanzania-locations');
    regionsList.value = extractLocationList(res, 'region');
  } catch (err) {
    console.error('Failed to fetch regions for bulk import:', err);
  }
}

async function handleRegionChange(row: BulkRow) {
  row.district = '';
  row.ward = '';
  row.districtsList = [];
  row.wardsList = [];
  if (!row.region) return;
  try {
    const res = await cachedFetch<any>(`/api/registrations/tanzania-locations?region=${encodeURIComponent(row.region)}`);
    row.districtsList = extractLocationList(res, 'district');
  } catch (err) {
    console.error('Failed to fetch districts:', err);
  }
}

async function handleDistrictChange(row: BulkRow) {
  row.ward = '';
  row.wardsList = [];
  if (!row.district || !row.region) return;
  try {
    const res = await cachedFetch<any>(`/api/registrations/tanzania-locations?region=${encodeURIComponent(row.region)}&district=${encodeURIComponent(row.district)}`);
    row.wardsList = extractLocationList(res, 'ward');
  } catch (err) {
    console.error('Failed to fetch wards:', err);
  }
}

const rowCountInput = ref<number>(1);

function addRow() {
  rows.value.unshift(createEmptyRow());
}

function addMultipleRows() {
  const count = Math.max(1, Math.min(50, Number(rowCountInput.value) || 1));
  for (let i = 0; i < count; i++) {
    rows.value.unshift(createEmptyRow());
  }
}

function removeRow(idx: number) {
  if (rows.value.length > 1) {
    rows.value.splice(idx, 1);
  }
}

async function handleSubmit() {
  if (!selectedEventId.value) {
    error.value = 'Please select a target event.';
    return;
  }

  const invalidRow = rows.value.find(r => !r.first_name.trim() || !r.last_name.trim());
  if (invalidRow) {
    error.value = 'First name and last name are required for all rows.';
    return;
  }

  submitting.value = true;
  error.value = null;

  try {
    const registrations = rows.value.map(r => ({
      first_name: r.first_name.trim(),
      last_name: r.last_name.trim(),
      gender: r.gender || undefined,
      phone: r.phone.trim() || undefined,
      region: r.region || undefined,
      district: r.district || undefined,
      ward: r.ward || undefined,
    }));

    const res = await executeOrQueue({
      url: `/api/events/${selectedEventId.value}/registrations/bulk`,
      method: 'POST',
      body: { registrations },
      label: `Bulk Register Attendees (${registrations.length})`,
    });

    if (res.queued) {
      push.success({ title: 'Queued', message: 'Bulk registration queued for sync.' });
    } else {
      push.success({ title: 'Success', message: 'Bulk registrations imported successfully.' });
    }

    emit('update:modelValue', false);
    emit('imported');
  } catch (err: any) {
    console.error('Bulk import error:', err);
    error.value = err?.data?.message || 'Failed to complete bulk registration.';
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.event-card-header {
  background-color: var(--slate-50, #f8fafc);
  border: 1px solid var(--color-border, #e2e8f0);
}

.event-icon-box {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background-color: var(--green-50, #f0fdf4);
  color: var(--green-600, #16a34a);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.count-badge {
  background-color: var(--green-50, #f0fdf4);
  color: var(--green-700, #15803d);
  border: 1px solid var(--green-200, #bbf7d0);
}

.btn-add-rows {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background-color: var(--green-500, #2e7d22);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 0.35rem 0.75rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s ease;
}

.btn-add-rows:hover {
  background-color: var(--green-600, #25661b);
  color: #ffffff;
}

.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.data-table thead tr {
  background-color: var(--green-50, #f4f8f4) !important;
}

.data-table th {
  background-color: var(--green-50, #f4f8f4) !important;
  color: var(--green-700, #2e7d22) !important;
  padding: 0.75rem 0.6rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid var(--green-100, #e2efe2) !important;
}

.data-table td {
  border-bottom: 1px solid var(--color-border, #e2e8f0);
}

.data-table tbody tr:hover {
  background-color: var(--green-50, #f4f8f4) !important;
}

.input-cell,
.select-cell {
  font-size: 0.85rem;
  padding: 0.35rem 0.55rem;
  border: 1px solid #cbd5e1;
  background-color: #ffffff;
}

.input-cell:focus,
.select-cell:focus {
  border-color: var(--green-500, #2e7d22);
  box-shadow: 0 0 0 3px rgba(46, 125, 34, 0.15);
}

.btn-remove-row {
  background: transparent;
  color: #94a3b8;
  transition: color 0.15s ease;
}

.btn-remove-row:hover:not(:disabled) {
  color: #ef4444;
}

.btn-remove-row:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.modal-footer-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
}

.btn-cancel {
  background: var(--slate-50, #f8fafc);
  border: 1px solid var(--color-border, #cbd5e1);
  border-radius: 9px;
  padding: 0.5rem 1.1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--slate-700, #334155);
  cursor: pointer;
  transition: background 0.18s;
}

.btn-cancel:hover {
  background: var(--slate-100, #f1f5f9);
}

.btn-submit {
  background: var(--green-500, #2e7d22);
  border: none;
  border-radius: 9px;
  padding: 0.5rem 1.4rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
  cursor: pointer;
  transition: background 0.18s;
  display: inline-flex;
  align-items: center;
}

.btn-submit:hover:not(:disabled) {
  background: var(--green-600, #25661b);
}

.btn-submit:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}
</style>
