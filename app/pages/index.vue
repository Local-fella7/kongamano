<template>
  <div class="dashboard-page">
    <!-- Executive Gradient Dashboard Header Banner -->
    <div class="card dashboard-hero-header border-0 shadow-sm rounded-4 p-4 mb-4 text-white overflow-hidden position-relative">
      <div class="d-flex align-items-center justify-content-between flex-wrap gap-3 position-relative z-1">
        <!-- Title & Icon -->
        <div class="d-flex align-items-center gap-3.5">
          <div class="dashboard-avatar-circle shadow-2xs">
            <i class="bi bi-grid-1x2-fill"></i>
          </div>
          <div>
            <div class="d-flex align-items-center gap-2 mb-1">
              <h2 class="fw-extrabold text-white mb-0 fs-4">{{ greetingText }}</h2>
              <span class="badge bg-white-20 text-white rounded-pill px-3 py-1 fs-8 fw-bold backdrop-blur">
                <i class="bi bi-broadcast me-1 text-warning"></i>Live Analytics
              </span>
            </div>
            <p class="text-white-75 fs-7 mb-0">Real-time event tracking, delegate registrations, and financial statistics.</p>
          </div>
        </div>

        <!-- Right Side: Real-time Date Badge & Refresh Action -->
        <div class="d-flex align-items-center gap-2.5 flex-wrap ms-auto">
          <!-- Current Date Pill -->
          <div class="d-none d-md-flex align-items-center gap-2 bg-white-15 rounded-pill px-3 py-2 text-white fs-8 fw-semibold backdrop-blur border-white-20">
            <i class="bi bi-clock-history text-warning fs-7"></i>
            <span>{{ currentFormattedDate }}</span>
          </div>

          <!-- Refresh Data Button -->
          <button class="btn btn-glass-white rounded-pill px-3.5 py-2 fw-bold fs-7 d-flex align-items-center gap-1.5 shadow-sm" @click="refreshData" :disabled="loading">
            <i class="bi bi-arrow-clockwise" :class="{ 'spin-animation': loading }"></i>
            <span>Refresh Data</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State Skeleton -->
    <div v-if="loading && !loadedOnce" class="state-box card border-0 shadow-sm rounded-4 mb-4">
      <div class="spinner-border text-success" role="status"></div>
      <p class="mt-3 text-muted mb-0">Loading dashboard analytics...</p>
    </div>

    <template v-else>
      <!-- Zone 1: Executive Full-Color KPI Summary Cards -->
      <div class="row g-4 mb-4">
        <!-- KPI 1: Total Registrations (Teal Green Full Card) -->
        <div class="col-12 col-sm-6 col-xl-3">
          <div class="card full-color-kpi-card full-color-kpi-card--teal h-100 border-0 shadow-sm rounded-4 p-4 text-white position-relative overflow-hidden">
            <div class="d-flex align-items-center justify-content-between mb-3">
              <span class="fs-8 fw-bold text-uppercase tracking-wider text-white-50">Total Registrations</span>
              <div class="kpi-avatar-circle shadow-2xs">
                <i class="bi bi-people-fill"></i>
              </div>
            </div>
            <h2 class="fw-extrabold text-white mb-2 fs-2">{{ totalRegistrationsCount.toLocaleString() }}</h2>
            <div class="d-flex align-items-center justify-content-between pt-2 border-top border-white-20">
              <small class="text-white-75 fs-8">Registered Delegates</small>
              <span class="badge bg-white text-teal-800 rounded-pill px-2.5 py-1 fs-8 fw-bold shadow-2xs">
                <i class="bi bi-check-circle-fill me-1"></i>Active
              </span>
            </div>
          </div>
        </div>

        <!-- KPI 2: Total Revenue (TZS) (Warm Tan / Terracotta Full Card) -->
        <div class="col-12 col-sm-6 col-xl-3">
          <div class="card full-color-kpi-card full-color-kpi-card--tan h-100 border-0 shadow-sm rounded-4 p-4 text-white position-relative overflow-hidden">
            <div class="d-flex align-items-center justify-content-between mb-3">
              <span class="fs-8 fw-bold text-uppercase tracking-wider text-white-50">Total Revenue</span>
              <div class="kpi-avatar-circle shadow-2xs">
                <i class="bi bi-cash-stack"></i>
              </div>
            </div>
            <h2 class="fw-extrabold text-white mb-2 fs-3 text-truncate" :title="`TZS ${totalRevenueAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`">
              TZS {{ totalRevenueAmount.toLocaleString('en-US', { maximumFractionDigits: 0 }) }}
            </h2>
            <div class="d-flex align-items-center justify-content-between pt-2 border-top border-white-20">
              <small class="text-white-75 fs-8">Collected Financial Sum</small>
              <span class="badge bg-white text-tan-800 rounded-pill px-2.5 py-1 fs-8 fw-bold shadow-2xs">
                TZS Currency
              </span>
            </div>
          </div>
        </div>

        <!-- KPI 3: Active & Total Events (Emerald Full Card) -->
        <div class="col-12 col-sm-6 col-xl-3">
          <div class="card full-color-kpi-card full-color-kpi-card--emerald h-100 border-0 shadow-sm rounded-4 p-4 text-white position-relative overflow-hidden">
            <div class="d-flex align-items-center justify-content-between mb-3">
              <span class="fs-8 fw-bold text-uppercase tracking-wider text-white-50">Events Catalog</span>
              <div class="kpi-avatar-circle shadow-2xs">
                <i class="bi bi-calendar-event-fill"></i>
              </div>
            </div>
            <h2 class="fw-extrabold text-white mb-2 fs-2">{{ eventsList.length }}</h2>
            <div class="d-flex align-items-center justify-content-between pt-2 border-top border-white-20">
              <small class="text-white-75 fs-8">Active & Scheduled</small>
              <span class="badge bg-white text-emerald-800 rounded-pill px-2.5 py-1 fs-8 fw-bold shadow-2xs">
                {{ activeEventsCount }} Active
              </span>
            </div>
          </div>
        </div>

        <!-- KPI 4: Total Payments Transactions (Terracotta Full Card) -->
        <div class="col-12 col-sm-6 col-xl-3">
          <div class="card full-color-kpi-card full-color-kpi-card--terracotta h-100 border-0 shadow-sm rounded-4 p-4 text-white position-relative overflow-hidden">
            <div class="d-flex align-items-center justify-content-between mb-3">
              <span class="fs-8 fw-bold text-uppercase tracking-wider text-white-50">Transactions</span>
              <div class="kpi-avatar-circle shadow-2xs">
                <i class="bi bi-receipt-cutoff"></i>
              </div>
            </div>
            <h2 class="fw-extrabold text-white mb-2 fs-2">{{ paymentsList.length }}</h2>
            <div class="d-flex align-items-center justify-content-between pt-2 border-top border-white-20">
              <small class="text-white-75 fs-8">Verified Receipts</small>
              <span class="badge bg-white text-terracotta-800 rounded-pill px-2.5 py-1 fs-8 fw-bold shadow-2xs">
                Verified
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Zone 2: Executive Quick Action Command Bar -->
      <div class="card command-bar-card border-0 shadow-sm rounded-4 p-3 px-4 mb-4 bg-white">
        <div class="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <!-- Left Label with Icon -->
          <div class="d-flex align-items-center gap-2.5">
            <div class="command-bar-icon-box shadow-2xs">
              <i class="bi bi-lightning-charge-fill"></i>
            </div>
            <div>
              <h6 class="fw-extrabold text-slate-900 mb-0 fs-7">Quick Action Command Bar</h6>
              <small class="text-muted fs-8">Direct module shortcuts & quick management tasks</small>
            </div>
          </div>

          <!-- Right Action Pills -->
          <div class="d-flex align-items-center gap-4 flex-wrap ms-auto">
            <NuxtLink to="/registrations" class="btn command-btn command-btn--green rounded-pill px-4 py-2-5 fs-7 fw-bold d-flex align-items-center gap-2 shadow-2xs me-1">
              <i class="bi bi-person-plus-fill me-0.5"></i>
              <span>New Registration</span>
            </NuxtLink>

            <NuxtLink to="/payments" class="btn command-btn command-btn--tan rounded-pill px-4 py-2-5 fs-7 fw-bold d-flex align-items-center gap-2 shadow-2xs me-1">
              <i class="bi bi-wallet2 me-0.5"></i>
              <span>Record Payment</span>
            </NuxtLink>

            <NuxtLink to="/events" class="btn command-btn command-btn--teal rounded-pill px-4 py-2-5 fs-7 fw-bold d-flex align-items-center gap-2 shadow-2xs me-1">
              <i class="bi bi-calendar-plus-fill me-0.5"></i>
              <span>Manage Events</span>
            </NuxtLink>

            <NuxtLink to="/agents" class="btn command-btn command-btn--terracotta rounded-pill px-4 py-2-5 fs-7 fw-bold d-flex align-items-center gap-2 shadow-2xs">
              <i class="bi bi-person-workspace me-0.5"></i>
              <span>Agents Portal</span>
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Zone 3: Interactive Visual Insights Grid -->
      <div class="row g-4 mb-4">
        <!-- Left Column: Professional Chart.js Line Chart -->
        <div class="col-12 col-lg-7 col-xl-8">
          <div class="card border-0 shadow-sm rounded-4 bg-white p-4 h-100">
            <div class="d-flex align-items-center justify-content-between mb-3">
              <div>
                <h6 class="fw-bold text-slate-900 mb-0">Registration Trend</h6>
                <small class="text-muted fs-8">Daily delegate sign-ups over the last 7 days</small>
              </div>
              <span class="badge bg-green-subtle text-green-800 rounded-pill px-2.5 py-1 fs-8 fw-semibold">
                Live Daily Trend
              </span>
            </div>

            <div class="chart-container-wrapper" style="position: relative; height: 220px; width: 100%;">
              <ClientOnly>
                <Line :data="lineChartData" :options="lineChartOptions" />
                <template #placeholder>
                  <div class="d-flex align-items-center justify-content-center h-100 bg-slate-50 rounded-3">
                    <span class="spinner-border spinner-border-sm text-success me-2"></span>
                    <span class="fs-8 text-muted">Rendering registration trend...</span>
                  </div>
                </template>
              </ClientOnly>
            </div>
          </div>
        </div>

        <!-- Right Column: Professional Doughnut Chart for Revenue Breakdown -->
        <div class="col-12 col-lg-5 col-xl-4">
          <div class="card border-0 shadow-sm rounded-4 h-100 bg-white p-4">
            <div class="d-flex align-items-center justify-content-between mb-3">
              <div>
                <h6 class="fw-bold text-slate-900 mb-0">Revenue Shares Split</h6>
                <small class="text-muted fs-8">Distribution of payments across channels</small>
              </div>
              <span class="badge bg-green-subtle text-green-700 rounded-pill px-2.5 py-1 fs-8 fw-bold">
                {{ paymentModesList.length }} Modes
              </span>
            </div>

            <div class="chart-container-wrapper mb-3" style="position: relative; height: 180px; width: 100%;">
              <ClientOnly>
                <Doughnut :data="doughnutChartData" :options="doughnutChartOptions" />
                <template #placeholder>
                  <div class="d-flex align-items-center justify-content-center h-100 bg-slate-50 rounded-3">
                    <span class="spinner-border spinner-border-sm text-success me-2"></span>
                    <span class="fs-8 text-muted">Loading revenue split...</span>
                  </div>
                </template>
              </ClientOnly>
            </div>

            <div class="p-3 rounded-3 border-green-200 bg-green-subtle d-flex align-items-center justify-content-between mt-auto">
              <span class="fs-8 fw-bold text-green-800 text-uppercase tracking-wider">Total Revenue</span>
              <span class="fw-extrabold text-green-900 fs-7">
                TZS {{ totalRevenueAmount.toLocaleString('en-US', { minimumFractionDigits: 0 }) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Zone 4: Main Interactive Content Grid -->
      <div class="row g-4 mb-4">
        <!-- Left: Active & Upcoming Events Registrations Bar Chart -->
        <div class="col-12 col-lg-7 col-xl-8">
          <div class="card border-0 shadow-sm rounded-4 bg-white p-4 h-100">
            <div class="d-flex align-items-center justify-content-between mb-3">
              <div>
                <h6 class="fw-bold text-slate-900 mb-0">Active & Upcoming Events</h6>
                <small class="text-muted fs-8">Registered delegates count per ongoing/upcoming event</small>
              </div>
              <NuxtLink to="/events" class="btn btn-outline-success btn-sm rounded-pill fs-8 fw-semibold px-3">
                Manage Events
              </NuxtLink>
            </div>

            <div class="chart-container-wrapper" style="position: relative; height: 180px; width: 100%;">
              <div v-if="activeUpcomingEvents.length === 0" class="d-flex flex-column align-items-center justify-content-center h-100 bg-slate-50 rounded-3 text-center py-4">
                <i class="bi bi-calendar-x text-muted opacity-50 fs-2 mb-2"></i>
                <h6 class="fw-semibold text-slate-850 mb-1">No Ongoing or Upcoming Events</h6>
                <p class="text-muted fs-8 mb-0">Create an event in the Events page to track its sign-ups.</p>
              </div>
              <ClientOnly v-else>
                <Bar :data="barChartData" :options="barChartOptions" />
                <template #placeholder>
                  <div class="d-flex align-items-center justify-content-center h-100 bg-slate-50 rounded-3">
                    <span class="spinner-border spinner-border-sm text-success me-2"></span>
                    <span class="fs-8 text-muted">Loading events chart...</span>
                  </div>
                </template>
              </ClientOnly>
            </div>
          </div>
        </div>

        <!-- Right Column: Attendee Gender Rate Pie Chart -->
        <div class="col-12 col-lg-5 col-xl-4">
          <div class="card border-0 shadow-sm rounded-4 h-100 bg-white p-4">
            <div class="d-flex align-items-center justify-content-between mb-3">
              <div>
                <h6 class="fw-bold text-slate-900 mb-0">Gender Diversity</h6>
                <small class="text-muted fs-8">Overall delegate gender rate breakdown</small>
              </div>
            </div>

            <div class="chart-container-wrapper" style="position: relative; height: 210px; width: 100%;">
              <div v-if="registrationsList.length === 0" class="d-flex align-items-center justify-content-center h-100 bg-slate-50 rounded-3">
                <span class="fs-8 text-muted">No registration data available</span>
              </div>
              <ClientOnly v-else>
                <Pie :data="pieChartData" :options="pieChartOptions" />
                <template #placeholder>
                  <div class="d-flex align-items-center justify-content-center h-100 bg-slate-50 rounded-3">
                    <span class="spinner-border spinner-border-sm text-success me-2"></span>
                    <span class="fs-8 text-muted">Loading gender chart...</span>
                  </div>
                </template>
              </ClientOnly>
            </div>
          </div>
        </div>
      </div>

      <!-- Zone 5: Recent Transactions, Pending Actions, & Activity Stream Grid -->
      <div class="row g-4">
        <!-- Column 1: Recent Payments Table -->
        <div class="col-12 col-lg-4">
          <div class="card border-0 shadow-sm rounded-4 bg-white p-4 h-100">
            <div class="d-flex align-items-center justify-content-between mb-3.5">
              <div>
                <h6 class="fw-bold text-slate-900 mb-0">Recent Payments</h6>
                <small class="text-muted fs-8">Latest verified financial receipts</small>
              </div>
              <NuxtLink to="/payments" class="text-green-600 text-decoration-none fw-semibold fs-8">
                View All
              </NuxtLink>
            </div>

            <div class="d-flex flex-column">
              <div v-for="pm in recentPayments" :key="pm.id" class="premium-feed-item cascade-item">
                <div class="feed-icon-wrapper bg-green-light text-green-dark">
                  <i class="bi bi-cash-stack"></i>
                </div>
                <div class="feed-details overflow-hidden">
                  <span class="feed-title text-truncate">{{ getRegistrationName(pm.registration_id) || '—' }}</span>
                  <div class="feed-subtitle text-truncate">
                    <span class="payment-badge">{{ pm.payment_mode?.name || getPaymentModeName(pm.payment_mode_id) }}</span>
                    <span class="dot-separator mx-1.5">•</span>
                    <span>{{ formatDate(pm.created_at) }}</span>
                  </div>
                </div>
                <div class="feed-action text-end">
                  <span class="feed-value">+{{ Number(pm.amount).toLocaleString('en-US', { maximumFractionDigits: 0 }) }}</span>
                  <span class="feed-currency text-muted">TZS</span>
                </div>
              </div>
              <div v-if="recentPayments.length === 0" class="text-center py-4 text-muted fs-7">
                No verified payments found.
              </div>
            </div>
          </div>
        </div>

        <!-- Column 2: Awaiting Action / Pending Registrations -->
        <div class="col-12 col-lg-4">
          <div class="card border-0 shadow-sm rounded-4 bg-white p-4 h-100">
            <div class="d-flex align-items-center justify-content-between mb-3.5">
              <div>
                <h6 class="fw-bold text-slate-900 mb-0">Awaiting Action</h6>
                <small class="text-muted fs-8">Pending delegate registrations</small>
              </div>
              <NuxtLink to="/registrations" class="text-amber-700 text-decoration-none fw-semibold fs-8">
                Manage
              </NuxtLink>
            </div>

            <div class="d-flex flex-column">
              <div v-for="reg in pendingRegistrations" :key="reg.id" class="premium-feed-item cascade-item">
                <div class="feed-icon-wrapper bg-amber-light text-amber-dark">
                  <i class="bi bi-person-fill-exclamation"></i>
                </div>
                <div class="feed-details overflow-hidden">
                  <span class="feed-title text-truncate">{{ reg.first_name }} {{ reg.last_name }}</span>
                  <span class="feed-subtitle text-truncate">
                    <i class="bi bi-calendar-event me-1"></i>{{ reg.event?.name || getEventName(reg.event_id) }}
                  </span>
                </div>
                <div class="feed-action text-end">
                  <span class="status-pill status-pill--pending">Pending</span>
                </div>
              </div>
              <div v-if="pendingRegistrations.length === 0" class="text-center py-4 text-muted fs-7">
                No pending registrations.
              </div>
            </div>
          </div>
        </div>

        <!-- Column 3: Activity Stream Timeline -->
        <div class="col-12 col-lg-4">
          <div class="card border-0 shadow-sm rounded-4 bg-white p-4 h-100">
            <div class="d-flex align-items-center justify-content-between mb-3.5">
              <div>
                <h6 class="fw-bold text-slate-900 mb-0">System Activity</h6>
                <small class="text-muted fs-8">Latest registration & payment events</small>
              </div>
            </div>

            <div class="premium-timeline">
              <div v-for="(act, index) in systemActivities" :key="index" class="premium-timeline-item cascade-item">
                <div class="timeline-line"></div>
                <div class="timeline-badge" :class="act.colorClass">
                  <i class="bi" :class="act.icon"></i>
                </div>
                <div class="timeline-card">
                  <div class="d-flex align-items-center justify-content-between mb-1">
                    <span class="timeline-title">{{ act.title }}</span>
                    <span class="timeline-time">{{ formatTimeAgo(act.date) }}</span>
                  </div>
                  <p class="timeline-desc">{{ act.description }}</p>
                </div>
              </div>
              <div v-if="systemActivities.length === 0" class="text-center py-4 text-muted fs-7">
                No recent activity events found.
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';
import type { Event } from '~/types/event';
import type { Payment } from '~/types/payment';
import type { Registration } from '~/types/registration';
import { Line, Doughnut, Bar, Pie } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  BarElement,
  Filler
} from 'chart.js';

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  BarElement,
  Filler
);
definePageMeta({ layout: 'default' });

