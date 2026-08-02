import { defineStore } from 'pinia';
import type { User } from '~/types/auth';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = useCookie<string | null>('token', { default: () => null, maxAge: 60 * 60 * 24 * 7 });

  const isAuthenticated = computed(() => !!token.value);

  function setUser(userData: User | null) {
    user.value = userData;
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
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
    }
  }

  function logout() {
    token.value = null;
    user.value = null;
    navigateTo('/login');
  }

  return {
    user,
    token,
    isAuthenticated,
    setUser,
    setToken,
    fetchCurrentUser,
    logout,
  };
});
