<template>
  <aside class="app-sidebar" :class="{ 'is-collapsed': isCollapsed }">

    <!-- Brand -->
    <div class="sidebar-brand">
      <NuxtLink to="/" class="brand-link">
        <img src="/mana ministries.png" alt="Logo" class="brand-logo" />
        <div v-if="!isCollapsed" class="brand-names">
          <span class="brand-title">Kongamano</span>
          <small class="brand-sub">Mana Ministries</small>
        </div>
      </NuxtLink>
      <button @click="$emit('toggle')" class="collapse-btn" :title="isCollapsed ? 'Expand' : 'Collapse'">
        <i :class="['bi', isCollapsed ? 'bi-chevron-double-right' : 'bi-chevron-double-left']"></i>
      </button>
    </div>

    <!-- Nav -->
    <nav class="sidebar-nav">
      <div v-for="group in navGroups" :key="group.title" class="nav-section">
        <div v-if="!isCollapsed" class="nav-section-label">{{ group.title }}</div>
        <div v-else class="nav-section-divider"></div>

        <template v-for="item in group.items" :key="item.name">

          <!-- Expandable parent item -->
          <template v-if="item.children">
            <button
              class="nav-item nav-item--parent"
              :class="{ 'nav-item--open': getItemOpenState(item), 'nav-item--child-active': isChildActive(item) }"
              @click="toggleItemOpen(item)"
              :title="isCollapsed ? item.name : undefined"
            >
              <i :class="['bi', item.icon, 'nav-item-icon']"></i>
              <span v-if="!isCollapsed" class="nav-item-label">{{ item.name }}</span>
              <i
                v-if="!isCollapsed"
                class="bi nav-chevron"
                :class="getItemOpenState(item) ? 'bi-chevron-up' : 'bi-chevron-down'"
              ></i>
            </button>

            <!-- Dropdown children -->
            <Transition name="dropdown">
              <div v-if="!isCollapsed && getItemOpenState(item)" class="setup-dropdown">
                <NuxtLink
                  v-for="child in item.children"
                  :key="child.to"
                  :to="child.to"
                  class="nav-item nav-item--child"
                  active-class="nav-item--active"
                  exact-active-class="nav-item--active"
                >
                  <span class="child-dot"></span>
                  <i :class="['bi', child.icon, 'nav-item-icon child-icon']"></i>
                  <span class="nav-item-label">{{ child.name }}</span>
                </NuxtLink>
              </div>
            </Transition>
          </template>

          <!-- Regular item -->
          <NuxtLink
            v-else
            :to="item.to"
            class="nav-item"
            :title="isCollapsed ? item.name : undefined"
            active-class="nav-item--active"
            exact-active-class="nav-item--active"
          >
            <i :class="['bi', item.icon, 'nav-item-icon']"></i>
            <span v-if="!isCollapsed" class="nav-item-label">{{ item.name }}</span>
          </NuxtLink>

        </template>
      </div>
    </nav>

    <!-- User Footer -->
    <div class="sidebar-footer">
      <div class="user-row">
        <div class="user-avatar">{{ userInitials }}</div>
        <div v-if="!isCollapsed" class="user-meta">
          <span class="user-name">{{ authStore.user?.first_name || 'Admin' }} {{ authStore.user?.last_name || '' }}</span>
          <small class="user-username">@{{ authStore.user?.username || 'user' }}</small>
        </div>
        <button v-if="!isCollapsed" @click="authStore.logout()" class="logout-btn" title="Sign Out">
          <i class="bi bi-box-arrow-right"></i>
        </button>
      </div>
    </div>

  </aside>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';

defineProps<{ isCollapsed: boolean }>();
defineEmits(['toggle']);

const authStore = useAuthStore();
const route = useRoute();

const userInitials = computed(() => {
  const f = authStore.user?.first_name?.[0] || 'A';
  const l = authStore.user?.last_name?.[0] || 'U';
  return `${f}${l}`.toUpperCase();
});

