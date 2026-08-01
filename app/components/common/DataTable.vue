<template>
  <div class="table-card shadow-sm rounded-4 border-0">
    <!-- Table Header Toolbar / Search -->
    <div class="table-toolbar d-flex align-items-center justify-content-between p-3 border-bottom flex-wrap gap-3">
      <div class="d-flex align-items-center gap-2">
        <span class="badge bg-green-subtle text-green-700 rounded-pill px-3 py-2 fs-7 fw-semibold">
          <i class="bi bi-layers-fill me-1"></i> {{ totalCount }} Total Records
        </span>
      </div>

      <div class="search-box position-relative">
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

    <!-- Pagination Footer -->
    <div
      v-if="totalCount > 0"
      class="pagination-footer d-flex align-items-center justify-content-between flex-wrap gap-3 px-4 py-3 border-top bg-light-subtle"
    >
      <!-- Left: Range Info -->
      <div class="fs-7 text-muted fw-medium">
        Showing <span class="fw-bold text-slate-900">{{ startIndex + 1 }}</span> to
        <span class="fw-bold text-slate-900">{{ Math.min(endIndex, totalCount) }}</span> of
        <span class="fw-bold text-slate-900">{{ totalCount }}</span> entries
      </div>

      <!-- Center: Page Numbers -->
      <nav v-if="totalPages > 1" aria-label="Page navigation">
        <ul class="pagination pagination-sm mb-0 gap-1">
          <li class="page-item" :class="{ disabled: currentPage === 1 }">
            <button
              class="page-link rounded-3 border-0 shadow-2xs d-flex align-items-center justify-content-center p-0"
              style="width: 32px; height: 32px;"
              @click="$emit('update:currentPage', currentPage - 1)"
              :disabled="currentPage === 1"
            >
              <i class="bi bi-chevron-left fs-8"></i>
            </button>
          </li>
          <li
            v-for="page in totalPages"
            :key="page"
            class="page-item"
            :class="{ active: currentPage === page }"
          >
            <button
              class="page-link rounded-3 border-0 shadow-2xs d-flex align-items-center justify-content-center p-0"
              style="width: 32px; height: 32px;"
              @click="$emit('update:currentPage', page)"
            >
              {{ page }}
            </button>
          </li>
          <li class="page-item" :class="{ disabled: currentPage === totalPages }">
            <button
              class="page-link rounded-3 border-0 shadow-2xs d-flex align-items-center justify-content-center p-0"
              style="width: 32px; height: 32px;"
              @click="$emit('update:currentPage', currentPage + 1)"
              :disabled="currentPage === totalPages"
            >
              <i class="bi bi-chevron-right fs-8"></i>
            </button>
          </li>
        </ul>
      </nav>

      <!-- Right: Items Per Page Selector -->
      <div class="d-flex align-items-center gap-2">
        <span class="fs-7 text-muted fw-medium text-nowrap">Per Page:</span>
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
        </select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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
</style>
