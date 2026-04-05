/**
 * Quick Check — 5 tap-only questions, PROMIS-aligned domains.
 * Risk scores 1–5: higher = more concern (worse).
 */

export type QuickDomain = "sleep" | "energy" | "stress" | "focus" | "pain";

/** Shared 5-point Likert (16Personalities-style): left = agree with positive statement, right = disagree. Risk 1 = best health, 5 = worst. */
export type LikertOption = {
  risk: 1 | 2 | 3 | 4 | 5;
  label: string;
};

export const LIKERT_OPTIONS: LikertOption[] = [
  { risk: 1, label: "Strongly agree" },
  { risk: 2, label: "Agree" },
  { risk: 3, label: "Neutral" },
  { risk: 4, label: "Disagree" },
  { risk: 5, label: "Strongly disagree" },
];

export type QuickQuestion = {
  id: QuickDomain;
  variable: string;
  /** First-person statement — user taps Agree → Disagree like MBTI / 16Personalities */
  prompt: string;
  /** Short line naming the factor / domain this item measures (shown above the prompt). */
  factorLabel: string;
};

export const QUICK_QUESTIONS: QuickQuestion[] = [
  {
    id: "sleep",
    variable: "sleep_score",
    factorLabel: "Sleep quality",
    prompt: "I have been sleeping well recently.",
  },
  {
    id: "energy",
    variable: "energy_score",
    factorLabel: "Energy & fatigue",
    prompt: "I have good energy during the day.",
  },
  {
    id: "stress",
    variable: "stress_score",
    factorLabel: "Stress & calm",
    prompt: "I feel calm and not overwhelmed.",
  },
  {
    id: "focus",
    variable: "focus_score",
    factorLabel: "Focus & attention",
    prompt: "I find it easy to focus on what I need to do.",
  },
  {
    id: "pain",
    variable: "pain_score",
    factorLabel: "Physical comfort",
    prompt: "I have little or no physical discomfort.",
  },
];

export type RiskRow = {
  sleep: number;
  energy: number;
  stress: number;
  focus: number;
  pain: number;
};

/** Map selected option risk values (already 1–5, higher = worse) */
export function risksFromAnswers(selectedRisks: number[]): RiskRow {
  const [sleep = 3, energy = 3, stress = 3, focus = 3, pain = 3] = selectedRisks;
  return {
    sleep,
    energy,
    stress,
    focus,
    pain,
  };
}

/**
 * Spec: sleep = 6 - sleep_score with sleep_score as "positive" coding — equivalent to using risk directly when options are ordered worst←best as risk 5←1.
 * overall_risk weighted average on same 1–5 risk scale.
 */
export function overallRisk(r: RiskRow): number {
  const { sleep, energy, stress, focus, pain } = r;
  return (
    0.25 * sleep + 0.2 * energy + 0.2 * stress + 0.15 * focus + 0.2 * pain
  );
}

export type PatternId =
  | "stress-sleep"
  | "sleep-energy"
  | "cognitive-overload"
  | "physical-strain"
  | "balanced";

export function detectPattern(r: RiskRow): PatternId {
  const { sleep, energy, stress, focus, pain } = r;
  if (stress >= 4 && sleep >= 4) return "stress-sleep";
  if (sleep >= 4 && energy >= 4) return "sleep-energy";
  if (focus >= 4 && stress >= 4) return "cognitive-overload";
  if (pain >= 4) return "physical-strain";
  return "balanced";
}

export type PatternResult = {
  id: PatternId;
  title: string;
  /** One line — “why” */
  why: string;
  /** Single action */
  action: string;
  summary: string;
  whatThisMeans: string[];
  suggestions: string[];
};

const PATTERNS: Record<PatternId, Omit<PatternResult, "id">> = {
  "stress-sleep": {
    title: "Stress-Driven Fatigue",
    why: "Low sleep + high stress",
    action: "Sleep before midnight tonight",
    summary:
      "Your responses suggest that stress and sleep may be affecting your energy and focus. This is a common early pattern of burnout.",
    whatThisMeans: [
      "Your body and mind may not be recovering well.",
      "Stress is likely impacting multiple areas.",
    ],
    suggestions: [
      "Prioritize sleep recovery",
      "Reduce high-stimulation tasks before bed",
      "Take short mental breaks during the day",
    ],
  },
  "sleep-energy": {
    title: "Sleep Deprivation",
    why: "Poor sleep is dragging your energy down",
    action: "Keep a fixed wake time for 3 days",
    summary:
      "Sleep quality and daytime energy are both strained — rest is probably the lever that helps everything else.",
    whatThisMeans: [
      "You may be in a cycle of tired days and restless nights.",
      "Small sleep habits often beat big interventions.",
    ],
    suggestions: [
      "Dim screens 1 hour before bed",
      "Avoid late caffeine",
      "Get morning light soon after waking",
    ],
  },
  "cognitive-overload": {
    title: "Cognitive Overload",
    why: "Stress and focus are competing for bandwidth",
    action: "One focused block: 25 minutes, no tabs",
    summary:
      "High stress plus difficulty focusing often means your attention system is overloaded — not that you aren’t trying.",
    whatThisMeans: [
      "Multitasking and worry can feel the same in the brain.",
      "Recovery breaks are part of performance, not a reward.",
    ],
    suggestions: [
      "Name your top task before you start",
      "Turn off non-essential notifications for short windows",
      "Step outside for two minutes between meetings",
    ],
  },
  "physical-strain": {
    title: "Physical Strain",
    why: "Your body is asking for attention",
    action: "Gentle movement + hydration today",
    summary:
      "Discomfort is showing up strongly — listening early can prevent bigger setbacks.",
    whatThisMeans: [
      "Pain and tension often show up before other signals get loud.",
      "Movement and rest both matter; extremes rarely help.",
    ],
    suggestions: [
      "Short walks or light stretching",
      "Change posture every 45 minutes",
      "If pain is severe or new, consider checking in with a clinician",
    ],
  },
  balanced: {
    title: "Balanced / Mild",
    why: "Signals are mostly in a manageable range",
    action: "Keep one small habit visible this week",
    summary:
      "Nothing is flashing red right now — a good moment to reinforce basics before small issues stack up.",
    whatThisMeans: [
      "Patterns can shift quickly when life gets busy.",
      "Consistency beats intensity for maintenance.",
    ],
    suggestions: [
      "Regular sleep and meal times",
      "Brief daily check-in with how you feel",
      "Light movement most days",
    ],
  },
};

export function buildPatternResult(id: PatternId): PatternResult {
  const p = PATTERNS[id];
  return { id, ...p };
}
