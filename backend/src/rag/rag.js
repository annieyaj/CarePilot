/**
 * Lightweight RAG: embed curated corpus with Gemini, retrieve top chunks per query,
 * inject into assist system prompts. No LangChain — keeps the stack small.
 *
 * Env: GEMINI_EMBEDDING_MODEL (default text-embedding-004), RAG_TOP_K (default 4),
 * RAG_DISABLED=1 to skip retrieval.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {Array<{ id: string, title: string, tags?: string[], text: string }>} */
let corpus = [];

try {
  const raw = readFileSync(join(__dirname, "corpus.json"), "utf8");
  corpus = JSON.parse(raw);
} catch (e) {
  console.warn("rag: could not load corpus.json", e?.message ?? e);
}

function ragDisabled() {
  const v = process.env.RAG_DISABLED?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

/** Exposed for /api/health and ops. */
export function ragFeatureEnabled() {
  return !ragDisabled() && corpus.length > 0;
}

function embeddingModel() {
  return process.env.GEMINI_EMBEDDING_MODEL?.trim() || "text-embedding-004";
}

function topK() {
  const n = Number(process.env.RAG_TOP_K?.trim());
  if (Number.isFinite(n) && n >= 1 && n <= 12) return Math.floor(n);
  return 4;
}

/** @param {number[]} a @param {number[]} b */
export function cosineSimilarity(a, b) {
  if (!a?.length || !b?.length || a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const d = Math.sqrt(na) * Math.sqrt(nb);
  return d === 0 ? 0 : dot / d;
}

/** @param {import('@google/genai').GoogleGenAI} ai */
async function embedBatch(ai, texts, taskType) {
  const model = embeddingModel();
  const res = await ai.models.embedContent({
    model,
    contents: texts,
    config: { taskType },
  });
  const out = [];
  const embeddings = res.embeddings ?? [];
  for (let i = 0; i < texts.length; i++) {
    const values = embeddings[i]?.values;
    if (!values?.length) {
      throw new Error(`embedContent missing vector at index ${i}`);
    }
    out.push(values);
  }
  return out;
}

/** @type {Promise<void> | null} */
let loadPromise = null;
/** @type {Array<{ chunk: (typeof corpus)[0], vector: number[] }> | null} */
let indexed = null;

/**
 * @param {import('@google/genai').GoogleGenAI} ai
 * @returns {Promise<void>}
 */
export function ensureRagIndexed(ai) {
  if (ragDisabled() || corpus.length === 0) return Promise.resolve();
  if (indexed) return Promise.resolve();
  if (!loadPromise) {
    loadPromise = (async () => {
      const texts = corpus.map((c) => `${c.title}\n${c.text}`.slice(0, 8000));
      const batchSize = 16;
      const vectors = [];
      for (let i = 0; i < texts.length; i += batchSize) {
        const slice = texts.slice(i, i + batchSize);
        const vecs = await embedBatch(ai, slice, "RETRIEVAL_DOCUMENT");
        vectors.push(...vecs);
      }
      indexed = corpus.map((chunk, i) => ({ chunk, vector: vectors[i] }));
    })();
  }
  return loadPromise.catch((err) => {
    loadPromise = null;
    indexed = null;
    throw err;
  });
}

/**
 * Build a query string from the latest user message and recent thread (for retrieval).
 * @param {string} message
 * @param {Array<{ role?: string, text?: string }>} [history]
 */
export function buildRagQueryText(message, history) {
  const m = String(message ?? "").trim();
  const h = Array.isArray(history) ? history : [];
  const lastUser = [...h].reverse().find((x) => x?.role === "user");
  const lastAsst = [...h].reverse().find((x) => x?.role === "assistant");
  const parts = [];
  if (lastUser?.text?.trim() && lastUser.text !== m) {
    parts.push(`Earlier: ${lastUser.text.trim().slice(0, 400)}`);
  }
  parts.push(m);
  if (lastAsst?.text?.trim()) {
    parts.push(`Assistant context: ${lastAsst.text.trim().slice(0, 500)}`);
  }
  return parts.join("\n").slice(0, 6000);
}

/**
 * @param {import('@google/genai').GoogleGenAI} ai
 * @param {string} message
 * @param {Array<{ role?: string, text?: string }>} [history]
 * @returns {Promise<{ contextBlock: string, sources: Array<{ id: string, title: string }> }>}
 */
export async function retrieveRagContext(ai, message, history) {
  if (ragDisabled() || corpus.length === 0) {
    return { contextBlock: "", sources: [] };
  }

  try {
    await ensureRagIndexed(ai);
    if (!indexed?.length) return { contextBlock: "", sources: [] };

    const queryText = buildRagQueryText(message, history);
    const [queryVec] = await embedBatch(ai, [queryText], "RETRIEVAL_QUERY");

    const scored = indexed.map(({ chunk, vector }) => ({
      chunk,
      score: cosineSimilarity(queryVec, vector),
    }));
    scored.sort((a, b) => b.score - a.score);
    const k = topK();
    const top = scored.slice(0, k).filter((s) => s.score > 0.01);

    if (top.length === 0) {
      return { contextBlock: "", sources: [] };
    }

    const lines = top.map(
      ({ chunk }) =>
        `[${chunk.title}]\n${chunk.text}`,
    );
    const contextBlock = [
      "Retrieved internal knowledge snippets (themes for navigation and safety—not the user's medical record).",
      "Use to align tone, red flags, and trusted-resource patterns; do not invent private details.",
      "---",
      lines.join("\n\n---\n"),
      "---",
    ].join("\n");

    const sources = top.map(({ chunk }) => ({ id: chunk.id, title: chunk.title }));
    return { contextBlock, sources };
  } catch (e) {
    console.warn("rag: retrieval failed", e?.message ?? e);
    return { contextBlock: "", sources: [] };
  }
}
