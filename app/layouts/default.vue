<template>
  <div class="layout-default">

    <NavigationAppSidebar
      :is-collapsed="isSidebarCollapsed"
      @toggle="toggleSidebar"
    />

    <!-- Mobile Backdrop Overlay -->
    <div
      v-if="!isSidebarCollapsed"
      class="sidebar-backdrop d-lg-none"
      @click="isSidebarCollapsed = true"
    ></div>

    <div class="main-wrapper">

      <!-- Top Header -->
      <header class="app-header">
        <div class="header-left">
          <button @click="toggleSidebar" class="menu-btn d-lg-none" title="Toggle Menu">
            <i class="bi bi-list"></i>
          </button>
          <div class="page-info">
            <h1 class="page-title">{{ currentPageTitle }}</h1>
            <span class="page-sub">Kongamano · Mana Ministries</span>
          </div>
        </div>

        <div class="header-right">
          <!-- Search -->
          <div class="search-wrap d-none d-md-flex">
            <i class="bi bi-search search-icon"></i>
            <input
              type="text"
              class="search-input"
              placeholder="Search events, attendees..."
            />
          </div>

          <!-- User dropdown -->
          <div class="dropdown">
            <button
              class="user-btn"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <div class="header-avatar">{{ userInitials }}</div>
              <span class="d-none d-sm-inline user-btn-name">
                {{ authStore.user?.first_name || 'Admin' }}
              </span>
              <i class="bi bi-chevron-down header-chevron"></i>
            </button>
            <ul class="dropdown-menu dropdown-menu-end header-dropdown shadow border-0 mt-2 p-2">
              <li class="dropdown-header-info">
                <span class="dh-name">{{ authStore.user?.first_name }} {{ authStore.user?.last_name }}</span>
                <small class="dh-username">@{{ authStore.user?.username }}</small>
              </li>
              <li><hr class="dropdown-divider my-1"></li>
              <li>
                <NuxtLink to="/setup" class="dropdown-item rounded-2 py-2 fs-7 d-flex align-items-center gap-2">
                  <i class="bi bi-gear text-muted"></i>
                  <span>Settings</span>
                </NuxtLink>
              </li>
              <li>
                <button
                  @click="authStore.logout()"
                  class="dropdown-item rounded-2 py-2 fs-7 text-danger d-flex align-items-center gap-2"
                >
                  <i class="bi bi-box-arrow-right"></i>
                  <span>Sign Out</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </header>

      <!-- Offline Banner -->
      <CommonOfflineSyncBanner />

      <!-- Page Content -->
      <main class="page-content">
        <slot />
      </main>

    </div>

    <Notivue v-slot="item">
      <Notification :item="item" />
    </Notivue>

  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';

const authStore = useAuthStore();
const route = useRoute();
const isSidebarCollapsed = ref(false);

onMounted(() => {
  if (import.meta.client) {
    const saved = localStorage.getItem('kongamano_sidebar_collapsed');
    if (saved !== null) isSidebarCollapsed.value = JSON.parse(saved);
  }
});

function toggleSidebar() {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
  if (import.meta.client) {
    localStorage.setItem('kongamano_sidebar_collapsed', JSON.stringify(isSidebarCollapsed.value));
  }
}

const userInitials = computed(() => {
  const f = authStore.user?.first_name?.[0] || 'A';
  const l = authStore.user?.last_name?.[0] || 'U';
  return `${f}${l}`.toUpperCase();
});

const currentPageTitle = computed(() => {
  const p = route.path;
  if (p === '/') return 'Dashboard';
  if (p.startsWith('/events')) return 'Events';
  if (p.startsWith('/registrations')) return 'Registrations';
  if (p.startsWith('/payments')) return 'Payments';
  if (p.startsWith('/agents')) return 'Agents';
  if (p.startsWith('/users')) return 'Users & Staff';
  if (p.startsWith('/setup')) return 'Setup';
  return 'Kongamano';
});
</script>

<style scoped>
.layout-default {
  display: flex;
  min-height: 100vh;
  background-color: var(--slate-50);
}

.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background-color: var(--slate-50);
}

/* ─── Header ─────────────────────────────────────────── */
.app-header {
  height: 64px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  flex-shrink: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.menu-btn {
  background: transparent;
  border: 1.5px solid var(--color-border);
  border-radius: 9px;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: var(--green-500);
  cursor: pointer;
  transition: all 0.18s;
}

.menu-btn:hover {
  background: var(--green-500);
  color: #ffffff;
  border-color: var(--green-500);
}

.page-info {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.page-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--slate-900);
  margin: 0;
}

.page-sub {
  font-size: 0.7rem;
  color: var(--green-400);
  font-weight: 500;
}

/* ─── Header Right ───────────────────────────────────── */
.header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.search-wrap {
  position: relative;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  color: var(--green-400);
  font-size: 0.85rem;
  pointer-events: none;
}

.search-input {
  background: var(--green-50);
  border: 1.5px solid var(--green-100);
  border-radius: 20px;
  padding: 0.45rem 1rem 0.45rem 2.2rem;
  font-size: 0.82rem;
  width: 220px;
  color: var(--slate-900);
  transition: width 0.2s ease, border-color 0.18s;
  outline: none;
}

.search-input::placeholder {
  color: var(--green-300);
}

.search-input:focus {
  width: 290px;
  border-color: var(--green-500);
  background: #fff;
  box-shadow: 0 0 0 3px rgba(46, 125, 34, 0.12);
}

/* ─── User Button ─────────────────────────────────────── */
.user-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--green-50);
  border: 1.5px solid var(--green-100);
  border-radius: 20px;
  padding: 0.35rem 0.85rem 0.35rem 0.45rem;
  cursor: pointer;
  transition: border-color 0.18s;
}

.user-btn:hover {
  border-color: var(--green-500);
}

.header-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--green-500);
  color: #ffffff;
  font-weight: 700;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-btn-name {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--slate-900);
}

.header-chevron {
  font-size: 0.65rem;
  color: var(--green-400);
}

/* ─── Dropdown ─────────────────────────────────────────── */
.header-dropdown {
  min-width: 200px;
  border-radius: 12px !important;
}

.menu-btn {
  background: transparent;
  border: 1.5px solid var(--color-border);
  border-radius: 9px;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: var(--green-500);
  cursor: pointer;
  transition: all 0.18s;
}

.menu-btn:hover {
  background: var(--green-500);
  color: #ffffff;
  border-color: var(--green-500);
}

.sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 1040;
  backdrop-filter: blur(2px);
}

@media (max-width: 575.98px) {
  .page-content {
    padding: 1rem !important;
  }
  .app-header {
    padding: 0 1rem !important;
  }
}

.dropdown-header-info {
  padding: 0.5rem 0.85rem 0.6rem;
  display: flex;
  flex-direction: column;
}

.dh-name {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--slate-900);
}

.dh-username {
  font-size: 0.72rem;
  color: var(--green-400);
}

/* ─── Page Content ─────────────────────────────────────── */
.page-content {
  flex: 1;
  padding: 1.75rem;
  overflow-y: auto;
}
</style>
