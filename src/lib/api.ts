const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const path = typeof input === 'string' ? input : input.toString();

  return fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
  });
}
