const STORAGE_KEY = "carepilot.nearbyGroceryHints";

/** Names from the last successful grocery search on Find nearby — read when building Browser Use grocery tasks on Chat. */
export function persistNearbyGroceryStoreNames(names: string[]): void {
  try {
    const cleaned = names.map((n) => n.trim()).filter(Boolean).slice(0, 3);
    if (cleaned.length === 0) sessionStorage.removeItem(STORAGE_KEY);
    else sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
  } catch {
    /* quota or private mode */
  }
}

export function readNearbyGroceryStoreNames(): string[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr.map((x) => String(x).trim()).filter(Boolean).slice(0, 3);
  } catch {
    return [];
  }
}
