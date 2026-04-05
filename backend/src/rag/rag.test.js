import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRagQueryText,
  cosineSimilarity,
  keywordOverlapRatio,
} from "./rag.js";

test("cosine: identical unit vectors", () => {
  const v = [0.6, 0.8, 0];
  assert.ok(Math.abs(cosineSimilarity(v, v) - 1) < 1e-6);
});

test("cosine: orthogonal", () => {
  assert.equal(cosineSimilarity([1, 0], [0, 1]), 0);
});

test("cosine: mismatch length returns 0", () => {
  assert.equal(cosineSimilarity([1], [1, 2]), 0);
});

test("keywordOverlapRatio matches title/tags", () => {
  const r = keywordOverlapRatio("medicaid chip kids coverage", {
    title: "Medicaid and CHIP",
    tags: ["medicaid", "kids"],
    text: "Rules vary by state.",
  });
  assert.ok(r >= 0.5);
});

test("buildRagQueryText includes message and assistant snippet", () => {
  const q = buildRagQueryText("what about dinner?", [
    { role: "user", text: "foods for sleep" },
    { role: "assistant", text: "Try oats and tart cherries." },
  ]);
  assert.match(q, /what about dinner/);
  assert.match(q, /Assistant context/);
});
