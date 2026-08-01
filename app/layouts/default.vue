<template>
  <div class="layout-default">
    <NavigationAppSidebar />
    <div class="main-wrapper">
      <header class="app-header">
        <div class="header-title">
          <h5 class="mb-0 fw-bold text-slate-900">Kongamano Event Management</h5>
        </div>
        <div class="header-user d-flex align-items-center gap-3">
          <span v-if="authStore.user" class="fw-semibold text-slate-700 fs-7">
            {{ authStore.user.first_name }} {{ authStore.user.last_name }}
          </span>
          <button @click="authStore.logout()" class="btn btn-outline-danger btn-sm d-flex align-items-center gap-1">
            <i class="bi bi-box-arrow-right"></i>
            <span>Logout</span>
          </button>
        </div>
      </header>
      <main class="page-content">
        <slot />
      </main>
    </div>
    <!-- Global Toast Notifications Container -->
    <Notivue v-slot="item">
      <Notification :item="item" />
    </Notivue>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth';

const authStore = useAuthStore();
</script>

<style scoped>
.layout-default {
  display: flex;
  min-height: 100vh;
}
.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.app-header {
  height: 64px;
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
}
.page-content {
  padding: 2rem;
  flex: 1;
}
</style>
