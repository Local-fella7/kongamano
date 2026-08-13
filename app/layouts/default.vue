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

          <div class="dropdown position-relative" ref="userDropdownRef">
            <button
              class="user-btn"
              type="button"
              @click="isUserMenuOpen = !isUserMenuOpen"
            >
              <div class="header-avatar">{{ userInitials }}</div>
              <span class="d-none d-sm-inline user-btn-name">
                {{ authStore.user?.first_name || 'Admin' }}
              </span>
              <i class="bi bi-chevron-down header-chevron" :class="{ 'rotate-180': isUserMenuOpen }"></i>
            </button>

            <!-- Dropdown Menu -->
            <div
              v-if="isUserMenuOpen"
              class="header-dropdown-menu shadow-lg border-0 p-2 position-absolute end-0 mt-2"
            >
              <div class="dropdown-header-info p-2 mb-1 rounded-3 bg-light">
                <span class="dh-name d-block fw-bold text-slate-900 fs-7">
                  {{ authStore.user?.first_name || 'Admin' }} {{ authStore.user?.last_name || 'User' }}
                </span>
                <small class="dh-username text-muted fs-8">
                  @{{ authStore.user?.username || 'admin' }}
                </small>
              </div>
              <hr class="dropdown-divider my-1">
              <NuxtLink
                to="/profile"
                class="dropdown-menu-item rounded-2 py-2 px-3 fs-7 d-flex align-items-center gap-2 text-decoration-none text-slate-700"
                @click="isUserMenuOpen = false"
              >
                <i class="bi bi-person-circle text-green-500"></i>
                <span>My Profile</span>
              </NuxtLink>
              <NuxtLink
                to="/setup/roles"
                class="dropdown-menu-item rounded-2 py-2 px-3 fs-7 d-flex align-items-center gap-2 text-decoration-none text-slate-700"
                @click="isUserMenuOpen = false"
              >
                <i class="bi bi-gear text-slate-500"></i>
                <span>Settings</span>
              </NuxtLink>
              <hr class="dropdown-divider my-1">
              <button
                @click="handleLogout"
                class="dropdown-menu-item btn-logout-item w-100 rounded-2 py-2 px-3 fs-7 text-danger border-0 bg-transparent text-start d-flex align-items-center gap-2"
              >
                <i class="bi bi-box-arrow-right"></i>
                <span>Sign Out</span>
              </button>
            </div>
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
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';

const authStore = useAuthStore();
const route = useRoute();
const isSidebarCollapsed = ref(false);
const isUserMenuOpen = ref(false);
const userDropdownRef = ref<HTMLElement | null>(null);
const { isDark, toggleTheme, initTheme } = useTheme();

function handleClickOutside(event: MouseEvent) {
  if (userDropdownRef.value && !userDropdownRef.value.contains(event.target as Node)) {
    isUserMenuOpen.value = false;
  }
}

watch(
  () => route.path,
  () => {
    if (import.meta.client && window.innerWidth < 992) {
      isSidebarCollapsed.value = true;
    }
  }
);

onMounted(() => {
  initTheme();
  if (import.meta.client) {
    if (window.innerWidth < 992) {
      isSidebarCollapsed.value = true;
    } else {
      const saved = localStorage.getItem('kongamano_sidebar_collapsed');
      if (saved !== null) isSidebarCollapsed.value = JSON.parse(saved);
    }
    document.addEventListener('click', handleClickOutside);
  }
});

onUnmounted(() => {
  if (import.meta.client) {
    document.removeEventListener('click', handleClickOutside);
  }
});

function toggleSidebar() {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
  if (import.meta.client) {
    localStorage.setItem('kongamano_sidebar_collapsed', JSON.stringify(isSidebarCollapsed.value));
  }
}

function handleLogout() {
  isUserMenuOpen.value = false;
  authStore.logout();
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
  if (p.startsWith('/scannings')) return 'Scannings & Check-ins';
  if (p.startsWith('/payments')) return 'Payments';
  if (p.startsWith('/agents')) return 'Agents';
  if (p.startsWith('/reports/executive')) return 'Reports — Executive Summaries';
  if (p.startsWith('/reports/delegates')) return 'Reports — Delegates & Registrations';
  if (p.startsWith('/reports/financial')) return 'Reports — Financial Ledgers';
  if (p.startsWith('/reports/attendance')) return 'Reports — Attendance & Scannings';
  if (p.startsWith('/reports')) return 'Reports & Analytics';
  if (p.startsWith('/notifications')) return 'Notifications';
  if (p.startsWith('/users')) return 'Users & Staff';
  if (p.startsWith('/profile')) return 'My Profile';
  if (p.startsWith('/setup')) return 'Setup';
  return 'Kongamano';
});
</script>

<style scoped>
.layout-default {
  display: flex;
  height: 100vh;
  overflow: hidden;
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

.rotate-180 {
  transform: rotate(180deg);
}

.header-dropdown-menu {
  min-width: 220px;
  background: #ffffff;
  border-radius: 12px;
  z-index: 1100;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12) !important;
}

.dropdown-menu-item {
  transition: all 0.18s ease;
  font-weight: 500;
}

.dropdown-menu-item:hover {
  background-color: var(--slate-50);
}

.btn-logout-item:hover {
  background-color: var(--red-50) !important;
  color: var(--red-500) !important;
}
</style>
