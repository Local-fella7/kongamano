<template>
  <div class="table-card shadow-sm rounded-4 border-0">
    <!-- Table Header Toolbar / Search -->
    <div class="table-toolbar d-flex align-items-center justify-content-between p-3 border-bottom flex-wrap gap-3">
      <!-- Left: Total Records Count Badge -->
      <div class="d-flex align-items-center gap-2 flex-wrap">
        <span class="badge bg-green-subtle text-green-700 rounded-pill px-3 py-2 fs-7 fw-semibold">
          <i class="bi bi-layers-fill me-1"></i> {{ totalCount }} Total Records
        </span>
      </div>

      <!-- Center: Filter Pills / Selects -->
      <div class="d-flex align-items-center justify-content-center gap-2 flex-wrap flex-grow-1 px-md-3">
        <slot name="filters" />
      </div>

      <!-- Right: Search Input Box -->
      <div class="search-box position-relative ms-auto ms-md-0">
        <i class="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted fs-7"></i>
        <input
          :value="searchQuery"
          @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
          type="text"
          class="form-control form-control-sm ps-5 pe-4 py-2 rounded-pill border-slate-200 search-input"
          placeholder="Search..."
        />
        <button
          v-if="searchQuery"
          @click="$emit('update:searchQuery', '')"
          class="btn btn-link position-absolute top-50 end-0 translate-middle-y text-muted text-decoration-none pe-3 py-0"
          style="font-size: 0.8rem;"
        >
          <i class="bi bi-x-circle-fill"></i>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="state-box">
      <div class="spinner-border text-success" role="status"></div>
      <p class="mt-3 text-muted">Loading data...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="totalCount === 0" class="state-box">
      <i class="bi bi-shield-exclamation empty-icon"></i>
      <p class="mt-3 fw-semibold text-slate-700">No records found</p>
      <p class="text-muted fs-7">
        {{ searchQuery ? 'Try adjusting your search criteria.' : 'Create your first record to get started.' }}
      </p>
      <button v-if="searchQuery" class="btn btn-outline-secondary btn-sm mt-2 rounded-3 px-3" @click="$emit('update:searchQuery', '')">
        Clear Search
      </button>
    </div>

    <!-- Table Slot -->
    <div v-else class="data-table-wrapper">
      <slot />
    </div>

    <!-- Pagination Bar -->
    <div
      v-if="!loading && totalCount > 0"
      class="pagination-footer px-4 py-3 bg-white border-top gap-3 mt-auto"
    >
      <!-- Left Column: Range Info -->
      <div class="pagination-footer__meta fs-7 text-muted fw-medium text-nowrap">
        Showing <span class="fw-bold text-slate-900">{{ startIndex + 1 }}</span> to
        <span class="fw-bold text-slate-900">{{ Math.min(endIndex, totalCount) }}</span> of
        <span class="fw-bold text-slate-900">{{ totalCount }}</span> entries
      </div>

      <!-- Center Column: Page Numbers Navigation -->
      <div class="pagination-footer__pages">
        <AppPagination
          :current-page="currentPage"
          :total-pages="totalPages"
          @update:current-page="$emit('update:currentPage', $event)"
        />
      </div>

      <!-- Right Column: Per Page Selector -->
      <div class="pagination-footer__per-page d-flex align-items-center gap-2 text-nowrap">
        <span class="fs-7 text-muted fw-medium">Per Page:</span>
        <select
          :value="perPage"
          @change="$emit('update:perPage', Number(($event.target as HTMLSelectElement).value))"
          class="form-select form-select-sm rounded-3 fs-7 border-slate-200 shadow-2xs cursor-pointer px-3"
          style="width: auto;"
        >
          <option :value="5">5</option>
          <option :value="10">10</option>
          <option :value="25">25</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppPagination from './AppPagination.vue';

defineProps<{
  loading: boolean;
  totalCount: number;
  searchQuery: string;
  currentPage: number;
  totalPages: number;
  perPage: number;
  startIndex: number;
  endIndex: number;
}>();

defineEmits(['update:searchQuery', 'update:currentPage', 'update:perPage']);
</script>

<style scoped>
.table-card {
  background: #fff;
  border-radius: 14px;
  border: 1px solid var(--color-border);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.data-table-wrapper {
  flex: 1;
  overflow-x: auto;
}

.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.empty-icon {
  font-size: 3rem;
  color: var(--slate-100);
}

.search-input {
  width: 240px;
  transition: width 0.2s ease, border-color 0.2s ease;
}

.search-input:focus {
  width: 300px;
  border-color: var(--green-500);
  box-shadow: 0 0 0 3px rgba(46, 125, 34, 0.15);
}

.bg-green-subtle { background-color: var(--green-50); }
.text-green-700 { color: var(--green-700); }

/* Pagination Styling */
.pagination .page-item .page-link {
  color: var(--slate-700);
  background-color: #fff;
  border: 1px solid var(--color-border);
  font-weight: 500;
  transition: all 0.18s ease;
}

.pagination .page-item .page-link:hover:not(:disabled) {
  background-color: var(--green-50);
  color: var(--green-700);
}

.pagination .page-item.active .page-link {
  background-color: var(--green-500) !important;
  color: #fff !important;
  font-weight: 700;
  box-shadow: 0 4px 10px rgba(46, 125, 34, 0.3);
}

.pagination .page-item.disabled .page-link {
  color: var(--slate-300);
  background-color: transparent;
  opacity: 0.5;
}

/* ── Dark mode overrides ── */
:global([data-theme="dark"]) .table-card {
  background: var(--color-surface) !important;
  border-color: var(--color-border) !important;
}

:global([data-theme="dark"]) .table-toolbar {
  background: var(--color-surface) !important;
  border-bottom-color: var(--color-border) !important;
}

:global([data-theme="dark"]) .pagination-footer {
  background: var(--color-surface) !important;
  border-top-color: var(--color-border) !important;
}

:global([data-theme="dark"]) .data-table-wrapper .data-table {
  color: var(--color-text) !important;
}

:global([data-theme="dark"]) .data-table thead th {
  background: var(--color-surface-2, #21262d) !important;
  color: var(--color-text-muted) !important;
  border-bottom-color: var(--color-border) !important;
}

:global([data-theme="dark"]) .data-table tbody tr {
  border-bottom-color: var(--color-border) !important;
  color: var(--color-text) !important;
}

:global([data-theme="dark"]) .data-table tbody tr:hover {
  background: var(--color-surface-2, #21262d) !important;
}

:global([data-theme="dark"]) .data-table td {
  color: var(--color-text) !important;
  border-color: var(--color-border) !important;
}

:global([data-theme="dark"]) .search-input {
  background: var(--color-surface-2, #21262d) !important;
  border-color: var(--color-border) !important;
  color: var(--color-text) !important;
}

:global([data-theme="dark"]) .pagination .page-item .page-link {
  background-color: var(--color-surface-2, #21262d) !important;
  border-color: var(--color-border) !important;
  color: var(--color-text) !important;
}

:global([data-theme="dark"]) .pagination .page-item .page-link:hover:not(:disabled) {
  background-color: var(--color-surface, #161b22) !important;
  color: #58a6ff !important;
}

:global([data-theme="dark"]) .state-box {
  background: var(--color-surface) !important;
  color: var(--color-text) !important;
}

:global([data-theme="dark"]) .bg-green-subtle {
  background: rgba(63, 185, 80, 0.15) !important;
}
:global([data-theme="dark"]) .text-green-700 {
  color: #3fb950 !important;
}
</style>
