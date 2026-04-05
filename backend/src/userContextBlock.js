/**
 * Single user-context block appended to every Gemini system instruction.
 * Uses session username + profile (demographics, ratings, optional notes).
 * Reminder: user-supplied text is not verified medical data.
 */

import { formatSymptomTagLine } from "./symptomTagLabels.js";

/** @param {unknown} v @param {number} max */
function trimStr(v, max) {
  if (v == null) return "";
  if (typeof v !== "string") return "";
  return v.trim().slice(0, max);
}

/**
 * @param {{ username?: string | null, profile?: object | null } | null | undefined} ctx
 * @returns {string} Non-empty block with header, or empty string if nothing to say.
 */
export function buildUserContextBlock(ctx) {
  if (!ctx || typeof ctx !== "object") return "";

  const profile = ctx.profile && typeof ctx.profile === "object" ? ctx.profile : null;
  const displayName = trimStr(profile?.displayName, 80);
  const username = trimStr(ctx.username, 80);
  const preferred = displayName || username;

  const lines = [];

  if (preferred) {
    lines.push(`Preferred name / how to address the user: ${preferred}.`);
  }

  const age =
    profile?.age != null && Number.isFinite(profile.age)
      ? Math.max(0, Math.min(130, Math.round(profile.age)))
      : null;
  const bmi =
    profile?.bmi != null && Number.isFinite(profile.bmi) ? profile.bmi : null;
  const h = profile?.heightCm;
  const w = profile?.weightKg;
  const metrics = [];
  if (age != null) metrics.push(`age ${age}`);
  if (bmi != null) metrics.push(`BMI about ${bmi}`);
  if (h != null && Number.isFinite(h)) metrics.push(`height ${Math.round(h)} cm`);
  if (w != null && Number.isFinite(w)) metrics.push(`weight ${w} kg`);
  if (metrics.length) {
    lines.push(`Demographics / body metrics (user-entered): ${metrics.join("; ")}.`);
  }

  const ratings = [];
  const r = (k, label) => {
    const v = profile?.[k];
    if (typeof v === "number" && v >= 1 && v <= 5) ratings.push(`${label} ${v}/5`);
  };
  r("sleepRating", "sleep focus");
  r("cognitiveRating", "cognitive/focus");
  r("digestiveRating", "digestive");
  r("musculoskeletalRating", "musculoskeletal");
  r("immuneRating", "immune/stress");
  if (ratings.length) {
    lines.push(`Subhealth focus ratings (1–5, user-entered): ${ratings.join("; ")}.`);
  }

  const symLine = formatSymptomTagLine(profile?.symptomTagIds);
  if (symLine) {
    lines.push(`Optional early-signal tags the user selected (not a diagnosis): ${symLine}.`);
  }

  const healthFocus = trimStr(profile?.healthFocus, 500);
  if (healthFocus) {
    lines.push(`Wellness goals (user-stated): ${healthFocus}`);
  }

  const conditionsSummary = trimStr(profile?.conditionsSummary, 500);
  if (conditionsSummary) {
    lines.push(`Conditions / concerns in the user's words (not verified): ${conditionsSummary}`);
  }

  const visitLabSummary = trimStr(profile?.visitLabSummary, 1200);
  if (visitLabSummary) {
    lines.push(
      `Recent visits / labs / checkups — short summary in the user's words only (not verified): ${visitLabSummary}`,
    );
  }

  if (profile?.completedOnboarding) {
    lines.push(
      "The user completed the onboarding / health snapshot flow; use context above to personalize tone and priorities without inventing facts.",
    );
  }

  if (lines.length === 0) return "";

  return [
    "User context (for personalization — user-supplied; not a clinical record; do not diagnose or prescribe):",
    ...lines.map((x) => `- ${x}`),
    "Stay within navigation and general education; emergencies first; never fabricate medical details.",
  ].join("\n");
}
