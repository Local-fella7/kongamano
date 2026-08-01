export default defineNuxtRouteMiddleware((to) => {
  const token = useCookie('token');

  // If user is not authenticated and trying to access a protected page, redirect to /login
  if (!token.value && to.path !== '/login' && to.path !== '/forgot-password') {
    return navigateTo('/login');
  }

  // If user is authenticated and navigating to /login, redirect to dashboard /
  if (token.value && (to.path === '/login' || to.path === '/forgot-password')) {
    return navigateTo('/');
  }
});