const authStore = useAuthStore();
const token = useCookie<string | null>('token');

const loading = ref(true);
const loadedOnce = ref(false);

const dynamicGreeting = ref('');

function updateGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) {
    dynamicGreeting.value = 'Good morning';
  } else if (hour < 17) {
    dynamicGreeting.value = 'Good afternoon';
  } else {
    dynamicGreeting.value = 'Good evening';
  }
}

// Set initial state
updateGreeting();

const greetingText = computed(() => {
  const name = authStore.user?.first_name || 'Admin';
  return `${dynamicGreeting.value}, ${name}`;
});

const currentFormattedDate = computed(() => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
});

const eventsList = ref<Event[]>([]);
const registrationsList = ref<Registration[]>([]);
const paymentsList = ref<Payment[]>([]);
const paymentModesList = ref<any[]>([]);
const agentsList = ref<any[]>([]);

// Parallel fetch for hyper-fast execution
async function fetchDashboardData() {
  loading.value = true;
  try {
    const headers = { Authorization: `Bearer ${token.value}`, Accept: 'application/json' };
    const [eventRes, regRes, payRes, modeRes, agentRes] = await Promise.all([
      $fetch<any>('/api/events', { headers }),
      $fetch<any>('/api/registrations', { headers }),
      $fetch<any>('/api/payments', { headers }),
      $fetch<any>('/api/payment-modes', { headers }),
      $fetch<any>('/api/agents', { headers }),
    ]);

    eventsList.value = Array.isArray(eventRes?.data?.events) ? eventRes.data.events : (Array.isArray(eventRes?.data) ? eventRes.data : []);
    registrationsList.value = Array.isArray(regRes?.data?.registrations) ? regRes.data.registrations : (Array.isArray(regRes?.data) ? regRes.data : []);
    paymentsList.value = Array.isArray(payRes?.data?.payments) ? payRes.data.payments : (Array.isArray(payRes?.data) ? payRes.data : []);
    paymentModesList.value = Array.isArray(modeRes?.data?.payment_modes) ? modeRes.data.payment_modes : (Array.isArray(modeRes?.data) ? modeRes.data : []);
    agentsList.value = Array.isArray(agentRes?.data?.agents) ? agentRes.data.agents : (Array.isArray(agentRes?.data) ? agentRes.data : []);
    loadedOnce.value = true;
  } catch (err) {
    console.error('Failed to load dashboard statistics:', err);
  } finally {
    loading.value = false;
  }
}

