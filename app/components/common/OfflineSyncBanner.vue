<template>
  <div v-if="!isOnline || queue.length > 0 || isSyncing" class="offline-sync-banner shadow-sm">
    <div class="container-fluid d-flex align-items-center justify-content-between py-2 px-3">
      <!-- Offline Notice -->
      <div v-if="!isOnline" class="d-flex align-items-center gap-2 text-warning-emphasis">
        <i class="bi bi-wifi-off fs-5"></i>
        <div>
          <strong class="d-block lh-1">Offline Mode</strong>
          <small class="fs-7">Actions will be saved locally and auto-synced when online.</small>
        </div>
      </div>

      <!-- Syncing State -->
      <div v-else-if="isSyncing" class="d-flex align-items-center gap-2 text-info-emphasis">
        <span class="spinner-border spinner-border-sm" role="status"></span>
        <div>
          <strong class="d-block lh-1">Syncing Data...</strong>
          <small class="fs-7">Uploading {{ queue.length }} queued item(s) to server.</small>
        </div>
      </div>

      <!-- Online with Pending Items -->
      <div v-else-if="queue.length > 0" class="d-flex align-items-center gap-2 text-primary-emphasis">
        <i class="bi bi-cloud-arrow-up-fill fs-5"></i>
        <div>
          <strong class="d-block lh-1">Pending Offline Queue</strong>
          <small class="fs-7">{{ queue.length }} item(s) ready to sync.</small>
        </div>
      </div>

      <!-- Actions -->
      <div class="d-flex align-items-center gap-2">
        <span v-if="queue.length > 0" class="badge bg-amber text-dark rounded-pill px-2-5 py-1">
          {{ queue.length }} Pending
        </span>

        <button
          v-if="isOnline && queue.length > 0"
          @click="processQueue"
          :disabled="isSyncing"
          class="btn btn-sm btn-primary d-flex align-items-center gap-1 shadow-xs"
        >
          <i class="bi bi-arrow-repeat" :class="{ 'spin-icon': isSyncing }"></i>
          <span>{{ isSyncing ? 'Syncing...' : 'Sync Now' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { isOnline, queue, isSyncing, processQueue } = useOfflineSync();
</script>

<style scoped>
.offline-sync-banner {
  background-color: var(--color-surface, #ffffff);
  border-bottom: 1px solid var(--color-border, #e2e8f0);
  transition: all 0.3s ease;
  z-index: 1040;
}

.text-warning-emphasis {
  color: #854d0e;
}

.text-info-emphasis {
  color: #1e40af;
}

.text-primary-emphasis {
  color: #15803d;
}

.bg-amber {
  background-color: #fef08a;
  color: #713f12;
}

.px-2-5 {
  padding-left: 0.65rem;
  padding-right: 0.65rem;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
