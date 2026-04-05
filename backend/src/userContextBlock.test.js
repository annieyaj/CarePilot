import assert from "node:assert/strict";
import test from "node:test";
import { buildUserContextBlock } from "./userContextBlock.js";

test("buildUserContextBlock empty when no ctx", () => {
  assert.equal(buildUserContextBlock(null), "");
  assert.equal(buildUserContextBlock(undefined), "");
});

test("buildUserContextBlock includes preferred name and metrics", () => {
  const s = buildUserContextBlock({
    username: "alex",
    profile: {
      displayName: "Alex",
      age: 40,
      bmi: 24.2,
      sleepRating: 4,
      symptomTagIds: ["brain-fog-most-days"],
      healthFocus: "More steady energy",
      conditionsSummary: "Mild GERD (doctor said)",
      visitLabSummary: "Last A1c in range per PCP",
      completedOnboarding: true,
    },
  });
  assert.match(s, /Alex/);
  assert.match(s, /40/);
  assert.match(s, /BMI about 24/);
  assert.match(s, /Brain fog/);
  assert.match(s, /steady energy/);
  assert.match(s, /GERD/);
  assert.match(s, /A1c/);
  assert.match(s, /not a clinical record/);
});