function refreshData() {
  fetchDashboardData();
}

// Derived reactive statistics
const totalRegistrationsCount = computed(() => registrationsList.value.length);

const totalRevenueAmount = computed(() => {
  return paymentsList.value.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
});

const activeEventsCount = computed(() => {
  const now = new Date();
  return eventsList.value.filter(e => {
    const endStr = (e.date_to || e.end_date || '').replace(' ', 'T');
    const end = endStr ? new Date(endStr) : null;
    return !end || isNaN(end.getTime()) || now <= end;
  }).length;
});

const activeUpcomingEvents = computed(() => {
  const now = new Date();
  return eventsList.value.filter(e => {
    if (e.status === 'completed' || e.status === 'cancelled') return false;
    const endStr = (e.date_to || e.end_date || '').replace(' ', 'T');
    const end = endStr ? new Date(endStr) : null;
    return !end || isNaN(end.getTime()) || now <= end;
  });
});

const barChartData = computed(() => {
  const events = activeUpcomingEvents.value;
  return {
    labels: events.map(e => e.name),
    datasets: [
      {
        label: 'Registered Delegates',
        data: events.map(e => registrationsList.value.filter(r => r.event_id === e.id).length),
        backgroundColor: events.map((_, idx) => {
          const colors = ['#43766C', '#B19470', '#76453B'];
          return colors[idx % colors.length];
        }),
        borderRadius: 6,
        borderWidth: 0,
        barThickness: 24,
      }
    ]
  };
});
const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'x',
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1e293b',
      titleColor: '#fff',
      bodyColor: '#fff',
      padding: 10,
      cornerRadius: 8,
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#334155', font: { size: 10, weight: 'bold' } }
    },
    y: {
      grid: { borderDash: [4, 4], color: '#e2e8f0' },
      ticks: { color: '#64748b', font: { size: 10 }, stepSize: 1 }
    }
  }
};

