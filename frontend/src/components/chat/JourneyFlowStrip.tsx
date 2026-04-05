export type JourneyPhase = "ask" | "plan" | "run" | "results";

type StepDef = { id: JourneyPhase; label: string; hint: string };

const STEPS: StepDef[] = [
  { id: "ask", label: "Chat", hint: "Describe your goal" },
  { id: "plan", label: "Plan", hint: "See Recommendation" },
  { id: "run", label: "Run", hint: "Cloud browser" },
  { id: "results", label: "Results", hint: "See chat + panel" },
];

export type RagSource = { id: string; title: string };

type JourneyFlowStripProps = {
  phase: JourneyPhase;
  liveLoading: boolean;
  cloudBrowserConnecting: boolean;
  cloudBrowserExecuting: boolean;
  ragSources?: RagSource[] | null;
};

export function JourneyFlowStrip({
  phase,
  liveLoading,
  cloudBrowserConnecting,
  cloudBrowserExecuting,
  ragSources,
}: JourneyFlowStripProps) {
  const browserWorking = cloudBrowserConnecting || cloudBrowserExecuting;

  return (
    <div className="cp-journey-flow" aria-label="Care journey steps">
      <ol className="cp-journey-flow__steps">
        {STEPS.map((s, i) => {
          const active = s.id === phase;
          const runStepWorking = s.id === "run" && browserWorking;
          return (
            <li
              key={s.id}
              className={`cp-journey-flow__step${active ? " cp-journey-flow__step--active" : ""}${runStepWorking ? " cp-journey-flow__step--working" : ""}`}
              aria-current={active ? "step" : undefined}
            >
              <span className="cp-journey-flow__num" aria-hidden>
                {i + 1}
              </span>
              <span className="cp-journey-flow__text">
                <span className="cp-journey-flow__label">{s.label}</span>
                <span className="cp-journey-flow__hint">{s.hint}</span>
              </span>
            </li>
          );
        })}
      </ol>
      {liveLoading ? (
        <p className="cp-journey-flow__status" role="status" aria-live="polite">
          <span className="cp-journey-flow__dot" aria-hidden />
          Gemini is updating your structured plan…
        </p>
      ) : null}
      {browserWorking ? (
        <div
          className="cp-journey-flow__browser-run"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="cp-journey-flow__browser-run-row">
            <span className="cp-journey-flow__spinner" aria-hidden />
            <span className="cp-journey-flow__browser-run-text">
              {cloudBrowserConnecting
                ? "Starting cloud browser…"
                : "Cloud browser is running — check the recommendation panel for live view and steps."}
            </span>
          </div>
          <div className="cp-journey-flow__browser-run-bar" aria-hidden>
            <div className="cp-journey-flow__browser-run-bar-inner" />
          </div>
        </div>
      ) : null}
      {ragSources && ragSources.length > 0 ? (
        <div className="cp-journey-flow__rag">
          <span className="cp-journey-flow__rag-label">Knowledge base</span>
          <ul className="cp-journey-flow__rag-list">
            {ragSources.slice(0, 5).map((r) => (
              <li key={r.id}>{r.title}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
