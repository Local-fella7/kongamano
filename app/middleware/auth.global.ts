export default defineNuxtRouteMiddleware((to) => {
  const token = useCookie('token');
  const roleId = useCookie<number | null>('role_id');
  const isAdmin = roleId.value === 1;

  // 1. Not authenticated → send to login
  if (!token.value && to.path !== '/login' && to.path !== '/forgot-password') {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } });
  }

  // 2. Authenticated + trying to visit login/forgot-password → redirect away
  //    Non-admins always go to /scannings; admins go to their intended target or /
  if (token.value && (to.path === '/login' || to.path === '/forgot-password')) {
    return navigateTo(isAdmin ? ((to.query.redirect as string) || '/') : '/scannings');
  }

  // 3. Authenticated + non-admin trying to visit any page except /scannings → block instantly
  //    No API call needed — role_id cookie is read synchronously
  if (token.value && !isAdmin && to.path !== '/scannings') {
    return navigateTo('/scannings');
  }
});
