const SESSION_KEY = "carepilot_session_id";

export function getStoredSessionId(): string | null {
  try {
    const v = localStorage.getItem(SESSION_KEY);
    return v && v.trim() ? v.trim() : null;
  } catch {
    return null;
  }
}

export function setStoredSessionId(id: string) {
  localStorage.setItem(SESSION_KEY, id);
}

export function clearStoredSessionId() {
  localStorage.removeItem(SESSION_KEY);
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const sessionId = getStoredSessionId();
  const headers = new Headers(init.headers);
  if (sessionId) headers.set("X-Session-Id", sessionId);
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(path, { ...init, headers });
}