const genderBreakdown = computed(() => {
  let male = 0;
  let female = 0;
  let unspecified = 0;
  
  registrationsList.value.forEach(r => {
    const g = (r.gender || '').trim().toLowerCase();
    if (g === 'male' || g === 'm') male++;
    else if (g === 'female' || g === 'f') female++;
    else unspecified++;
  });
  
  return { male, female, unspecified };
});

const pieChartData = computed(() => {
  const breakdown = genderBreakdown.value;
  return {
    labels: ['Male', 'Female', 'Unspecified'],
    datasets: [
      {
        data: [breakdown.male, breakdown.female, breakdown.unspecified],
        backgroundColor: ['#43766C', '#B19470', '#76453B'],
        borderWidth: 2,
        borderColor: '#ffffff',
      }
    ]
  };
});

const pieChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color: '#334155',
        font: { size: 11, weight: 'bold' },
        padding: 10,
        usePointStyle: true,
        pointStyle: 'circle'
      }
    },
    tooltip: {
      callbacks: {
        label: function (context: any) {
          const val = context.raw || 0;
          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0) || 1;
          const pct = Math.round((val / total) * 100);
          return ` ${context.label}: ${val} (${pct}%)`;
        }
      }
    }
  }
};
const paymentModesBreakdown = computed(() => {
  const totalRev = totalRevenueAmount.value || 1;
  return paymentModesList.value.map(mode => {
    const modePayments = paymentsList.value.filter(p => Number(p.payment_mode_id) === Number(mode.id));
    const modeTotalAmount = modePayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const count = modePayments.length;
    const percentage = Math.round((modeTotalAmount / totalRev) * 100);

    return {
      id: mode.id,
      name: mode.name,
      count,
      totalAmount: modeTotalAmount,
      percentage: isNaN(percentage) ? 0 : percentage,
    };
  });
});

