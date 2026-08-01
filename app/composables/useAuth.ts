import type { User } from '~/types/auth';

export const useAuth = () => {
  const user = useState<User | null>('auth_user', () => null);
  const token = useCookie<string | null>('token', { default: () => null });

  const isLoggedIn = computed(() => !!token.value);

  const logout = () => {
    token.value = null;
    user.value = null;
    navigateTo('/login');
  };

  return {
    user,
    token,
    isLoggedIn,
    logout,
  };
};
