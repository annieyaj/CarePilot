/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** When UI and API are on different origins, set to the public backend URL (no trailing slash). */
  readonly VITE_API_BASE_URL?: string;
  /**
   * `true` — sign in only in the browser (no `/api/auth/login`). Use when the API is not deployed.
   * `auto` — try the API first; if the request fails or returns 502/503/504, fall back to browser-only session.
   */
  readonly VITE_FAKE_LOGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