const last7DaysRegistrations = computed(() => {
  const result = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const count = registrationsList.value.filter(r => {
      if (!r.created_at) return false;
      return r.created_at.startsWith(dateStr);
    }).length;
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    result.push({ label, count });
  }
  return result;
});

const lineChartData = computed(() => {
  const data = last7DaysRegistrations.value;
  return {
    labels: data.map(d => d.label),
    datasets: [
      {
        label: 'Registrations',
        data: data.map(d => d.count),
        borderColor: '#43766C',
        backgroundColor: 'rgba(67, 118, 108, 0.12)',
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        pointBackgroundColor: '#43766C',
        pointHoverRadius: 6,
        pointRadius: 4,
      }
    ]
  };
});

const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1e293b',
      titleColor: '#fff',
      bodyColor: '#fff',
      padding: 10,
      cornerRadius: 8,
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#64748b', font: { size: 10 } }
    },
    y: {
      grid: { borderDash: [4, 4], color: '#e2e8f0' },
      ticks: { color: '#64748b', font: { size: 10 }, stepSize: 1 }
    }
  }
};

const doughnutChartData = computed(() => {
  const breakdown = paymentModesBreakdown.value;
  return {
    labels: breakdown.map(m => m.name),
    datasets: [
      {
        data: breakdown.map(m => m.totalAmount),
        backgroundColor: [
          '#43766C', // Sage Teal
          '#B19470', // Gold/Tan
          '#76453B', // Terracotta
          '#94a3b8', // Slate
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 4
      }
    ]
  };
});

const doughnutChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color: '#334155',
        font: { size: 11, weight: 'bold' },
        padding: 15,
        usePointStyle: true,
        pointStyle: 'circle'
      }
    },
    tooltip: {
      callbacks: {
        label: function (context: any) {
          const val = context.raw || 0;
          return ` TZS ${val.toLocaleString('en-US')}`;
        }
      }
    }
  },
  cutout: '65%'
};

