import { defineStore } from 'pinia';
import type { User } from '~/types/auth';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = useCookie<string | null>('token', { default: () => null });

  const isAuthenticated = computed(() => !!token.value);

  function setUser(userData: User | null) {
    user.value = userData;
  }

  function setToken(tokenValue: string | null) {
    token.value = tokenValue;
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
    logout,
  };
});
