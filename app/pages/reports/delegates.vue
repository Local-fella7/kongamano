<template>
  <div class="reports-delegates-page d-flex flex-column min-vh-100">
    <!-- Page Header -->
    <div class="page-header d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
      <div class="d-flex align-items-center gap-3">
        <div class="header-icon-box">
          <i class="bi bi-people-fill"></i>
        </div>
        <div>
          <h2 class="page-heading">Delegates & Registrations Reports</h2>
          <p class="page-subheading">View, filter, and export delegate masterlists, status breakdowns, and unpaid balances.</p>
        </div>
      </div>
      <button class="btn-create" :disabled="exportingPdf" @click="exportCurrentReportPdf">
        <span v-if="exportingPdf" class="spinner-border spinner-border-sm me-2"></span>
        <i v-else class="bi bi-file-earmark-pdf-fill fs-6 me-1"></i>
        <span>Export {{ activeReportTitle }} PDF</span>
      </button>
    </div>

    <!-- Active Report Sub-Tab Selector -->
    <div class="d-flex align-items-center gap-2 mb-4 overflow-x-auto pb-1">
      <button
        v-for="tab in reportTabs"
        :key="tab.id"
        class="btn btn-sm rounded-pill px-3 py-2 fs-8 fw-semibold transition-all text-nowrap"
        :class="activeReportTab === tab.id ? 'btn-primary text-white shadow-2xs' : 'btn-light text-slate-700 border border-slate-200'"
        @click="activeReportTab = tab.id"
      >
        <i :class="['bi', tab.icon, 'me-1.5']"></i>
        {{ tab.title }}
      </button>
    </div>

    <!-- Data Table & Filters -->
    <CommonDataTable
      v-model:searchQuery="searchQuery"
      v-model:currentPage="currentPage"
      v-model:perPage="perPage"
      :loading="loading"
      :totalCount="filteredItems.length"
      :totalPages="totalPages"
      :startIndex="startIndex"
      :endIndex="endIndex"
    >
      <template #filters>
        <!-- Event Filter Dropdown -->
        <select
          v-model="selectedEventId"
          class="form-select form-select-sm rounded-pill py-2 px-3 border-slate-200 fs-8 shadow-2xs"
          style="max-width: 220px;"
          :disabled="eventsLoading"
        >
          <option value="">All Events</option>
          <option v-for="ev in eventsList" :key="ev.id" :value="ev.id">
            {{ ev.title || ev.name || `Event #${ev.id}` }}
          </option>
        </select>
      </template>

      <!-- Table Content -->
      <table class="data-table">
        <thead>
          <tr v-if="activeReportTab === 'masterlist'">
            <th>#</th>
            <th>Delegate Name</th>
            <th>Registration Code</th>
            <th>Contact Phone</th>
            <th>Region / Location</th>
            <th>Status</th>
            <th>Registered At</th>
          </tr>
          <tr v-else-if="activeReportTab === 'unpaid'">
            <th>#</th>
            <th>Delegate Name</th>
            <th>Contact Phone</th>
            <th>Event / Ticket</th>
            <th>Total Cost</th>
            <th>Paid Amount</th>
            <th>Balance Due</th>
          </tr>
          <tr v-else>
            <th>#</th>
            <th>Status Category</th>
            <th>Total Delegates</th>
            <th>Percentage</th>
            <th>Action Summary</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in paginatedItems" :key="item.id || index">
            <td class="row-index">{{ startIndex + index }}</td>

            <!-- Masterlist Tab Rows -->
            <template v-if="activeReportTab === 'masterlist'">
              <td>
                <div class="delegate-cell">
                  <span class="delegate-avatar">{{ getInitials(item) }}</span>
                  <span class="fw-semibold text-slate-800 fs-7">{{ item.first_name }} {{ item.last_name }}</span>
                </div>
              </td>
              <td class="fw-mono fs-8 text-slate-700">{{ item.registration_code || item.code || `#${item.id}` }}</td>
              <td class="fs-7 text-slate-700"><i class="bi bi-telephone text-green-600 me-1"></i>{{ item.phone || '—' }}</td>
              <td class="fs-7 text-slate-700">{{ item.region || item.city || '—' }}</td>
              <td>
                <span class="badge rounded-pill px-2.5 py-1 fs-8 text-capitalize" :class="getStatusBadgeClass(item.status)">
                  {{ item.status || 'Registered' }}
                </span>
              </td>
              <td class="fs-7 text-muted">{{ item.created_at ? formatDate(item.created_at) : '—' }}</td>
            </template>

            <!-- Unpaid Balance Tab Rows -->
            <template v-else-if="activeReportTab === 'unpaid'">
              <td>
                <div class="delegate-cell">
                  <span class="delegate-avatar bg-amber-subtle text-amber-800">{{ getInitials(item) }}</span>
                  <span class="fw-semibold text-slate-800 fs-7">{{ item.first_name }} {{ item.last_name }}</span>
                </div>
              </td>
              <td class="fs-7 text-slate-700">{{ item.phone || item.email || '—' }}</td>
              <td class="fs-7 text-slate-800 fw-medium">{{ item.event?.name || item.event_title || 'Conference Pass' }}</td>
              <td class="fs-7 fw-semibold text-slate-800">{{ formatCurrency(item.total_cost || item.amount || 0) }}</td>
              <td class="fs-7 fw-semibold text-green-700">{{ formatCurrency(item.amount_paid || 0) }}</td>
              <td class="fs-7 fw-bold text-danger">{{ formatCurrency((item.total_cost || item.amount || 0) - (item.amount_paid || 0)) }}</td>
            </template>

            <!-- Status Breakdown Tab Rows -->
            <template v-else>
              <td>
                <span class="badge rounded-pill px-3 py-1 fs-8 text-capitalize fw-bold" :class="getStatusBadgeClass(item.status)">
                  {{ item.status }}
                </span>
              </td>
              <td class="fs-7 fw-bold text-slate-900">{{ item.count }} Delegates</td>
              <td class="fs-7 fw-semibold text-sage-700">{{ item.percentage }}%</td>
              <td class="fs-8 text-muted">Category total representation</td>
            </template>
          </tr>
        </tbody>
      </table>
    </CommonDataTable>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' });

