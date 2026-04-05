import { cloudStatusStillRunning } from "./cloudStatus";

type GroceryPriceRow = { store: string; product: string; price: string; productUrl?: string };
type GroceryPriceItem = { query: string; results: GroceryPriceRow[] };

function parseGroceryCloudOutput(output: unknown): { items: GroceryPriceItem[] } | null {
  if (output == null) return null;
  if (typeof output === "object" && output !== null) {
    const o = output as { items?: unknown };
    if (Array.isArray(o.items) && o.items.length > 0) {
      return { items: o.items as GroceryPriceItem[] };
    }
  }
  if (typeof output !== "string") return null;
  const raw = output
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/m, "")
    .trim();
  try {
    const j = JSON.parse(raw) as { items?: GroceryPriceItem[] };
    if (j && Array.isArray(j.items) && j.items.length > 0) return { items: j.items };
  } catch {
    /* ignore */
  }
  return null;
}

export function CloudTaskOutput({ output, status }: { output: unknown; status: string }) {
  if (output == null || cloudStatusStillRunning(status)) return null;
  const parsed = parseGroceryCloudOutput(output);
  if (parsed) {
    return (
      <div className="mt-3 space-y-3 rounded-lg border border-slate-200 bg-slate-50/80 p-3">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
          Grocery price snapshot
        </p>
        {parsed.items.map((row) => (
          <div key={row.query} className="rounded-lg border border-slate-200 bg-white p-2">
            <p className="mb-2 text-sm font-semibold text-slate-800">{row.query}</p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[240px] text-left text-xs text-slate-600">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="py-1.5 pr-2 font-semibold">Store</th>
                    <th className="py-1.5 pr-2 font-semibold">Product</th>
                    <th className="py-1.5 font-semibold">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {(row.results ?? []).map((r, i) => (
                    <tr key={`${row.query}-${r.store}-${i}`} className="border-b border-slate-50">
                      <td className="py-1.5 pr-2">{r.store}</td>
                      <td className="py-1.5 pr-2">
                        {r.productUrl ? (
                          <a
                            href={r.productUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-sky-700 underline-offset-2 hover:underline"
                          >
                            {r.product || "—"}
                          </a>
                        ) : (
                          (r.product ?? "—")
                        )}
                      </td>
                      <td className="py-1.5">{r.price ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <pre className="mt-3 max-h-48 overflow-auto rounded-lg bg-slate-900/90 p-3 text-xs text-slate-100">
      {typeof output === "string" ? output : JSON.stringify(output, null, 2)}
    </pre>
  );
}
