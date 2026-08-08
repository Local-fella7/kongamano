export default defineNuxtRouteMiddleware((to) => {
  const token = useCookie('token');

  // If user is not authenticated and trying to access a protected page, redirect to /login with redirect query param
  if (!token.value && to.path !== '/login' && to.path !== '/forgot-password') {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath },
    });
  }

  // If user is authenticated and navigating to /login, redirect to target page or dashboard /
  if (token.value && (to.path === '/login' || to.path === '/forgot-password')) {
    const target = (to.query.redirect as string) || '/';
    return navigateTo(target);
  }
});
