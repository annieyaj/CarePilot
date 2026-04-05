import type { HealthProfile, Me } from "../context/sessionContextBase";

const SESSION_KEY = "carepilot_session_id";
const FAKE_ME_KEY = "carepilot_fake_me_v1";
export const FAKE_SESSION_PREFIX = "fake_";

function emptyHealthProfile(): HealthProfile {
  return {
    displayName: null,
    age: null,
    heightCm: null,
    weightKg: null,
    bmi: null,
    sleepRating: null,
    cognitiveRating: null,
    digestiveRating: null,
    musculoskeletalRating: null,
    immuneRating: null,
    completedOnboarding: false,
    symptomTagIds: [],
    healthFocus: null,
    conditionsSummary: null,
    visitLabSummary: null,
    chatMealPlanContext: null,
  };
}

/** Coerce login fields: at least one of username or email (any string). */
export function normalizeCredentials(username: string, email: string): {
  username: string;
  email: string;
} {
  const u = username.trim();
  const e = email.trim();
  if (!u && !e) {
    throw new Error("Enter a username or email.");
  }
  if (u && e) return { username: u, email: e };
  if (u) {
    return { username: u, email: `${u.replace(/\s+/g, "_")}@local.demo` };
  }
  const emailOnly = e;
  const namePart = emailOnly.includes("@")
    ? emailOnly.split("@")[0] ?? emailOnly
    : emailOnly;
  const addr = emailOnly.includes("@")
    ? emailOnly
    : `${emailOnly.replace(/\s+/g, "_")}@local.demo`;
  return { username: namePart || "user", email: addr };
}

export type FakeLoginMode = "off" | "force" | "auto";

export function fakeLoginMode(): FakeLoginMode {
  const v = import.meta.env.VITE_FAKE_LOGIN;
  if (v === "true" || v === "1") return "force";
  if (v === "auto") return "auto";
  return "off";
}

export function isFakeSessionId(id: string | null): boolean {
  return Boolean(id?.startsWith(FAKE_SESSION_PREFIX));
}

export function readStoredFakeMe(): Me | null {
  try {
    const t = localStorage.getItem(FAKE_ME_KEY);
    if (!t?.trim()) return null;
    return JSON.parse(t) as Me;
  } catch {
    return null;
  }
}

export function writeStoredFakeMe(me: Me) {
  localStorage.setItem(FAKE_ME_KEY, JSON.stringify(me));
}

export function clearStoredFakeMe() {
  localStorage.removeItem(FAKE_ME_KEY);
}

export function createFakeSession(username: string, email: string): {
  sessionId: string;
  me: Me;
} {
  const sessionId = `${FAKE_SESSION_PREFIX}${crypto.randomUUID()}`;
  const me: Me = {
    username,
    email,
    profile: emptyHealthProfile(),
  };
  return { sessionId, me };
}

function isUnreachableApiStatus(status: number): boolean {
  return status === 502 || status === 503 || status === 504;
}

function isNetworkishError(err: unknown): boolean {
  if (err instanceof TypeError) return true;
  if (err instanceof Error) {
    return /failed to fetch|networkerror|load failed|network request failed/i.test(
      err.message,
    );
  }
  return false;
}

export function shouldUseFakeLoginFallback(
  err: unknown,
  response: Response | null,
): boolean {
  if (fakeLoginMode() !== "auto") return false;
  if (err != null && isNetworkishError(err)) return true;
  if (response && !response.ok && isUnreachableApiStatus(response.status)) {
    return true;
  }
  return false;
}

/**
 * API origin for production when the UI and backend are on different hosts (e.g. two Railway services).
 * Set at build time: VITE_API_BASE_URL=https://carepilot-backend.up.railway.app (no trailing slash).
 * Omit for same-origin: dev Vite proxy or single server serving SPA + /api.
 */
export function apiUrl(path: string): string {
  const raw = import.meta.env.VITE_API_BASE_URL;
  const base = typeof raw === "string" ? raw.trim().replace(/\/$/, "") : "";
  if (!path) return base || "/";
  if (/^https?:\/\//i.test(path)) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}

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
  return fetch(apiUrl(path), { ...init, headers });
}
