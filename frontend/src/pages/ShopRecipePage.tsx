import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../api/session";
import { CloudTaskOutput } from "../components/chat/CloudTaskOutput";
import { cloudStatusStillRunning } from "../components/chat/cloudStatus";
import type { CloudSessionView } from "../components/chat/journeyTypes";

type MealSlot = { text: string; labels: string[] };

type MealPlan = {
  date: string;
  meals: {
    breakfast: MealSlot | string;
    lunch: MealSlot | string;
    dinner: MealSlot | string;
    snacks: (MealSlot | string)[];
  };
};

type ShopRecipeState = {
  shopRecipe?: { mealTitle: string; ingredients: string[] };
};

function legacyLabelsFromSentence(s: string): string[] {
  return s
    .split(/[,;]/)
    .map((x) => x.replace(/^[\s.—]+|[\s.—]+$/g, "").trim())
    .filter((x) => x.length > 2)
    .slice(0, 12);
}

function normalizeMealSlot(raw: MealSlot | string): MealSlot {
  if (raw != null && typeof raw === "object" && "text" in raw) {
    const o = raw as MealSlot;
    const labels = Array.isArray(o.labels) ? o.labels : [];
    return { text: String(o.text ?? ""), labels };
  }
  const text = String(raw ?? "");
  return { text, labels: legacyLabelsFromSentence(text) };
}

function ingredientsForSlot(slot: MealSlot | string): string[] {
  const { text, labels } = normalizeMealSlot(slot);
  if (labels.length > 0) return labels;
  const fromText = legacyLabelsFromSentence(text);
  if (fromText.length > 0) return fromText;
  const t = text.trim();
  return t ? [t.slice(0, 120)] : [];
}

function isCloudRunning(view: CloudSessionView): boolean {
  if (typeof view.stillRunning === "boolean") return view.stillRunning;
  return cloudStatusStillRunning(view.status);
}

function cloudField<T>(
  o: Record<string, unknown>,
  camel: string,
  snake: string,
): T | undefined {
  const v = o[camel] ?? o[snake];
  return v as T | undefined;
}

function parseCloudSession(raw: Record<string, unknown>): CloudSessionView {
  const still =
    typeof raw.stillRunning === "boolean"
      ? raw.stillRunning
      : typeof raw.still_running === "boolean"
        ? raw.still_running
        : undefined;
  return {
    id: String(cloudField(raw, "id", "id") ?? ""),
    status: String(cloudField(raw, "status", "status") ?? ""),
    ...(still !== undefined ? { stillRunning: still } : {}),
    liveUrl:
      (cloudField<string | null>(raw, "liveUrl", "live_url") ?? null) || null,
    lastStepSummary:
      (cloudField<string | null>(raw, "lastStepSummary", "last_step_summary") ??
        null) ||
      null,
    stepCount: Number(cloudField(raw, "stepCount", "step_count") ?? 0),
    output: cloudField(raw, "output", "output") ?? null,
    isTaskSuccessful:
      cloudField<boolean | null>(
        raw,
        "isTaskSuccessful",
        "is_task_successful",
      ) ??
      null ??
      null,
  };
}

type WalmartRow = {
  query: string;
  added: boolean;
  product: string;
  productUrl: string;
  status: string;
};

