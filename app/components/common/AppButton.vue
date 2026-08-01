<template>
  <button :class="['btn', `btn-${variant}`]" :disabled="loading" v-bind="$attrs">
    <slot />
  </button>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'accent' | 'dark';
    loading?: boolean;
  }>(),
  {
    variant: 'primary',
    loading: false,
  }
);
</script>

<style scoped>
.btn {
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-primary {
  background-color: var(--color-primary);
  color: #fff;
}
.btn-primary:hover {
  background-color: var(--color-primary-hover);
}
.btn-secondary {
  background-color: var(--color-accent-gold);
  color: #fff;
}
.btn-dark {
  background-color: var(--color-dark);
  color: #fff;
}
.btn-dark:hover {
  background-color: var(--color-dark-hover);
}
</style>
