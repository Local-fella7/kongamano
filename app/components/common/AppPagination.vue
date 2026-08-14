<template>
  <nav aria-label="Page navigation" class="d-flex align-items-center">
    <ul class="pagination pagination-sm mb-0 gap-1 flex-nowrap align-items-center">
      <!-- First Page -->
      <li class="page-item" :class="{ disabled: currentPage === 1 }">
        <button
          class="page-link rounded-3 border-0 shadow-2xs d-flex align-items-center justify-content-center p-0"
          style="width: 32px; height: 32px;"
          @click="goToPage(1)"
          :disabled="currentPage === 1"
          title="First Page"
          aria-label="First Page"
        >
          <span aria-hidden="true">&laquo;</span>
        </button>
      </li>

      <!-- Previous Page -->
      <li class="page-item" :class="{ disabled: currentPage === 1 }">
        <button
          class="page-link rounded-3 border-0 shadow-2xs d-flex align-items-center justify-content-center px-2 gap-1 fs-7"
          style="height: 32px;"
          @click="goToPage(currentPage - 1)"
          :disabled="currentPage === 1"
          title="Previous Page"
          aria-label="Previous Page"
        >
          <span aria-hidden="true">&lsaquo;</span>
          <span>Prev</span>
        </button>
      </li>

      <!-- Page Numbers / Ellipses -->
      <li
        v-for="(item, index) in visiblePages"
        :key="index"
        class="page-item"
        :class="{ active: item === currentPage, disabled: item === '...' }"
      >
        <span
          v-if="item === '...'"
          class="page-link border-0 bg-transparent text-muted px-1 d-flex align-items-center justify-content-center"
          style="width: 24px; height: 32px; cursor: default;"
        >
          &hellip;
        </span>
        <button
          v-else
          class="page-link rounded-3 border-0 shadow-2xs d-flex align-items-center justify-content-center p-0"
          style="width: 32px; height: 32px;"
          @click="goToPage(item as number)"
        >
          {{ item }}
        </button>
      </li>

      <!-- Next Page -->
      <li class="page-item" :class="{ disabled: currentPage === totalPages }">
        <button
          class="page-link rounded-3 border-0 shadow-2xs d-flex align-items-center justify-content-center px-2 gap-1 fs-7"
          style="height: 32px;"
          @click="goToPage(currentPage + 1)"
          :disabled="currentPage === totalPages"
          title="Next Page"
          aria-label="Next Page"
        >
          <span>Next</span>
          <span aria-hidden="true">&rsaquo;</span>
        </button>
      </li>

      <!-- Last Page -->
      <li class="page-item" :class="{ disabled: currentPage === totalPages }">
        <button
          class="page-link rounded-3 border-0 shadow-2xs d-flex align-items-center justify-content-center p-0"
          style="width: 32px; height: 32px;"
          @click="goToPage(totalPages)"
          :disabled="currentPage === totalPages"
          title="Last Page"
          aria-label="Last Page"
        >
          <span aria-hidden="true">&raquo;</span>
        </button>
      </li>
    </ul>

    <!-- Jump to Page Input for large datasets -->
    <div v-if="showJump && totalPages > 5" class="d-none d-md-flex align-items-center gap-1.5 ms-3 ps-3 border-start">
      <span class="fs-8 text-muted fw-medium text-nowrap">Go to:</span>
      <input
        type="number"
        min="1"
        :max="totalPages"
        v-model.number="jumpPageInput"
        @keyup.enter="handleJump"
        class="form-select form-select-sm rounded-3 fs-8 py-1 px-2 border-slate-200 text-center shadow-2xs"
        style="width: 58px;"
        placeholder="Page"
      />
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

const props = withDefaults(
  defineProps<{
    currentPage: number;
    totalPages: number;
    maxVisiblePages?: number;
    showJump?: boolean;
  }>(),
  {
    maxVisiblePages: 5,
    showJump: false,
  }
);

const emit = defineEmits<{
  (e: 'update:currentPage', page: number): void;
}>();

const jumpPageInput = ref<number | string>('');

watch(() => props.currentPage, (val) => {
  jumpPageInput.value = val;
}, { immediate: true });

const visiblePages = computed(() => {
  const total = Math.max(1, props.totalPages);
  const current = Math.max(1, Math.min(props.currentPage, total));
  const max = props.maxVisiblePages;

  if (total === 1) {
    return [1];
  }

  if (total <= max) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | string)[] = [];
  const sidePages = 1;

  let startPage = Math.max(2, current - sidePages);
  let endPage = Math.min(total - 1, current + sidePages);

  if (current <= 3) {
    endPage = Math.min(total - 1, 4);
  } else if (current >= total - 2) {
    startPage = Math.max(2, total - 3);
  }

  pages.push(1);

  if (startPage > 2) {
    pages.push('...');
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  if (endPage < total - 1) {
    pages.push('...');
  }

  pages.push(total);

  return pages;
});

function goToPage(page: number) {
  const target = Math.max(1, Math.min(page, props.totalPages));
  if (target !== props.currentPage) {
    emit('update:currentPage', target);
  }
}

function handleJump() {
  const pageNum = Number(jumpPageInput.value);
  if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= props.totalPages) {
    goToPage(pageNum);
  } else {
    jumpPageInput.value = props.currentPage;
  }
}
</script>

<style scoped>
.page-link {
  background-color: var(--green-500);
  color: #fff;
  font-weight: 600;
  line-height: 1;
  transition: background-color 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
}

.page-link:hover:not(:disabled) {
  background-color: var(--green-600);
  color: #fff;
  box-shadow: 0 4px 10px rgba(46, 125, 34, 0.24);
}

.page-item.active .page-link {
  background-color: var(--green-700);
  color: #fff;
  box-shadow: 0 4px 12px rgba(46, 125, 34, 0.32);
}

.page-item.disabled .page-link,
.page-link:disabled {
  background-color: var(--green-50);
  color: var(--green-300);
  opacity: 0.72;
  box-shadow: none;
}

.page-item.disabled .page-link.bg-transparent {
  background-color: transparent !important;
  color: var(--color-text-muted);
  opacity: 1;
}

:global([data-theme="dark"]) .page-link {
  background-color: var(--green-600);
  color: #fff;
}

:global([data-theme="dark"]) .page-link:hover:not(:disabled) {
  background-color: var(--green-500);
  color: #fff;
}

:global([data-theme="dark"]) .page-item.active .page-link {
  background-color: var(--green-500);
  color: #fff;
}

:global([data-theme="dark"]) .page-item.disabled .page-link,
:global([data-theme="dark"]) .page-link:disabled {
  background-color: rgba(46, 125, 34, 0.18);
  color: rgba(255, 255, 255, 0.45);
}
</style>
