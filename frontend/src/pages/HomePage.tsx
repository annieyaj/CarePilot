import { Link } from "react-router-dom";
import { useSession } from "../context/SessionContext";

export default function HomePage() {
  const { me, sessionId, loading } = useSession();
  const done = me?.profile.completedOnboarding;

  const startJourney =
    sessionId && done
      ? { to: "/chat" as const }
      : sessionId && !done
        ? { to: "/input" as const }
        : { to: "/login" as const, state: { from: "/input" } as const };

  const startBusy = Boolean(sessionId && loading);

  return (
    <div className="cp-cover">
      <div className="cp-cover__panel">
        <h1 className="cp-home__hero">Nutrition guidance for subhealth</h1>
        <p className="cp-cover__lede">
          CarePilot helps you organize how you eat when you are not quite feeling your best—sleep,
          focus, digestion, muscles and joints, and immune resilience. Chat blends structured food
          ideas with optional Browser Use Cloud so you can open trusted sites in a live browser
          session.
        </p>
        {!done ? (
          <p className="cp-cover__meta cp-cover__meta--warn">
            Add your basics on the{" "}
            <Link to="/input" className="cp-inline-link">
              input page
            </Link>{" "}
            so recommendations and your meal plan can use your profile.
          </p>
        ) : (
          <p className="cp-cover__meta">
            Your profile is saved for this session. Open{" "}
            <Link to="/profile" className="cp-inline-link">
              Profile
            </Link>{" "}
            anytime to review it.
          </p>
        )}
        <div className="cp-home__actions">
          {startBusy ? (
            <button type="button" className="cp-btn cp-btn--primary" disabled>
              Loading…
            </button>
          ) : (
            <Link
              to={startJourney.to}
              state={"state" in startJourney ? startJourney.state : undefined}
              className="cp-btn cp-btn--primary"
            >
              Start your journey
            </Link>
          )}
          <Link to="/input" className="cp-btn cp-btn--secondary">
            {done ? "Update health input" : "Enter health information"}
          </Link>
        </div>
      </div>
    </div>
  );
}
