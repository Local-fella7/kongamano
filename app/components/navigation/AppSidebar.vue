<template>
  <aside class="sidebar">
    <div class="brand d-flex align-items-center gap-2 mb-4">
      <img src="/mana ministries.png" alt="Mana Ministries Logo" style="width: 32px; height: 32px; object-fit: contain; background: white; padding: 2px; border-radius: 6px;" />
      <h2 class="mb-0 fs-4 fw-bold">Kongamano</h2>
    </div>
    <nav class="nav-links">
      <NuxtLink to="/">Dashboard</NuxtLink>
      <NuxtLink to="/events">Events</NuxtLink>
      <NuxtLink to="/registrations">Registrations</NuxtLink>
      <NuxtLink to="/payments">Payments</NuxtLink>
      <NuxtLink to="/agents">Agents</NuxtLink>
      <NuxtLink to="/users">Users</NuxtLink>
      <NuxtLink to="/setup">Setup</NuxtLink>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 240px;
  background-color: var(--color-dark);
  color: var(--color-bg-light);
  min-height: 100vh;
  padding: 1.5rem 1rem;
}
.brand h2 {
  color: var(--color-accent-gold);
  margin-bottom: 2rem;
  font-size: 1.5rem;
}
.nav-links {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.nav-links a {
  color: var(--color-bg-light);
  text-decoration: none;
  padding: 0.6rem 1rem;
  border-radius: var(--radius-md);
  transition: background 0.2s ease;
}
.nav-links a:hover,
.nav-links a.router-link-active {
  background-color: var(--color-primary);
}
</style>
