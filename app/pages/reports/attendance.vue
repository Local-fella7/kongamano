<template>
  <div class="reports-attendance-page d-flex flex-column min-vh-100">
    <!-- Page Header -->
    <div class="page-header d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
      <div class="d-flex align-items-center gap-3">
        <div class="header-icon-box">
          <i class="bi bi-qr-code-scan"></i>
        </div>
        <div>
          <h2 class="page-heading">Attendance & Scannings Reports</h2>
          <p class="page-subheading">View live badge scanning logs, gate access check-ins, and turnout summary analytics.</p>
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
          <tr v-if="activeReportTab === 'scannings'">
            <th>#</th>
            <th>Delegate Name</th>
            <th>Scanned Code</th>
            <th>Scan Status</th>
            <th>Gate / Location</th>
            <th>Timestamp</th>
          </tr>
          <tr v-else>
            <th>#</th>
            <th>Session / Gate Category</th>
            <th>Total Check-ins</th>
            <th>Attendance Share</th>
            <th>Peak Activity Time</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in paginatedItems" :key="item.id || index">
            <td class="row-index">{{ startIndex + index }}</td>

            <!-- Scannings Log Rows -->
            <template v-if="activeReportTab === 'scannings'">
              <td class="fw-semibold text-slate-900 fs-7">{{ item.delegate_name || item.registration?.first_name || 'Attendee' }}</td>
              <td class="fw-mono fs-8 text-slate-700">{{ item.scanned_code || item.qr_code || `#${item.id}` }}</td>
              <td>
                <span class="badge bg-green-subtle text-green-700 border border-green-200 rounded-pill px-2.5 py-1 fs-8 fw-bold">
                  <i class="bi bi-check-circle-fill me-1"></i> Verified
                </span>
              </td>
              <td class="fs-7 text-slate-700">{{ item.gate_location || item.location || 'Main Entrance' }}</td>
              <td class="text-muted fs-7">{{ item.created_at ? formatDate(item.created_at) : '—' }}</td>
            </template>

            <!-- Attendance Summary Rows -->
            <template v-else>
              <td class="fw-bold text-slate-900 fs-7">{{ item.category }}</td>
              <td class="fs-7 fw-bold text-green-700">{{ item.count }} Attendees Scanned</td>
              <td class="fs-7 fw-semibold text-sage-700">{{ item.percentage }}%</td>
              <td class="fs-8 text-muted">Active Session Peak</td>
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
  { id: 'scannings', title: 'Scannings & Access Log', icon: 'bi-clock-history', endpoint: '/api/reports/scannings-log/pdf' },
  { id: 'summary', title: 'Attendance Summary', icon: 'bi-person-check-fill', endpoint: '/api/reports/attendance-summary/pdf' },
];

const activeReportTab = ref('scannings');
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
const rawScannings = ref<any[]>([]);
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
    const res = await cachedFetch<any>('/api/scannings', { params });
    rawScannings.value = Array.isArray(res?.data?.scannings) ? res.data.scannings : (Array.isArray(res?.data) ? res.data : []);
  } catch (err) {
    console.error('Failed to load scannings:', err);
  } finally {
    loading.value = false;
  }
}

watch([selectedEventId, activeReportTab], () => {
  fetchTableData();
});

const filteredItems = computed(() => {
  let list = rawScannings.value;

  if (activeReportTab.value === 'summary') {
    const gateCounts: Record<string, number> = {};
    let totalAll = list.length || 1;
    list.forEach((s) => {
      const gate = s.gate_location || s.location || 'Main Entrance';
      gateCounts[gate] = (gateCounts[gate] || 0) + 1;
    });

    return Object.entries(gateCounts).map(([cat, count]) => ({
      category: cat,
      count,
      percentage: ((count / totalAll) * 100).toFixed(1),
    }));
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    list = list.filter((s) => {
      const code = (s.scanned_code || s.qr_code || '').toLowerCase();
      const name = (s.delegate_name || '').toLowerCase();
      const gate = (s.gate_location || s.location || '').toLowerCase();
      return code.includes(q) || name.includes(q) || gate.includes(q);
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
.reports-attendance-page {
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

.bg-green-subtle { background-color: var(--green-50); }
.text-green-700 { color: var(--green-700); }
.border-green-200 { border-color: var(--green-200) !important; }
</style>