// Dropdown open states
const setupOpen = ref(route.path.startsWith('/setup'));
const eventsOpen = ref(route.path.startsWith('/events'));
const notificationsOpen = ref(route.path.startsWith('/notifications'));

watch(() => route.path, (p) => {
  if (p.startsWith('/setup')) setupOpen.value = true;
  if (p.startsWith('/events')) eventsOpen.value = true;
  if (p.startsWith('/notifications')) notificationsOpen.value = true;
});

function isChildActive(item: any): boolean {
  return item.children?.some((c: any) => route.path.startsWith(c.to));
}

function getItemOpenState(item: any): boolean {
  if (item.name === 'Events') return eventsOpen.value;
  if (item.name === 'Setup') return setupOpen.value;
  if (item.name === 'Notifications') return notificationsOpen.value;
  return false;
}

function toggleItemOpen(item: any) {
  if (item.name === 'Events') eventsOpen.value = !eventsOpen.value;
  if (item.name === 'Setup') setupOpen.value = !setupOpen.value;
  if (item.name === 'Notifications') notificationsOpen.value = !notificationsOpen.value;
}

const navGroups = [
  {
    title: 'Main',
    items: [
      { name: 'Dashboard', to: '/', icon: 'bi-grid-1x2-fill' },
      { name: 'Events', to: '/events', icon: 'bi-calendar-event-fill' },
    ],
  },
  {
    title: 'Management',
    items: [
      { name: 'Registrations', to: '/registrations', icon: 'bi-people-fill' },
      { name: 'Payments', to: '/payments', icon: 'bi-credit-card-fill' },
      { name: 'Agents', to: '/agents', icon: 'bi-person-badge-fill' },
      {
        name: 'Notifications',
        icon: 'bi-bell-fill',
        children: [
          { name: 'Notifications Catalog', to: '/notifications', icon: 'bi-bell-fill' },
          { name: 'Notification Registrations', to: '/notification-registrations', icon: 'bi-envelope-check-fill' },
        ],
      },
    ],
  },
  {
    title: 'System',
    items: [
      { name: 'Users & Staff', to: '/users', icon: 'bi-shield-lock-fill' },
      {
        name: 'Setup',
        icon: 'bi-gear-wide-connected',
        children: [
          { name: 'Roles', to: '/setup/roles', icon: 'bi-shield-fill-check' },
          { name: 'Event Types', to: '/setup/event-types', icon: 'bi-tag-fill' },
          { name: 'Payment Modes', to: '/setup/payment-modes', icon: 'bi-wallet2' },
          { name: 'Titles', to: '/setup/titles', icon: 'bi-person-badge' },
          { name: 'Services', to: '/setup/services', icon: 'bi-lightning-fill' },
          { name: 'Accommodations', to: '/setup/accommodations', icon: 'bi-building' },
          { name: 'Notification Templates', to: '/setup/notification-templates', icon: 'bi-bell-fill' },
          { name: 'Feature Groups', to: '/setup/feature-groups', icon: 'bi-diagram-3-fill' },
          { name: 'Features', to: '/setup/features', icon: 'bi-toggles' },
          { name: 'Role Permissions', to: '/setup/role-features', icon: 'bi-key-fill' },
        ],
      },
    ],
  },
];
</script>

<style scoped>
.app-sidebar {
  width: 256px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, var(--green-900) 0%, #152414 60%, var(--slate-900) 100%);
  transition: width 0.25s ease, transform 0.25s ease;
  flex-shrink: 0;
  border-right: 1px solid rgba(255,255,255,0.06);
}

.app-sidebar.is-collapsed {
  width: 72px;
}

/* ── Mobile Responsive Drawer ────────────────────── */
@media (max-width: 991.98px) {
  .app-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 1050;
    transform: translateX(0);
  }

  .app-sidebar.is-collapsed {
    transform: translateX(-100%);
    width: 256px;
  }
}

/* ─── Brand ─────────────────────────────────────────── */
.sidebar-brand {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.1rem 1rem;
  border-bottom: 1px solid rgba(155, 203, 143, 0.15);
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  text-decoration: none;
  overflow: hidden;
}

