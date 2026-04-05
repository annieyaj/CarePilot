/**
 * Retry wrapper for transient Gemini / network failures (429, 503, timeouts, connection drops).
 */

/**
 * @param {unknown} err
 * @returns {boolean}
 */
export function isRetryableGeminiError(err) {
  if (err == null) return false;
  const name = typeof err === "object" && err && "name" in err ? String(err.name) : "";
  if (name === "AbortError") return false;

  const msg = String(
    typeof err === "object" && err && "message" in err ? err.message : err,
  ).toLowerCase();
  const code =
    typeof err === "object" && err && "code" in err ? String(err.code) : "";

  if (
    msg.includes("429") ||
    msg.includes("503") ||
    msg.includes("504") ||
    msg.includes("resource_exhausted") ||
    msg.includes("unavailable") ||
    msg.includes("econnreset") ||
    msg.includes("etimedout") ||
    msg.includes("socket") ||
    msg.includes("fetch failed") ||
    msg.includes("network") ||
    msg.includes("overloaded") ||
    code === "429" ||
    code === "503" ||
    code === "UNAVAILABLE"
  ) {
    return true;
  }
  return false;
}

/**
 * @template T
 * @param {() => Promise<T>} fn
 * @param {{ maxAttempts?: number, baseDelayMs?: number, maxDelayMs?: number, isRetryable?: (e: unknown) => boolean }} [opts]
 * @returns {Promise<T>}
 */
export async function retryAsync(fn, opts = {}) {
  const maxAttempts = Math.max(1, opts.maxAttempts ?? 3);
  const baseDelayMs = opts.baseDelayMs ?? 400;
  const maxDelayMs = opts.maxDelayMs ?? 8000;
  const isRetryable = opts.isRetryable ?? isRetryableGeminiError;

  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (attempt >= maxAttempts || !isRetryable(e)) throw e;
      const delay = Math.min(
        maxDelayMs,
        baseDelayMs * 2 ** (attempt - 1) + Math.floor(Math.random() * 120),
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}
