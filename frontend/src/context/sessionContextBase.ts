import { createContext } from "react";

/** Persisted when nutrition chat returns mealPlanUpdate (server). */
export type ChatMealPlanContext = {
  updatedAt: string;
  symptomsMentioned: string[];
  categoryBoosts: string[];
  weeklyDayMeals: Array<{
    day: string;
    breakfast: string;
    lunch: string;
    dinner: string;
    snacks: string[];
  }> | null;
};

export type HealthProfile = {
  /** Preferred first name or display (optional; falls back to login username in prompts). */
  displayName?: string | null;
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  bmi: number | null;
  sleepRating: number | null;
  cognitiveRating: number | null;
  digestiveRating: number | null;
  musculoskeletalRating: number | null;
  immuneRating: number | null;
  completedOnboarding: boolean;
  /** Quick-check multi-select symptom chip ids */
  symptomTagIds?: string[];
  /** Wellness goals in the user's words */
  healthFocus?: string | null;
  /** Conditions / concerns in the user's words */
  conditionsSummary?: string | null;
  /** Short visit / lab summary (user-entered; not verified) */
  visitLabSummary?: string | null;
  chatMealPlanContext?: ChatMealPlanContext | null;
};

export type Me = {
  username: string;
  email: string;
  profile: HealthProfile;
};

export type SessionContextValue = {
  sessionId: string | null;
  me: Me | null;
  loading: boolean;
  refreshMe: () => Promise<void>;
  login: (username: string, email: string) => Promise<void>;
  logout: () => void;
};

export const SessionContext = createContext<SessionContextValue | null>(null);