.brand-logo {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: #fff;
  padding: 3px;
  object-fit: contain;
  flex-shrink: 0;
}

.brand-names {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.brand-title {
  font-size: 1rem;
  font-weight: 700;
  color: #ffffff;
  white-space: nowrap;
  letter-spacing: 0.01em;
}

.brand-sub {
  font-size: 0.72rem;
  color: var(--green-200);
  white-space: nowrap;
}

.collapse-btn {
  background: rgba(155, 203, 143, 0.12);
  border: none;
  border-radius: 7px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--green-200);
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.18s;
}

.collapse-btn:hover {
  background: rgba(155, 203, 143, 0.25);
}

/* ─── Nav ────────────────────────────────────────────── */
.sidebar-nav {
  flex: 1;
  padding: 0.75rem 0.65rem;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  overflow-y: auto;
}

.nav-section {
  margin-bottom: 0.3rem;
}

.nav-section-label {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(155, 203, 143, 0.5);
  padding: 0.6rem 0.75rem 0.3rem;
}

.nav-section-divider {
  height: 1px;
  background: rgba(155, 203, 143, 0.15);
  margin: 0.5rem 0.4rem;
}

/* ─── Nav Item ───────────────────────────────────────── */
.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.85rem;
  border-radius: 9px;
  color: rgba(195, 226, 188, 0.75);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.18s ease;
  white-space: nowrap;
  overflow: hidden;
  width: 100%;
  background: transparent;
  border: none;
  text-align: left;
  cursor: pointer;
}

.nav-item:hover {
  background: rgba(155, 203, 143, 0.12);
  color: #ffffff;
}

.nav-item--active {
  background: var(--green-500) !important;
  color: #ffffff !important;
  font-weight: 600;
  box-shadow: 0 3px 12px rgba(46, 125, 34, 0.45);
}

/* Parent open or has active child */
.nav-item--open,
.nav-item--child-active {
  background: rgba(155, 203, 143, 0.1);
  color: #ffffff;
}

/* Child items — indented, with dot */
.nav-item--child {
  font-size: 0.83rem;
  padding: 0.5rem 0.85rem 0.5rem 1.4rem;
  color: rgba(195, 226, 188, 0.65);
}

.child-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(155, 203, 143, 0.4);
  flex-shrink: 0;
  transition: background 0.18s;
}

.nav-item--child:hover .child-dot {
  background: rgba(155, 203, 143, 0.9);
}

.nav-item--active .child-dot {
  background: #ffffff !important;
}

.child-icon {
  font-size: 0.85rem !important;
}

.nav-item-icon {
  font-size: 1rem;
  flex-shrink: 0;
  width: 20px;
  text-align: center;
}

.nav-item-label {
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.nav-chevron {
  font-size: 0.7rem;
  color: rgba(155, 203, 143, 0.6);
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

/* ─── Setup Dropdown ─────────────────────────────────── */
.setup-dropdown {
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
  overflow: hidden;
}

/* ─── Dropdown Transition ────────────────────────────── */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.22s ease;
  max-height: 600px;
  opacity: 1;
}

.dropdown-enter-from,
.dropdown-leave-to {
  max-height: 0;
  opacity: 0;
}

/* ─── Footer ─────────────────────────────────────────── */
.sidebar-footer {
  padding: 0.85rem 0.9rem;
  border-top: 1px solid rgba(155, 203, 143, 0.15);
}

.user-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--green-500);
  color: #ffffff;
  font-weight: 700;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(46, 125, 34, 0.4);
}

.user-meta {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-username {
  font-size: 0.7rem;
  color: var(--green-200);
  white-space: nowrap;
}

.logout-btn {
  background: transparent;
  border: none;
  color: rgba(155, 203, 143, 0.5);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 6px;
  font-size: 1rem;
  transition: color 0.18s;
  flex-shrink: 0;
}

.logout-btn:hover {
  color: var(--red-300);
}
</style>
