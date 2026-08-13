import { defineStore } from 'pinia';
import type { User } from '~/types/auth';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = useCookie<string | null>('token', { default: () => null, maxAge: 60 * 60 * 24 * 7 });
  // Persists the user's role_id across page reloads so the middleware
  // can gate access synchronously without making an API call.
  const roleId = useCookie<number | null>('role_id', { default: () => null, maxAge: 60 * 60 * 24 * 7 });

  const isAuthenticated = computed(() => !!token.value);
  // Checks the cookie first (survives page reloads without API calls),
  // falls back to the in-memory user object.
  const isAdmin = computed(() => (roleId.value ?? user.value?.role_id) === 1);

  function setUser(userData: User | null) {
    user.value = userData;
    // Mirror role_id into the cookie so middleware can read it synchronously
    roleId.value = userData?.role_id ?? null;
  }

  function setToken(tokenValue: string | null) {
    token.value = tokenValue;
  }

  async function fetchCurrentUser() {
    if (!token.value) return;
    try {
      const res = await $fetch<any>('/api/auth/me', {
        headers: { Authorization: `Bearer ${token.value}` },
      });
      if (res?.data?.user) {
        user.value = res.data.user;
        // Keep role_id cookie in sync after a user fetch
        roleId.value = res.data.user.role_id ?? null;
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
    }
  }

  function logout() {
    token.value = null;
    roleId.value = null;
    user.value = null;
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
