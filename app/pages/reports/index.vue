<script setup lang="ts">
definePageMeta({
  middleware: [
    function () {
      return navigateTo('/reports/executive', { replace: true });
    },
  ],
});
</script>

<template>
  <div class="p-5 text-center text-muted fs-7">
    Redirecting to Executive Summaries...
  </div>
</template>
