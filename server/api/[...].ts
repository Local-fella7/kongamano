import { defineEventHandler, proxyRequest } from 'h3';

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event);
  const apiBase = config.apiBase.replace(/\/+$/, '');
  const targetUrl = `${apiBase}${event.path}`;
  return proxyRequest(event, targetUrl);
});
