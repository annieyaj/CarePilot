import { cloudStatusStillRunning } from "./cloudStatus";
import type { BrowserSession, CloudSessionView } from "./journeyTypes";
import type { JourneyPhase } from "./JourneyFlowStrip";

function sessionRunning(view: CloudSessionView): boolean {
  if (typeof view.stillRunning === "boolean") return view.stillRunning;
  return cloudStatusStillRunning(view.status);
}

/**
 * Drives the journey stepper: Chat → Plan → Run → Results.
 */
export function computeJourneyPhase(
  live: BrowserSession | null,
  cloudActive: boolean,
  cloudSession: CloudSessionView | null,
): JourneyPhase {
  const running = cloudSession ? sessionRunning(cloudSession) : false;
  if (cloudActive || running) return "run";
  if (cloudSession && !running && !cloudActive) return "results";
  if (live) return "plan";
  return "ask";
}
