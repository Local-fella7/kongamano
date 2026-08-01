import type { UseFetchOptions } from 'nuxt/app';

export const useApi = <T = any>(url: string, opts: UseFetchOptions<T> = {}) => {
  const token = useCookie('token');

  return useFetch(url, {
    ...opts,
    headers: {
      ...opts.headers,
      ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
      Accept: 'application/json',
    },
  });
};
