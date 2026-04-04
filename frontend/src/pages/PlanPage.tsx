import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/session";

type MealPlan = {
  date: string;
  summary: string;
  concerns: string[];
  meals: {
    breakfast: string;
    lunch: string;
    dinner: string;
    snacks: string[];
  };
  hydration: string;
  disclaimer: string;
};

export default function PlanPage() {
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const r = await apiFetch("/api/me/meal-plan");
        const data = (await r.json()) as MealPlan & { error?: string };
        if (!r.ok) throw new Error(data.error ?? "Could not load plan");
        if (!cancelled) setPlan(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="cp-page">
        <p className="cp-page__sub">Loading meal plan…</p>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="cp-page">
        <p className="cp-form__error" role="alert">
          {error ?? "No plan"}
        </p>
        <Link to="/input" className="cp-inline-link">
          Complete your profile
        </Link>
      </div>
    );
  }

  return (
    <div className="cp-page">
      <header className="cp-page__head">
        <h1 className="cp-page__title">Daily meal plan</h1>
        <p className="cp-page__sub">
          For {plan.date}. Areas you rated <strong>3+</strong> on health input shape these suggestions.
        </p>
      </header>

      <p className="cp-plan__summary">{plan.summary}</p>

      <div className="cp-plan__grid">
        <article className="cp-meal">
          <h2 className="cp-meal__label">Breakfast</h2>
          <p className="cp-meal__text">{plan.meals.breakfast}</p>
        </article>
        <article className="cp-meal">
          <h2 className="cp-meal__label">Lunch</h2>
          <p className="cp-meal__text">{plan.meals.lunch}</p>
        </article>
        <article className="cp-meal">
          <h2 className="cp-meal__label">Dinner</h2>
          <p className="cp-meal__text">{plan.meals.dinner}</p>
        </article>
        <article className="cp-meal">
          <h2 className="cp-meal__label">Snacks</h2>
          <ul className="cp-meal__list">
            {plan.meals.snacks.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </article>
      </div>

      <section className="cp-card cp-card--tight">
        <p className="cp-plan__hydration">
          <strong>Hydration:</strong> {plan.hydration}
        </p>
        <p className="cp-plan__disclaimer">{plan.disclaimer}</p>
        <Link to="/chat" className="cp-btn cp-btn--secondary">
          Discuss in chat
        </Link>
      </section>
    </div>
  );
}
