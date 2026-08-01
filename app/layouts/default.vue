<template>
  <div class="layout-default">
    <NavigationAppSidebar />
    <div class="main-wrapper">
      <header class="app-header">
        <div class="header-title">
          <h3>Kongamano Event Management</h3>
        </div>
      </header>
      <main class="page-content">
        <slot />
      </main>
    </div>
  </div>
</template>

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
  height: 60px;
  background-color: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  padding: 0 2rem;
}
.page-content {
  padding: 2rem;
  flex: 1;
}
</style>