const systemActivities = computed(() => {
  const activities: any[] = [];
  
  registrationsList.value.forEach(reg => {
    activities.push({
      type: 'registration',
      title: 'New Registration',
      description: `${reg.first_name} ${reg.last_name} registered for ${reg.event?.name || getEventName(reg.event_id) || 'Event'}.`,
      date: reg.created_at ? new Date(reg.created_at) : new Date(),
      status: reg.status,
      icon: 'bi-person-fill',
      colorClass: reg.status === 'Confirmed' ? 'bg-success' : (reg.status === 'Cancelled' ? 'bg-danger' : 'bg-warning'),
    });
  });

  paymentsList.value.forEach(pm => {
    activities.push({
      type: 'payment',
      title: 'Payment Received',
      description: `TZS ${Number(pm.amount).toLocaleString()} verified (Ref: ${pm.reference_no || 'N/A'}) for ${getRegistrationName(pm.registration_id) || 'Delegate'}.`,
      date: pm.created_at ? new Date(pm.created_at) : new Date(),
      status: 'Confirmed',
      icon: 'bi-cash-stack',
      colorClass: 'bg-info',
    });
  });

  return activities.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);
});

const recentPayments = computed(() => {
  return paymentsList.value.slice(0, 5);
});

const pendingRegistrations = computed(() => {
  return registrationsList.value.filter(r => r.status === 'Pending').slice(0, 5);
});

