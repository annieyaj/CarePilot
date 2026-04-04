import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../api/session";
import { useSession } from "../context/SessionContext";

function cmFromFtIn(ft: number, inch: number) {
  const totalIn = ft * 12 + inch;
  return Math.round(totalIn * 2.54 * 10) / 10;
}

const DEFAULT_RATING = 3;

function RatingRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="cp-rating">
      <span className="cp-rating__label">{label}</span>
      <div className="cp-rating__scale" role="group" aria-label={`${label} 1 to 5`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={"cp-rating__btn" + (value === n ? " cp-rating__btn--active" : "")}
            aria-pressed={value === n}
            aria-label={`${n} out of 5`}
            onClick={() => onChange(n)}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function InputPage() {
  const { me, refreshMe } = useSession();
  const navigate = useNavigate();
  const p = me?.profile;

  const [age, setAge] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [useMetric, setUseMetric] = useState(true);
  const [ft, setFt] = useState("5");
  const [inch, setInch] = useState("8");
  const [sleepRating, setSleepRating] = useState(DEFAULT_RATING);
  const [cognitiveRating, setCognitiveRating] = useState(DEFAULT_RATING);
  const [digestiveRating, setDigestiveRating] = useState(DEFAULT_RATING);
  const [musculoskeletalRating, setMusculoskeletalRating] = useState(DEFAULT_RATING);
  const [immuneRating, setImmuneRating] = useState(DEFAULT_RATING);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!p) return;
    if (p.age != null) setAge(String(p.age));
    if (p.heightCm != null) setHeightCm(String(p.heightCm));
    if (p.weightKg != null) setWeightKg(String(p.weightKg));
    setSleepRating(p.sleepRating ?? DEFAULT_RATING);
    setCognitiveRating(p.cognitiveRating ?? DEFAULT_RATING);
    setDigestiveRating(p.digestiveRating ?? DEFAULT_RATING);
    setMusculoskeletalRating(p.musculoskeletalRating ?? DEFAULT_RATING);
    setImmuneRating(p.immuneRating ?? DEFAULT_RATING);
  }, [p]);

  function computedBmi(): number | null {
    const h = useMetric
      ? parseFloat(heightCm)
      : cmFromFtIn(parseInt(ft, 10) || 0, parseInt(inch, 10) || 0);
    const w = parseFloat(weightKg);
    if (!Number.isFinite(h) || !Number.isFinite(w) || h <= 0 || w <= 0) return null;
    const m = h / 100;
    return Math.round((w / (m * m)) * 10) / 10;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const h = useMetric
        ? parseFloat(heightCm)
        : cmFromFtIn(parseInt(ft, 10) || 0, parseInt(inch, 10) || 0);
      const w = parseFloat(weightKg);
      const a = parseInt(age, 10);
      const body = {
        age: Number.isFinite(a) ? a : null,
        heightCm: Number.isFinite(h) ? h : null,
        weightKg: Number.isFinite(w) ? w : null,
        bmi: computedBmi(),
        sleepRating,
        cognitiveRating,
        digestiveRating,
        musculoskeletalRating,
        immuneRating,
        completedOnboarding: true,
      };
      const r = await apiFetch("/api/me/profile", {
        method: "PUT",
        body: JSON.stringify(body),
      });
      const data = (await r.json()) as { error?: string };
      if (!r.ok) throw new Error(data.error ?? "Could not save profile");
      await refreshMe();
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  const bmiPreview = computedBmi();

  return (
    <div className="cp-page">
      <header className="cp-page__head">
        <h1 className="cp-page__title">Your health snapshot</h1>
        <p className="cp-page__sub">
          Basic metrics and subhealth focus (1–5) help tailor food ideas and your daily meal plan.
        </p>
      </header>

      <form className="cp-form cp-form--wide" onSubmit={(e) => void onSubmit(e)}>
        <fieldset className="cp-form__fieldset">
          <legend className="cp-form__legend">Body metrics</legend>
          <div className="cp-form__row">
            <label className="cp-form__label">
              Age
              <input
                className="cp-form__input"
                type="number"
                min={1}
                max={120}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 34"
              />
            </label>
            <label className="cp-form__label">
              Weight (kg)
              <input
                className="cp-form__input"
                type="number"
                step="0.1"
                min={1}
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="e.g. 72"
              />
            </label>
          </div>
          <label className="cp-form__check">
            <input
              type="checkbox"
              checked={useMetric}
              onChange={(e) => setUseMetric(e.target.checked)}
            />
            Use centimeters for height
          </label>
          {useMetric ? (
            <label className="cp-form__label">
              Height (cm)
              <input
                className="cp-form__input"
                type="number"
                step="0.1"
                min={50}
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                placeholder="e.g. 172"
              />
            </label>
          ) : (
            <div className="cp-form__row">
              <label className="cp-form__label">
                Height (ft)
                <input
                  className="cp-form__input"
                  type="number"
                  min={3}
                  max={8}
                  value={ft}
                  onChange={(e) => setFt(e.target.value)}
                />
              </label>
              <label className="cp-form__label">
                Height (in)
                <input
                  className="cp-form__input"
                  type="number"
                  min={0}
                  max={11}
                  value={inch}
                  onChange={(e) => setInch(e.target.value)}
                />
              </label>
            </div>
          )}
          <p className="cp-form__hint">
            BMI (preview):{" "}
            <strong>{bmiPreview != null ? bmiPreview : "—"}</strong>
            {bmiPreview != null ? " (also sent to the server from height & weight)" : ""}
          </p>
        </fieldset>

        <fieldset className="cp-form__fieldset">
          <legend className="cp-form__legend">Subhealth focus</legend>
          <p className="cp-rating__lede">
            Rate each area from <strong>1</strong> (minimal) to <strong>5</strong> (strong focus or
            bother). Meal plans treat <strong>3+</strong> as an active concern.
          </p>
          <div className="cp-rating__list">
            <RatingRow label="Sleep & recovery" value={sleepRating} onChange={setSleepRating} />
            <RatingRow label="Cognitive & focus" value={cognitiveRating} onChange={setCognitiveRating} />
            <RatingRow label="Digestive" value={digestiveRating} onChange={setDigestiveRating} />
            <RatingRow
              label="Musculoskeletal"
              value={musculoskeletalRating}
              onChange={setMusculoskeletalRating}
            />
            <RatingRow label="Immune" value={immuneRating} onChange={setImmuneRating} />
          </div>
        </fieldset>

        {error ? (
          <p className="cp-form__error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="cp-form__actions">
          <Link to="/" className="cp-btn cp-btn--secondary">
            Cancel
          </Link>
          <button type="submit" className="cp-btn cp-btn--primary" disabled={busy}>
            {busy ? "Saving…" : "Save profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
