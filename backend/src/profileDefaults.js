/**
 * @typedef {Object} HealthProfile
 * @property {number | null} age
 * @property {number | null} heightCm
 * @property {number | null} weightKg
 * @property {number | null} bmi
 * @property {number | null} sleepRating — 1–5 focus / concern
 * @property {number | null} cognitiveRating
 * @property {number | null} digestiveRating
 * @property {number | null} musculoskeletalRating
 * @property {number | null} immuneRating
 * @property {boolean} completedOnboarding
 */

/** @param {number | null} heightCm @param {number | null} weightKg */
export function computeBmi(heightCm, weightKg) {
  if (heightCm == null || weightKg == null || heightCm <= 0 || weightKg <= 0) return null;
  const m = heightCm / 100;
  const v = weightKg / (m * m);
  return Math.round(v * 10) / 10;
}
