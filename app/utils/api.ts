/**
 * Browser-side API URL resolution.
 *
 * The app calls API endpoints with a canonical path like `/api/auth/login`.
 * That path is resolved against `runtimeConfig.public.apiBase`:
 *
 * - Dev / preview: base is `/api` → requests go through the Nitro proxy in
 *   `server/api/[...].ts`, which forwards to `runtimeConfig.apiBase`.
 * - Static cPanel build: base is `/backend/api` → requests hit the CodeIgniter
 *   backend directly on the same origin (no Node server exists in production).
 */
export function useApiBase(): string {
  try {
    const config = useRuntimeConfig();
    return String(config.public.apiBase || '/api').replace(/\/+$/, '');
  } catch {
    return '/api';
  }
}

/**
 * Rewrites `/api/...` to `${public.apiBase}/...`.
 * Leaves absolute URLs and non-API paths untouched.
 */
export function apiPath(path: string): string {
  if (!path || /^https?:\/\//i.test(path)) {
    return path;
  }
  if (path === '/api' || path.startsWith('/api/')) {
    const base = useApiBase();
    return `${base}${path.slice('/api'.length)}`;
  }
  return path;
}