const token = useCookie<string | null>('token');

const reportTabs = [
  { id: 'masterlist', title: 'Delegates Masterlist', icon: 'bi-card-checklist', endpoint: '/api/reports/registrations-list/pdf' },
  { id: 'unpaid', title: 'Unpaid Registrations', icon: 'bi-exclamation-octagon-fill', endpoint: '/api/reports/unpaid-registrations/pdf' },
  { id: 'status', title: 'Status Breakdown', icon: 'bi-bar-chart-line-fill', endpoint: '/api/reports/registration-status/pdf' },
];

const activeReportTab = ref('masterlist');
const selectedEventId = ref<number | ''>('');
const eventsList = ref<any[]>([]);
const eventsLoading = ref(false);

const activeReportTitle = computed(() => {
  return reportTabs.find((t) => t.id === activeReportTab.value)?.title || 'Report';
});

// Data Table state
const searchQuery = ref('');
const currentPage = ref(1);
const perPage = ref(10);
const loading = ref(false);
const rawRegistrations = ref<any[]>([]);
const exportingPdf = ref(false);

async function fetchEvents() {
  eventsLoading.value = true;
  try {
    const res = await cachedFetch<any>('/api/events');
    eventsList.value = Array.isArray(res?.data?.events) ? res.data.events : (Array.isArray(res?.data) ? res.data : []);
    if (eventsList.value.length > 0) {
      selectedEventId.value = eventsList.value[0].id;
    }
  } catch (err) {
    console.error('Failed to fetch events:', err);
  } finally {
    eventsLoading.value = false;
  }
}

async function fetchTableData() {
  loading.value = true;
  try {
    const params: Record<string, any> = {};
    if (selectedEventId.value) params.event_id = selectedEventId.value;
    const res = await cachedFetch<any>('/api/registrations', { params });
    rawRegistrations.value = Array.isArray(res?.data?.registrations) ? res.data.registrations : (Array.isArray(res?.data) ? res.data : []);
  } catch (err) {
    console.error('Failed to load registrations:', err);
  } finally {
    loading.value = false;
  }
}

watch([selectedEventId, activeReportTab], () => {
  fetchTableData();
});

