<template>
  <div class="reports-financial-page d-flex flex-column min-vh-100">
    <!-- Page Header -->
    <div class="page-header d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
      <div class="d-flex align-items-center gap-3">
        <div class="header-icon-box">
          <i class="bi bi-cash-coin"></i>
        </div>
        <div>
          <h2 class="page-heading">Financial Ledgers Reports</h2>
          <p class="page-subheading">Track payment transactions, revenue streams, audit reference codes, and payment modes.</p>
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
          <tr v-if="activeReportTab === 'ledger'">
            <th>#</th>
            <th>Reference Code</th>
            <th>Delegate Name</th>
            <th>Amount Paid</th>
            <th>Payment Mode</th>
            <th>Transaction Date</th>
          </tr>
          <tr v-else>
            <th>#</th>
            <th>Payment Category</th>
            <th>Total Transactions</th>
            <th>Total Revenue</th>
            <th>Revenue Contribution</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in paginatedItems" :key="item.id || index">
            <td class="row-index">{{ startIndex + index }}</td>

            <!-- Ledger Rows -->
            <template v-if="activeReportTab === 'ledger'">
              <td class="fw-mono fs-8 text-slate-800 fw-bold">{{ item.reference_number || item.reference || `#PAY-${item.id}` }}</td>
              <td class="fw-semibold text-slate-800 fs-7">{{ getDelegateName(item) }}</td>
              <td class="fw-bold text-green-700 fs-7">{{ formatCurrency(item.amount || item.amount_paid || 0) }}</td>
              <td>
                <span class="role-pill">{{ item.payment_mode?.name || item.payment_mode || 'Cash' }}</span>
              </td>
              <td class="text-muted fs-7">{{ item.created_at ? formatDate(item.created_at) : '—' }}</td>
            </template>

            <!-- Revenue Summary Rows -->
            <template v-else>
              <td>
                <span class="role-pill fw-bold">{{ item.category }}</span>
              </td>
              <td class="fs-7 fw-semibold text-slate-800">{{ item.count }} Payments</td>
              <td class="fs-7 fw-bold text-green-700">{{ formatCurrency(item.totalRevenue) }}</td>
              <td class="fs-7 fw-semibold text-sage-700">{{ item.percentage }}%</td>
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
  { id: 'ledger', title: 'Payments Audit Ledger', icon: 'bi-receipt-cutoff', endpoint: '/api/reports/payments-ledger/pdf' },
  { id: 'revenue', title: 'Event Revenue Analysis', icon: 'bi-cash-stack', endpoint: '/api/reports/event-revenue/pdf' },
];

const activeReportTab = ref('ledger');
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
const rawPayments = ref<any[]>([]);
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
    const res = await cachedFetch<any>('/api/payments', { params });
    rawPayments.value = Array.isArray(res?.data?.payments) ? res.data.payments : (Array.isArray(res?.data) ? res.data : []);
  } catch (err) {
    console.error('Failed to load payments:', err);
  } finally {
    loading.value = false;
  }
}

watch([selectedEventId, activeReportTab], () => {
  fetchTableData();
});

const filteredItems = computed(() => {
  let list = rawPayments.value;

  if (activeReportTab.value === 'revenue') {
    const modeRevenue: Record<string, { count: number; total: number }> = {};
    let totalAll = 0;
    list.forEach((p) => {
      const mode = p.payment_mode?.name || p.payment_mode || 'Cash';
      const amt = Number(p.amount || p.amount_paid || 0);
      if (!modeRevenue[mode]) modeRevenue[mode] = { count: 0, total: 0 };
      modeRevenue[mode].count += 1;
      modeRevenue[mode].total += amt;
      totalAll += amt;
    });

    const divisor = totalAll || 1;
    return Object.entries(modeRevenue).map(([cat, data]) => ({
      category: cat,
      count: data.count,
      totalRevenue: data.total,
      percentage: ((data.total / divisor) * 100).toFixed(1),
    }));
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    list = list.filter((p) => {
      const refCode = (p.reference_number || p.reference || '').toLowerCase();
      const name = getDelegateName(p).toLowerCase();
      const mode = (p.payment_mode?.name || p.payment_mode || '').toLowerCase();
      return refCode.includes(q) || name.includes(q) || mode.includes(q);
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

function getDelegateName(item: any) {
  if (item.registration) {
    const f = item.registration.first_name || '';
    const l = item.registration.last_name || '';
    return `${f} ${l}`.trim() || `Delegate #${item.registration_id}`;
  }
  return item.delegate_name || `Payment #${item.id}`;
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
.reports-financial-page {
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
</style>
