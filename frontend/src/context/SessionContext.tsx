import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  apiFetch,
  apiUrl,
  clearStoredFakeMe,
  clearStoredSessionId,
  createFakeSession,
  fakeLoginMode,
  getStoredSessionId,
  isFakeSessionId,
  readStoredFakeMe,
  setStoredSessionId,
  shouldUseFakeLoginFallback,
  writeStoredFakeMe,
} from "../api/session";
import { SessionContext, type Me } from "./sessionContextBase";

export type {
  ChatMealPlanContext,
  HealthProfile,
  Me,
  SessionContextValue,
} from "./sessionContextBase";

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(() => getStoredSessionId());
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    const sid = getStoredSessionId();
    setSessionId(sid);
    if (!sid) {
      setMe(null);
      setLoading(false);
      return;
    }
    if (isFakeSessionId(sid)) {
      const stored = readStoredFakeMe();
      if (!stored) {
        clearStoredSessionId();
        clearStoredFakeMe();
        setSessionId(null);
        setMe(null);
      } else {
        setMe(stored);
      }
      setLoading(false);
      return;
    }
    try {
      const r = await apiFetch("/api/me");
      if (!r.ok) {
        clearStoredSessionId();
        clearStoredFakeMe();
        setSessionId(null);
        setMe(null);
        setLoading(false);
        return;
      }
      const text = await r.text();
      if (!text?.trim()) {
        setMe(null);
        return;
      }
      const data = JSON.parse(text) as Me;
      setMe(data);
    } catch {
      setMe(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshMe();
  }, [refreshMe]);

  const login = useCallback(
    async (username: string, email: string) => {
      const applyFake = () => {
        clearStoredFakeMe();
        const { sessionId: fid, me } = createFakeSession(username, email);
        setStoredSessionId(fid);
        writeStoredFakeMe(me);
        setSessionId(fid);
        setMe(me);
      };

      if (fakeLoginMode() === "force") {
        applyFake();
        return;
      }

      let r: Response;
      try {
        r = await fetch(apiUrl("/api/auth/login"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email }),
        });
      } catch (err) {
        if (shouldUseFakeLoginFallback(err, null)) {
          applyFake();
          return;
        }
        throw err instanceof Error
          ? err
          : new Error("Cannot reach the API. Check VITE_API_BASE_URL or run the backend.");
      }

      const text = await r.text();
      let data: { sessionId?: string; error?: string } = {};
      if (text?.trim()) {
        try {
          data = JSON.parse(text) as { sessionId?: string; error?: string };
        } catch {
          if (shouldUseFakeLoginFallback(null, r)) {
            applyFake();
            return;
          }
          throw new Error(
            `Bad response from server (${r.status}). Start the backend so it listens on port 3001 (e.g. npm run dev from the repo root).`,
          );
        }
      }

      if (!r.ok) {
        if (shouldUseFakeLoginFallback(null, r)) {
          applyFake();
          return;
        }
        throw new Error(
          data.error ??
            (r.status === 502 || r.status === 504
              ? "Cannot reach the API. Run the backend on port 3001 (npm run dev)."
              : `Login failed (${r.status})`),
        );
      }
      if (!data.sessionId) {
        if (shouldUseFakeLoginFallback(null, r)) {
          applyFake();
          return;
        }
        throw new Error(
          "No session from server. Is the API running? Empty responses usually mean the backend is not up.",
        );
      }
      clearStoredFakeMe();
      setStoredSessionId(data.sessionId);
      setSessionId(data.sessionId);
      await refreshMe();
    },
    [refreshMe],
  );

  const logout = useCallback(() => {
    if (isFakeSessionId(getStoredSessionId())) clearStoredFakeMe();
    clearStoredSessionId();
    setSessionId(null);
    setMe(null);
  }, []);

  const value = useMemo(
    () => ({
      sessionId,
      me,
      loading,
      refreshMe,
      login,
      logout,
    }),
    [sessionId, me, loading, refreshMe, login, logout],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export { useSession } from "./useSession";