const filteredItems = computed(() => {
  let list = rawRegistrations.value;

  if (activeReportTab.value === 'unpaid') {
    list = list.filter((r) => {
      const cost = Number(r.total_cost || r.amount || 0);
      const paid = Number(r.amount_paid || 0);
      return cost > paid || r.status?.toLowerCase() === 'unpaid' || r.status?.toLowerCase() === 'pending';
    });
  } else if (activeReportTab.value === 'status') {
    const statusCounts: Record<string, number> = {};
    list.forEach((r) => {
      const s = (r.status || 'Registered').toLowerCase();
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    });
    const total = list.length || 1;
    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: ((count / total) * 100).toFixed(1),
    }));
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    list = list.filter((r) => {
      const name = `${r.first_name || ''} ${r.last_name || ''}`.toLowerCase();
      const phone = (r.phone || '').toLowerCase();
      const code = (r.registration_code || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || code.includes(q);
    });
  }

  return list;
});

const totalPages = computed(() => Math.ceil(filteredItems.value.length / perPage.value) || 1);
const startIndex = computed(() => (currentPage.value - 1) * perPage.value + 1);
const endIndex = computed(() => Math.min(currentPage.value * perPage.value, filteredItems.value.length));
const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * perPage.value;
  return filteredItems.value.slice(start, start + perPage.value);
});

function getInitials(item: any) {
  const f = item.first_name?.[0] || 'D';
  const l = item.last_name?.[0] || '';
  return `${f}${l}`.toUpperCase();
}

function getStatusBadgeClass(status?: string) {
  const s = (status || '').toLowerCase();
  if (['confirmed', 'approved', 'completed', 'active', 'verified'].includes(s)) return 'bg-green-subtle text-green-700 border border-green-200';
  if (s === 'pending' || s === 'unpaid') return 'bg-amber-subtle text-amber-700 border border-amber-200';
  if (s === 'attended' || s === 'checked_in') return 'bg-blue-subtle text-blue-700 border border-blue-200';
  return 'bg-slate-100 text-slate-700 border border-slate-200';
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(amount);
}

async function exportCurrentReportPdf() {
  const currentTab = reportTabs.find((t) => t.id === activeReportTab.value);
  if (!currentTab) return;

  exportingPdf.value = true;
  try {
    let url = currentTab.endpoint;
    if (selectedEventId.value) {
      url += `?event_id=${selectedEventId.value}`;
    }
    const headers: Record<string, string> = { Accept: 'application/pdf, application/json' };
    if (token.value) headers.Authorization = `Bearer ${token.value}`;

    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error('PDF export failed');
    const blob = await res.blob();
    const pdfBlob = new Blob([blob], { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(pdfBlob);

    // Open PDF directly in new tab
    const newTab = window.open(blobUrl, '_blank');
    if (!newTab) {
      // Fallback if popup blocker intervenes
      const link = document.createElement('a');
      link.href = blobUrl;
      link.target = '_blank';
      link.download = `Kongamano_${currentTab.id}_Report.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    const notivue = useNotivue();
    if (notivue) notivue.success(`Opened ${currentTab.title} PDF in a new tab.`);
  } catch (err: any) {
    console.error('Export PDF failed:', err);
    const notivue = useNotivue();
    if (notivue) notivue.error('Failed to export PDF report.');
  } finally {
    exportingPdf.value = false;
  }
}

onMounted(() => {
  fetchEvents();
  fetchTableData();
});
</script>

<style scoped>
.reports-delegates-page {
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
  margin-bottom: 0.15rem;
}

.page-subheading {
  font-size: 0.825rem;
  color: var(--slate-600);
  margin-bottom: 0;
}

.btn-create {
  background: var(--green-500);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 0.55rem 1.2rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.18s;
  display: inline-flex;
  align-items: center;
}

.btn-create:hover:not(:disabled) {
  background: var(--green-600);
}

.btn-create:disabled {
  opacity: 0.65;
  cursor: not-allowed;
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

.data-table tbody tr:hover {
  background: var(--green-50);
}

.row-index {
  color: var(--slate-300);
  font-size: 0.8rem;
  width: 40px;
}

.delegate-cell {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.delegate-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--green-500);
  color: #fff;
  font-weight: 700;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.bg-green-subtle { background-color: var(--green-50); }
.text-green-700 { color: var(--green-700); }
.border-green-200 { border-color: var(--green-200) !important; }

.bg-amber-subtle { background-color: #fef3c7; }
.text-amber-700 { color: #b45309; }
.border-amber-200 { border-color: #fde68a !important; }

.bg-blue-subtle { background-color: #dbeafe; }
.text-blue-700 { color: #1d4ed8; }
.border-blue-200 { border-color: #bfdbfe !important; }
</style>