function parseWalmartOutput(output: unknown): {
  mealTitle: string;
  results: WalmartRow[];
  agentSummary: string;
} | null {
  if (output == null) return null;
  let obj: unknown = output;
  if (typeof output === "string") {
    const raw = output
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/m, "")
      .trim();
    try {
      obj = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (typeof obj !== "object" || obj === null) return null;
  const o = obj as {
    mealTitle?: string;
    results?: WalmartRow[];
    agentSummary?: string;
  };
  if (!Array.isArray(o.results)) return null;
  return {
    mealTitle: typeof o.mealTitle === "string" ? o.mealTitle : "",
    results: o.results,
    agentSummary: typeof o.agentSummary === "string" ? o.agentSummary : "",
  };
}

function WalmartCartOutput({ output, status }: { output: unknown; status: string }) {
  if (output == null || cloudStatusStillRunning(status)) return null;
  const parsed = parseWalmartOutput(output);
  if (!parsed) return null;
  return (
    <div className="cp-shop-cloud__walmart">
      <p className="cp-shop-cloud__walmart-title">Walmart cart run</p>
      {parsed.agentSummary ? (
        <p className="cp-shop-cloud__walmart-summary">{parsed.agentSummary}</p>
      ) : null}
      <ul className="cp-shop-cloud__walmart-list">
        {parsed.results.map((r, i) => (
          <li key={`${r.query}-${i}`} className="cp-shop-cloud__walmart-row">
            <span className="cp-shop-cloud__walmart-query">{r.query}</span>
            <span
              className={
                "cp-shop-cloud__walmart-badge" +
                (r.added ? " cp-shop-cloud__walmart-badge--ok" : "")
              }
            >
              {r.status || (r.added ? "added" : "—")}
            </span>
            <span className="cp-shop-cloud__walmart-product">
              {r.productUrl ? (
                <a href={r.productUrl} target="_blank" rel="noreferrer">
                  {r.product || "Product link"}
                </a>
              ) : (
                (r.product ?? "—")
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ShopRecipePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mealTitle, setMealTitle] = useState("");
  const [ingredientLines, setIngredientLines] = useState("");
  const [planPicker, setPlanPicker] = useState<MealPlan | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  const [cloudConfigured, setCloudConfigured] = useState(false);
  const [profileConfigured, setProfileConfigured] = useState(false);
  const [cloudSession, setCloudSession] = useState<CloudSessionView | null>(null);
  const [cloudActive, setCloudActive] = useState(false);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const cloudPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    void apiFetch("/api/journey/cloud-status")
      .then((r) => r.json())
      .then((d: { configured?: boolean; profileConfigured?: boolean }) => {
        setCloudConfigured(Boolean(d.configured));
        setProfileConfigured(Boolean(d.profileConfigured));
      })
      .catch(() => {
        setCloudConfigured(false);
        setProfileConfigured(false);
      });
  }, []);

  useEffect(() => {
    const st = location.state as ShopRecipeState | null | undefined;
    const sr = st?.shopRecipe;
    if (
      !sr ||
      typeof sr.mealTitle !== "string" ||
      !Array.isArray(sr.ingredients) ||
      sr.ingredients.length === 0
    ) {
      return;
    }
    setMealTitle(sr.mealTitle.trim());
    setIngredientLines(sr.ingredients.map((x) => String(x).trim()).filter(Boolean).join("\n"));
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.key, location.pathname, navigate, location.state]);

  useEffect(
    () => () => {
      if (cloudPollRef.current) {
        clearInterval(cloudPollRef.current);
        cloudPollRef.current = null;
      }
    },
    [],
  );

  function stopCloudPoll() {
    if (cloudPollRef.current) {
      clearInterval(cloudPollRef.current);
      cloudPollRef.current = null;
    }
  }

  async function loadPlanPicker() {
    setPlanLoading(true);
    setPlanError(null);
    try {
      const r = await apiFetch("/api/me/meal-plan");
      const data = (await r.json()) as MealPlan & { error?: string };
      if (!r.ok) throw new Error(data.error ?? "Could not load plan");
      setPlanPicker(data);
    } catch (e) {
      setPlanError(e instanceof Error ? e.message : "Error");
      setPlanPicker(null);
    } finally {
      setPlanLoading(false);
    }
  }

  useEffect(() => {
    void loadPlanPicker();
  }, []);

  async function runWalmartTask() {
    const items = ingredientLines
      .split(/\n|,/)
      .map((x) => x.trim())
      .filter(Boolean);
    if (items.length === 0) {
      setCloudError("Add at least one ingredient (one per line).");
      return;
    }
    if (!cloudConfigured) {
      setCloudError("Set BROWSER_USE_API_KEY in the backend .env to run Browser Use Cloud.");
      return;
    }
    stopCloudPoll();
    setCloudError(null);
    setCloudActive(true);
    setCloudSession(null);
    try {
      const res = await apiFetch("/api/journey/cloud-task", {
        method: "POST",
        body: JSON.stringify({
          walmartCart: {
            mealTitle: mealTitle.trim(),
            items,
          },
        }),
      });
      const data = (await res.json().catch(() => ({}))) as Record<
        string,
        unknown
      > & { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? res.statusText);
      }
      let current = parseCloudSession(data);
      setCloudSession(current);
      const sessionId = current.id;
      if (!sessionId) {
        throw new Error("Cloud did not return a task id");
      }
      if (!isCloudRunning(current)) {
        setCloudActive(false);
        return;
      }
      const pollOnce = async () => {
        const r = await apiFetch(
          `/api/journey/cloud-task/${encodeURIComponent(sessionId)}`,
        );
        const d = (await r.json().catch(() => ({}))) as Record<
          string,
          unknown
        > & { error?: string };
        if (!r.ok) {
          setCloudError(d.error ?? r.statusText);
          stopCloudPoll();
          setCloudActive(false);
          return;
        }
        current = parseCloudSession(d);
        setCloudSession({ ...current });
        if (!isCloudRunning(current)) {
          stopCloudPoll();
          setCloudActive(false);
        }
      };
      cloudPollRef.current = setInterval(() => void pollOnce(), 2000);
      void pollOnce();
    } catch (e) {
      setCloudError(e instanceof Error ? e.message : "Cloud task failed");
      setCloudActive(false);
    }
  }

  function selectMealFromPlan(title: string, slot: MealSlot | string) {
    const ing = ingredientsForSlot(slot);
    setMealTitle(title);
    setIngredientLines(ing.join("\n"));
    setPlanError(null);
  }

  const walmartParsed =
    cloudSession &&
    !isCloudRunning(cloudSession) &&
    parseWalmartOutput(cloudSession.output);

  return (
    <div className="cp-page cp-page--shop-recipe">
      <div className="cp-page__inner">
        <header className="cp-page__head">
          <h1 className="cp-page__title">Shop recipe</h1>
          <p className="cp-page__sub">
            Runs a <strong>Browser Use Cloud</strong> task on Walmart.com to add your ingredient list to the cart.
            The API key only enables automation; for <strong>your Walmart account</strong>, add a Browser Use{" "}
            <strong>profile</strong> UUID to <code className="cp-code-inline">BROWSER_USE_PROFILE_ID</code> in{" "}
            <code className="cp-code-inline">backend/.env</code> after logging into Walmart once in that profile (
            <a
              className="cp-inline-link"
              href="https://docs.browser-use.com/cloud/guides/authentication"
              target="_blank"
              rel="noreferrer"
            >
              profiles guide
            </a>
            ). Requires <code className="cp-code-inline">BROWSER_USE_API_KEY</code>.
          </p>
        </header>

        <section className="cp-card cp-card--tight">
          <h2 className="cp-card__title">Your list</h2>
          <label className="cp-form__label" htmlFor="shop-meal-title">
            Meal name (optional)
          </label>
          <input
            id="shop-meal-title"
            className="cp-form__input"
            value={mealTitle}
            onChange={(e) => setMealTitle(e.target.value)}
            placeholder="e.g. Dinner"
            autoComplete="off"
          />
          <label className="cp-form__label" htmlFor="shop-ingredients">
            Ingredients (one per line)
          </label>
          <textarea
            id="shop-ingredients"
            className="cp-form__textarea cp-shop-recipe__textarea"
            value={ingredientLines}
            onChange={(e) => setIngredientLines(e.target.value)}
            rows={8}
            placeholder={"spinach\nchicken breast\nbrown rice"}
          />
          <div className="cp-shop-recipe__actions">
            <button
              type="button"
              className="cp-btn cp-btn--primary"
              onClick={() => void runWalmartTask()}
              disabled={cloudActive || !cloudConfigured}
            >
              {cloudActive ? "Walmart run in progress…" : "Add to Walmart cart (Browser Use)"}
            </button>
            <Link to="/plan" className="cp-btn cp-btn--secondary">
              Back to meal plan
            </Link>
          </div>
          {!cloudConfigured ? (
            <p className="cp-form__hint" role="status">
              Browser Use Cloud is not configured. Add <code className="cp-code-inline">BROWSER_USE_API_KEY</code> to{" "}
              <code className="cp-code-inline">backend/.env</code>.
            </p>
          ) : null}
          {cloudConfigured && profileConfigured ? (
            <p className="cp-form__hint" role="status">
              Browser Use profile is set—tasks reuse your saved Walmart session when that profile is logged in.
            </p>
          ) : null}
          {cloudConfigured && !profileConfigured ? (
            <p className="cp-form__hint" role="status">
              No <code className="cp-code-inline">BROWSER_USE_PROFILE_ID</code>—each run starts without your saved
              login; guest add-to-cart may fail if Walmart requires sign-in.
            </p>
          ) : null}
        </section>

        <section className="cp-card cp-card--tight">
          <h2 className="cp-card__title">Pick from your meal plan</h2>
          {planLoading ? <p className="cp-page__sub">Loading plan…</p> : null}
          {planError ? (
            <p className="cp-form__error" role="alert">
              {planError}{" "}
              <Link to="/input" className="cp-inline-link">
                Complete your profile
              </Link>
            </p>
          ) : null}
          {planPicker ? (
            <p className="cp-form__hint">For {planPicker.date}</p>
          ) : null}
          {planPicker ? (
            <ul className="cp-shop-recipe__picker">
              <li>
                <button
                  type="button"
                  className="cp-btn cp-btn--secondary"
                  onClick={() =>
                    selectMealFromPlan("Breakfast", planPicker.meals.breakfast)
                  }
                >
                  Use breakfast
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="cp-btn cp-btn--secondary"
                  onClick={() => selectMealFromPlan("Lunch", planPicker.meals.lunch)}
                >
                  Use lunch
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="cp-btn cp-btn--secondary"
                  onClick={() =>
                    selectMealFromPlan("Dinner", planPicker.meals.dinner)
                  }
                >
                  Use dinner
                </button>
              </li>
              {planPicker.meals.snacks.map((snack, i) => (
                <li key={`snack-${i}`}>
                  <button
                    type="button"
                    className="cp-btn cp-btn--secondary"
                    onClick={() =>
                      selectMealFromPlan(`Snack ${i + 1}`, snack)
                    }
                  >
                    Use snack {i + 1}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        {(cloudActive || cloudSession) && (
          <section className="cp-card cp-card--tight cp-shop-cloud">
            <h2 className="cp-card__title">Browser Use task</h2>
            {cloudActive && !cloudSession ? (
              <p className="cp-page__sub" role="status">
                Starting cloud browser…
              </p>
            ) : null}
            {cloudError ? (
              <p className="cp-form__error" role="alert">
                {cloudError}
              </p>
            ) : null}
            {cloudSession ? (
              <div className="cp-shop-cloud__session">
                <p className="cp-form__hint">
                  Task <code className="cp-code-inline">{cloudSession.id.slice(0, 10)}…</code> ·{" "}
                  <strong>{cloudSession.status}</strong> · {cloudSession.stepCount} step
                  {cloudSession.stepCount === 1 ? "" : "s"}
                  {isCloudRunning(cloudSession) ? " · running" : ""}
                </p>
                {cloudSession.lastStepSummary ? (
                  <p className="cp-page__sub">{cloudSession.lastStepSummary}</p>
                ) : null}
                {cloudSession.liveUrl ? (
                  <>
                    <a
                      className="cp-inline-link cp-shop-cloud__live"
                      href={cloudSession.liveUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open live browser
                    </a>
                    <iframe
                      className="cp-shop-cloud__iframe"
                      title="Browser Use live view"
                      src={cloudSession.liveUrl}
                      sandbox="allow-scripts allow-same-origin allow-popups"
                    />
                  </>
                ) : null}
                {walmartParsed ? (
                  <WalmartCartOutput
                    output={cloudSession.output}
                    status={cloudSession.status}
                  />
                ) : (
                  <CloudTaskOutput
                    output={cloudSession.output}
                    status={cloudSession.status}
                  />
                )}
              </div>
            ) : null}
          </section>
        )}
      </div>
    </div>
  );
}