function getRegistrationName(regId: number) {
  const found = registrationsList.value.find(r => r.id === regId);
  if (!found) return '';
  const f = found.first_name || '';
  const l = found.last_name || '';
  return `${f} ${l}`.trim() || `Registration #${regId}`;
}

function getPaymentModeName(modeId: number) {
  const found = paymentModesList.value.find(m => m.id === modeId);
  return found ? found.name : `Mode #${modeId}`;
}

function getEventName(eventId: number) {
  const found = eventsList.value.find(e => e.id === eventId);
  return found ? found.name : `Event #${eventId}`;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatTimeAgo(dateObj: Date) {
  const seconds = Math.floor((new Date().getTime() - dateObj.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

let greetingInterval: any = null;

onMounted(() => {
  fetchDashboardData();
  updateGreeting();
  if (import.meta.client) {
    greetingInterval = setInterval(updateGreeting, 60000);
  }
});

onUnmounted(() => {
  if (greetingInterval) {
    clearInterval(greetingInterval);
  }
});
</script>

<style scoped>
/* ── Dashboard Hero Header ────────────────────────── */
.dashboard-hero-header {
  background: linear-gradient(135deg, var(--green-900) 0%, var(--green-600) 50%, var(--green-500) 100%);
}

.dashboard-avatar-circle {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(4px);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.35rem;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.25);
}

.bg-white-15 { background: rgba(255, 255, 255, 0.15); }
.bg-white-20 { background: rgba(255, 255, 255, 0.22); }
.backdrop-blur { backdrop-filter: blur(4px); }

.btn-glass-secondary {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(4px);
  transition: all 0.18s ease;
}

.btn-glass-secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
}

.btn-glass-white {
  background: #ffffff;
  color: var(--green-900);
  border: none;
  transition: all 0.18s ease;
  text-decoration: none;
}

.btn-glass-white:hover {
  background: var(--green-50);
  color: var(--green-900);
}

/* ── Executive Command Bar ────────────────────────────── */
.command-bar-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
}

.command-bar-icon-box {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--green-50);
  color: var(--green-600);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}

.command-btn {
  transition: all 0.2s ease;
  text-decoration: none;
}

.command-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08) !important;
}

.command-btn--green {
  background: var(--green-50);
  color: var(--green-700);
  border: 1px solid var(--green-200);
}
.command-btn--green:hover {
  background: var(--green-500);
  color: #ffffff;
  border-color: var(--green-500);
}

.command-btn--tan {
  background: #fef3c7;
  color: #b45309;
  border: 1px solid #fde68a;
}
.command-btn--tan:hover {
  background: #B19470;
  color: #ffffff;
  border-color: #B19470;
}

.command-btn--teal {
  background: #e0f2fe;
  color: #0369a1;
  border: 1px solid #bae6fd;
}
.command-btn--teal:hover {
  background: #43766C;
  color: #ffffff;
  border-color: #43766C;
}

.command-btn--terracotta {
  background: #fee2e2;
  color: #b91c1c;
  border: 1px solid #fca5a5;
}
.command-btn--terracotta:hover {
  background: #76453B;
  color: #ffffff;
  border-color: #76453B;
}

/* ── Full-Color KPI Cards ───────────────────────────── */
.full-color-kpi-card {
  transition: transform 0.22s ease, box-shadow 0.22s ease;
}

.full-color-kpi-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 36px rgba(0, 0, 0, 0.12) !important;
}

.full-color-kpi-card--teal {
  background: linear-gradient(135deg, var(--green-900) 0%, var(--green-500) 100%);
}

