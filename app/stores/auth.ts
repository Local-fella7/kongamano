import { defineStore } from 'pinia';
import type { User } from '~/types/auth';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = useCookie<string | null>('token', { default: () => null, maxAge: 60 * 60 * 24 * 7 });
  // Persists the user's role_id across page reloads so the middleware
  // can gate access synchronously without making an API call.
  const roleId = useCookie<number | null>('role_id', { default: () => null, maxAge: 60 * 60 * 24 * 7 });

  // Client-side initialization: Hydrate from localStorage if cookie/in-memory state was lost
  if (import.meta.client) {
    try {
      if (!token.value) {
        const storedToken = localStorage.getItem('token') || localStorage.getItem('kongamano_token');
        if (storedToken && storedToken !== 'null' && storedToken !== 'undefined') {
          token.value = storedToken.trim();
        }
      }
      if (roleId.value === null || roleId.value === undefined) {
        const storedRole = localStorage.getItem('role_id') || localStorage.getItem('kongamano_role_id');
        if (storedRole && storedRole !== 'null' && storedRole !== 'undefined') {
          roleId.value = parseInt(storedRole, 10);
        }
      }
      const storedUser = localStorage.getItem('kongamano_user');
      if (storedUser && !user.value) {
        try {
          user.value = JSON.parse(storedUser);
        } catch {}
      }
    } catch {}
  }

  const isAuthenticated = computed(() => !!token.value);
  // Checks the cookie first (survives page reloads without API calls),
  // falls back to the in-memory user object or localStorage.
  const isAdmin = computed(() => (roleId.value ?? user.value?.role_id) === 1);

  function setUser(userData: User | null) {
    user.value = userData;
    // Mirror role_id into the cookie so middleware can read it synchronously
    roleId.value = userData?.role_id ?? null;
    if (import.meta.client) {
      try {
        if (userData) {
          localStorage.setItem('kongamano_user', JSON.stringify(userData));
          if (userData.role_id !== undefined && userData.role_id !== null) {
            localStorage.setItem('role_id', String(userData.role_id));
            localStorage.setItem('kongamano_role_id', String(userData.role_id));
          }
        } else {
          localStorage.removeItem('kongamano_user');
          localStorage.removeItem('role_id');
          localStorage.removeItem('kongamano_role_id');
        }
      } catch {}
    }
  }

  function setToken(tokenValue: string | null) {
    token.value = tokenValue;
    if (import.meta.client) {
      if (tokenValue) {
        try {
          localStorage.setItem('token', tokenValue);
          localStorage.setItem('kongamano_token', tokenValue);
        } catch {}
      } else {
        try {
          localStorage.removeItem('token');
          localStorage.removeItem('kongamano_token');
        } catch {}
      }
    }
  }

  async function fetchCurrentUser() {
    if (!token.value) return;
    try {
      const res = await $fetch<any>(apiPath('/api/auth/me'), {
        headers: { Authorization: `Bearer ${token.value}` },
      });
      if (res?.data?.user) {
        setUser(res.data.user);
      }
    } catch (err) {
      // In offline mode, do not clear user; retain existing cached profile
      console.warn('Network request failed for user profile (offline mode fallback):', err);
    }
  }

  function logout() {
    token.value = null;
    roleId.value = null;
    user.value = null;
    if (import.meta.client) {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('kongamano_token');
        localStorage.removeItem('role_id');
        localStorage.removeItem('kongamano_role_id');
        localStorage.removeItem('kongamano_user');
      } catch {}
    }
    navigateTo('/login');
  }

  return {
    user,
    token,
    roleId,
    isAuthenticated,
    isAdmin,
    setUser,
    setToken,
    fetchCurrentUser,
    logout,
  };
});
