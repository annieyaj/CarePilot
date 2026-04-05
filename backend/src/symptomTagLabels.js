/**
 * Labels for quick-check symptom chip ids (mirrors frontend/src/lib/symptomTags.ts).
 * Used only for human-readable context in prompts.
 */
export const SYMPTOM_TAG_LABELS = {
  "brain-fog-most-days": "Brain fog most days",
  "wake-unrefreshed": "Wake unrefreshed often",
  "morning-headaches-new": "New morning headaches",
  "fatigue-worse-weeks": "Fatigue clearly worse for weeks",
  "palpitations-at-rest": "Palpitations at rest",
  "chest-tightness-exertion": "Chest tightness with light effort",
  "breathless-one-flight": "Winded climbing one flight (new)",
  "ankles-puffy-evening": "Ankles puffy by evening",
  "stool-blood-or-tarry": "Blood or black/tarry stools",
  "heartburn-weeks": "Heartburn most days for weeks",
  "appetite-major-shift": "Major appetite change",
  "thirst-urination-up": "Much thirstier / peeing more",
  "numbness-tingling-persistent": "Numbness or tingling that lingers",
  "one-sided-weakness": "Weakness on one side",
  "vision-changes-new": "New blur, flashes, or blind spots",
  "joint-stiffness-mornings": "Joint stiffness most mornings",
  "weight-change-unexplained": "Weight change without trying",
  "new-lump-growing": "A new lump that grows",
  "fevers-unexplained": "Fevers without a clear cold",
  "cuts-heal-slowly": "Cuts heal slower than usual",
};

/** @param {string} id */
export function symptomLabelForId(id) {
  if (typeof id !== "string" || !id.trim()) return "";
  return SYMPTOM_TAG_LABELS[id] ?? id;
}

/** @param {string[] | undefined} ids */
export function formatSymptomTagLine(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return "";
  const labels = ids
    .slice(0, 24)
    .map((x) => symptomLabelForId(String(x)))
    .filter(Boolean);
  if (!labels.length) return "";
  return labels.join("; ");
}
