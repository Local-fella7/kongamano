export default defineNuxtRouteMiddleware((to) => {
  const token = useCookie('token');
  const roleId = useCookie<number | null>('role_id');
  const isAdmin = roleId.value === 1;

  // 1. Not authenticated → send to login
  if (!token.value && to.path !== '/login' && to.path !== '/forgot-password') {
    // If incoming is old badge /scannings?code=..., map redirect to /scan?code=...
    let targetPath = to.fullPath;
    if (to.path === '/scannings' && to.query.code) {
      targetPath = `/scan?code=${encodeURIComponent(String(to.query.code))}`;
    }
    return navigateTo({ path: '/login', query: { redirect: targetPath } });
  }

  // 2. Badge Scan Interceptor: Any scan hitting /scannings?code=... immediately fast-forwards to /scan?code=...
  if (to.path === '/scannings' && to.query.code) {
    return navigateTo({ path: '/scan', query: { code: String(to.query.code) } });
  }

  // 3. Authenticated + trying to visit login/forgot-password → redirect away
  //    Preserve redirect query if available, otherwise non-admins go to /scan and admins to /
  if (token.value && (to.path === '/login' || to.path === '/forgot-password')) {
    const redirectUrl = to.query.redirect as string;
    if (redirectUrl) {
      if (redirectUrl.startsWith('/scannings?code=')) {
        const code = redirectUrl.split('/scannings?code=')[1];
        return navigateTo(`/scan?code=${code}`);
      }
      if (isAdmin || redirectUrl.startsWith('/scan') || redirectUrl.startsWith('/scannings')) {
        return navigateTo(redirectUrl);
      }
    }
    return navigateTo(isAdmin ? '/' : '/scan');
  }

  // 4. Authenticated + non-admin trying to visit any page except /scan or /scannings → block instantly
  //    Default non-admins to /scan
  if (token.value && !isAdmin && to.path !== '/scannings' && to.path !== '/scan') {
    return navigateTo('/scan');
  }
});
