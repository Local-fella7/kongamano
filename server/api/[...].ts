import { defineEventHandler, proxyRequest } from 'h3';

export default defineEventHandler((event) => {
  const targetUrl = `http://localhost/kongamano${event.path}`;
  return proxyRequest(event, targetUrl);
});
