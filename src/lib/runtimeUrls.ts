function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

function normalizePath(path: string) {
  return path.startsWith('/') ? path : `/${path}`;
}

export function getServerBaseUrl() {
  const configured = (import.meta.env.VITE_SERVER_BASE_URL || '').trim();
  if (configured) return trimTrailingSlash(configured);

  if (typeof window === 'undefined') return 'http://127.0.0.1:3001';

  return trimTrailingSlash(window.location.origin);
}

export function getSocketServerUrl() {
  const configured = (import.meta.env.VITE_WS_URL || import.meta.env.VITE_SERVER_BASE_URL || '').trim();
  if (configured) return trimTrailingSlash(configured);

  if (typeof window === 'undefined') return 'http://127.0.0.1:3001';

  return trimTrailingSlash(window.location.origin);
}

export function getApiUrl(path: string) {
  return `${getServerBaseUrl()}${normalizePath(path)}`;
}

export function getWebSocketUrl(path: string) {
  let base = (import.meta.env.VITE_RAW_WS_BASE_URL || '').trim() || getSocketServerUrl();
  if (base.startsWith('http://')) {
    base = `ws://${base.slice('http://'.length)}`;
  } else if (base.startsWith('https://')) {
    base = `wss://${base.slice('https://'.length)}`;
  }

  return `${trimTrailingSlash(base)}${normalizePath(path)}`;
}