.full-color-kpi-card--tan {
  background: linear-gradient(135deg, #76453B 0%, #B19470 100%);
}

.full-color-kpi-card--emerald {
  background: linear-gradient(135deg, #1b4d13 0%, var(--green-500) 100%);
}

.full-color-kpi-card--terracotta {
  background: linear-gradient(135deg, #43766C 0%, #76453B 100%);
}

.border-white-20 {
  border-color: rgba(255, 255, 255, 0.2) !important;
}

.text-white-75 {
  color: rgba(255, 255, 255, 0.75) !important;
}

.text-teal-800 { color: var(--green-900); }
.text-tan-800 { color: #76453B; }
.text-emerald-800 { color: #1b4d13; }
.text-terracotta-800 { color: #76453B; }

.kpi-avatar-circle {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(4px);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.25);
}

/* ── Featured Event Banner ────────────────────────── */
.gradient-header-card {
  min-height: 260px;
}

.card-gradient-header {
  background: linear-gradient(135deg, var(--green-900) 0%, var(--green-500) 100%);
}

.header-avatar-circle {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(4px);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.25);
}

.mode-icon-badge {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #e2e8f0;
  color: #475569;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
}

.payment-mode-pill {
  background-color: #f1f5f9;
  color: #334155;
  border-color: #cbd5e1 !important;
}

.spin-animation {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.bg-green-subtle { background-color: var(--green-50); }
.text-green-700 { color: var(--green-700); }
.text-green-800 { color: var(--green-800); }
.text-green-900 { color: var(--green-900); }
.border-green-200 { border-color: var(--green-200) !important; }
.bg-amber-subtle { background-color: #fef3c7; }
.text-amber-700 { color: #b45309; }

/* ── Upgraded Styles ────────────────────────────────── */
.agent-avatar-sm {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.agent-leaderboard-item {
  transition: background-color 0.2s;
}

.agent-leaderboard-item:hover {
  background-color: #f8fafc !important;
}

/* Timeline Feed Styles */
.timeline-stream-badge-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.timeline-stream-badge {
  width: 28px;
  height: 28px;
  font-size: 0.85rem;
  z-index: 2;
  box-shadow: 0 0 0 4px #fff, 0 2px 4px rgba(0,0,0,0.05);
}

.timeline-stream-line {
  position: absolute;
  top: 28px;
  bottom: -15px;
  width: 2px;
  background-color: #f1f5f9;
  z-index: 1;
}

.timeline-stream-item:last-child .timeline-stream-line {
  display: none;
}

.timeline-stream-content {
  flex: 1;
}

.fs-9 {
  font-size: 0.7rem;
}

.chart-container-wrapper {
  transition: opacity 0.3s ease;
}

/* ── Cascade Entry Staggered Animation ─────────── */
@keyframes cascadeFadeIn {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.cascade-item {
  opacity: 0;
  animation: cascadeFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.cascade-item:nth-child(1) { animation-delay: 0.04s; }
.cascade-item:nth-child(2) { animation-delay: 0.08s; }
.cascade-item:nth-child(3) { animation-delay: 0.12s; }
.cascade-item:nth-child(4) { animation-delay: 0.16s; }
.cascade-item:nth-child(5) { animation-delay: 0.20s; }

/* ── Premium Custom Cards Design ───────────────── */
.premium-feed-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  margin-bottom: 8px;
}

.premium-feed-item:hover {
  transform: translateY(-2px);
  background: #ffffff;
  border-color: #e2e8f0;
  box-shadow: 0 4px 12px rgba(67, 118, 108, 0.05);
}

.feed-icon-wrapper {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.bg-green-light { background: #e6f4ea; }
.text-green-dark { color: #137333; }
.bg-amber-light { background: #fef7e0; }
.text-amber-dark { color: #b06000; }

.feed-details {
  flex: 1;
}

.feed-title {
  font-weight: 700;
  color: #1e293b;
  font-size: 0.85rem;
  display: block;
  margin-bottom: 2px;
}

.feed-subtitle {
  font-size: 0.75rem;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 4px;
}

.payment-badge {
  background: #e2e8f0;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.7rem;
  color: #475569;
}

.dot-separator {
  color: #cbd5e1;
}

.feed-action {
  flex-shrink: 0;
}

.feed-value {
  font-weight: 800;
  color: #43766C; /* Sage Teal color variable */
  font-size: 0.85rem;
  display: block;
}

.feed-currency {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.status-pill {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 9999px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-pill--pending {
  background: #fef3c7;
  color: #d97706;
  box-shadow: inset 0 0 0 1px rgba(217, 119, 6, 0.1);
}

/* Premium Timeline */
.premium-timeline {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-left: 12px;
}

.premium-timeline-item {
  position: relative;
  display: flex;
  gap: 16px;
  padding-bottom: 2px;
}

.timeline-line {
  position: absolute;
  left: 17px;
  top: 34px;
  bottom: -22px;
  width: 2px;
  background: #cbd5e1;
}

.premium-timeline-item:last-child .timeline-line {
  display: none;
}

.timeline-badge {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  color: #ffffff;
  z-index: 2;
  box-shadow: 0 0 0 4px #ffffff;
  flex-shrink: 0;
}

.timeline-card {
  flex: 1;
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  padding: 10px 14px;
  border-radius: 14px;
  transition: all 0.2s ease;
}

.timeline-card:hover {
  background: #ffffff;
  border-color: #e2e8f0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.timeline-title {
  font-weight: 700;
  color: #1e293b;
  font-size: 0.8rem;
}

.timeline-time {
  font-size: 0.7rem;
  font-weight: 600;
  color: #94a3b8;
}

.timeline-desc {
  font-size: 0.75rem;
  color: #475569;
  margin: 0;
  line-height: 1.35;
}
</style>
