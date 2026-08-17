export default defineNuxtRouteMiddleware((to) => {
  const token = useCookie('token');
  const roleId = useCookie<number | null>('role_id');

  let activeToken = token.value;
  let activeRoleId = roleId.value;

  // Fallback to localStorage if client-side and cookie is empty
  if (import.meta.client) {
    try {
      if (!activeToken) {
        const storedToken = localStorage.getItem('token') || localStorage.getItem('kongamano_token');
        if (storedToken && storedToken !== 'null' && storedToken !== 'undefined') {
          activeToken = storedToken.trim();
          token.value = activeToken; // Re-sync into cookie
        }
      }
      if (activeRoleId === null || activeRoleId === undefined) {
        const storedRole = localStorage.getItem('role_id') || localStorage.getItem('kongamano_role_id');
        if (storedRole && storedRole !== 'null' && storedRole !== 'undefined') {
          activeRoleId = parseInt(storedRole, 10);
          roleId.value = activeRoleId; // Re-sync into cookie
        }
      }
    } catch {}
  }

  const isAdmin = activeRoleId === 1;

  // 1. Not authenticated → send to login (unless offline on scanner page)
  if (!activeToken && to.path !== '/login' && to.path !== '/forgot-password') {
    // If the device is offline and on the scan station, do not block or redirect to login
    if (import.meta.client && !navigator.onLine && (to.path === '/scan' || to.path === '/scannings')) {
      return;
    }

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
  if (activeToken && (to.path === '/login' || to.path === '/forgot-password')) {
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
  if (activeToken && !isAdmin && to.path !== '/scannings' && to.path !== '/scan') {
    return navigateTo('/scan');
  }
});
