<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <!-- Global Toast Notifications -->
    <Notivue v-slot="item">
      <Notification :item="item" />
    </Notivue>
  </div>
</template>
