export const BODY_UNITS_STORAGE_KEY_V2 = "carepilot-body-units-v2";

/** Legacy: one switch for both dimensions */
const LEGACY_BODY_UNITS_KEY = "carepilot-body-units";

export type HeightDisplayUnit = "cm" | "ft_in";

export type WeightDisplayUnit = "kg" | "lb";

export type BodyUnitPreferences = {
  height: HeightDisplayUnit;
  weight: WeightDisplayUnit;
};

const KG_PER_LB = 0.45359237;

const DEFAULT_PREFS: BodyUnitPreferences = {
  height: "cm",
  weight: "kg",
};

export function loadBodyUnitPreferences(): BodyUnitPreferences {
  try {
    const raw = localStorage.getItem(BODY_UNITS_STORAGE_KEY_V2);
    if (raw) {
      const o = JSON.parse(raw) as unknown;
      if (o && typeof o === "object") {
        const rec = o as Record<string, unknown>;
        const h = rec.height;
        const w = rec.weight;
        return {
          height: h === "ft_in" ? "ft_in" : "cm",
          weight: w === "lb" ? "lb" : "kg",
        };
      }
    }
  } catch {
    /* ignore */
  }
  try {
    const v = localStorage.getItem(LEGACY_BODY_UNITS_KEY);
    if (v === "imperial") return { height: "ft_in", weight: "lb" };
    if (v === "metric") return { height: "cm", weight: "kg" };
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_PREFS };
}

export function saveBodyUnitPreferences(prefs: BodyUnitPreferences) {
  try {
    localStorage.setItem(BODY_UNITS_STORAGE_KEY_V2, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

/** @deprecated use loadBodyUnitPreferences */
export type BodyUnitMode = "metric" | "imperial";

/** @deprecated use loadBodyUnitPreferences */
export function loadBodyUnitMode(): BodyUnitMode {
  const p = loadBodyUnitPreferences();
  return p.height === "cm" && p.weight === "kg" ? "metric" : "imperial";
}

/** @deprecated use saveBodyUnitPreferences */
export function saveBodyUnitMode(mode: BodyUnitMode) {
  saveBodyUnitPreferences(
    mode === "metric"
      ? { height: "cm", weight: "kg" }
      : { height: "ft_in", weight: "lb" },
  );
}

/** Pounds → kilograms (full precision for BMI / API). */
export function kgFromLb(lb: number) {
  return lb * KG_PER_LB;
}

/** Kilograms → pounds for display. */
export function lbFromKg(kg: number) {
  return Math.round((kg / KG_PER_LB) * 10) / 10;
}

export function cmFromFtIn(ft: number, inch: number) {
  const totalIn = ft * 12 + inch;
  if (!Number.isFinite(totalIn) || totalIn <= 0) return NaN;
  return Math.round(totalIn * 2.54 * 10) / 10;
}

export function ftInFromCm(cm: number): { ft: number; inch: number } {
  if (!Number.isFinite(cm) || cm <= 0) return { ft: 0, inch: 0 };
  const totalIn = cm / 2.54;
  const ft = Math.floor(totalIn / 12);
  let inch = totalIn - ft * 12;
  inch = Math.round(inch * 10) / 10;
  if (inch >= 12) {
    return { ft: ft + 1, inch: 0 };
  }
  return { ft, inch };
}

export function formatHeightDisplay(cm: number | null, height: HeightDisplayUnit): string {
  if (cm == null) return "—";
  if (height === "cm") return `${cm} cm`;
  const { ft, inch } = ftInFromCm(cm);
  return `${ft} ft ${inch} in`;
}

export function formatWeightDisplay(kg: number | null, weight: WeightDisplayUnit): string {
  if (kg == null) return "—";
  if (weight === "kg") return `${kg} kg`;
  return `${lbFromKg(kg)} lb`;
}
