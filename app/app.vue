<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <!-- Global Toast Notifications -->
    <!-- comment -->
    <Notivue v-slot="item">
      <Notification :item="item" />
    </Notivue>
  </div>
</template>
