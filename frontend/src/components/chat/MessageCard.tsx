import { AgentTextProse } from "./AgentTextProse";
import { GroceryPriceBlock } from "./GroceryPriceBlock";
import { SmartButton } from "./SmartButton";
import { titleForResourceLinks } from "./resourceLinks";
import type { AssistantChatMessage, CarePlaceRow, UserChatMessage } from "./types";

function formatDistanceMeters(m?: number): string | null {
  if (m == null || !Number.isFinite(m)) return null;
  if (m < 1609) return `${m} m`;
  return `${(m / 1609).toFixed(1)} mi`;
}

function PlaceCard({ p }: { p: CarePlaceRow }) {
  const dist = formatDistanceMeters(p.distanceMeters);
  return (
    <li className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-semibold text-slate-900">{p.name}</p>
        {dist ? (
          <span className="shrink-0 text-xs font-medium text-slate-500">≈ {dist}</span>
        ) : null}
      </div>
      {p.address ? <p className="mt-1 text-sm text-slate-600">{p.address}</p> : null}
      <div className="mt-2 flex flex-wrap gap-2 text-sm">
        {p.mapsUrl ? (
          <a
            href={p.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-cp-dust-700 underline-offset-2 hover:underline"
          >
            Open in Maps
          </a>
        ) : null}
        {p.rating ? (
          <span className="text-xs text-slate-500">Rating: {p.rating}</span>
        ) : null}
      </div>
      {p.note ? <p className="mt-2 text-xs text-slate-600">{p.note}</p> : null}
    </li>
  );
}

function introFromAssistantText(text: string) {
  const lines = text.split("\n");
  const intro: string[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (/^[-*•]\s+/.test(line)) break;
    intro.push(line);
  }
  const joined = intro.join(" ").trim();
  if (joined) return joined;
  const t = text.trim();
  if (!t) return "";
  if (/^[-*•]\s+/m.test(t)) return "";
  return t;
}

type MessageCardProps =
  | { variant: "user"; message: UserChatMessage }
  | {
      variant: "assistant";
      message: AssistantChatMessage;
      showGroceryButton?: boolean;
      onCheckGroceryPrices?: () => void;
      groceryLoading?: boolean;
    };

export function MessageCard(props: MessageCardProps) {
  if (props.variant === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[min(100%,36rem)] rounded-2xl bg-gradient-to-br from-cp-sage-600 to-cp-sage-800 px-4 py-3 text-sm leading-relaxed text-white shadow-md shadow-cp-sage-900/20">
          {props.message.text.split("\n").map((line, i) => (
            <span key={i}>
              {i > 0 ? <br /> : null}
              {line}
            </span>
          ))}
        </div>
      </div>
    );
  }

  const { message, showGroceryButton, onCheckGroceryPrices, groceryLoading } = props;

  const br = message.browserRun;
  if (br) {
    const groceryRun =
      br.kind === "grocery" &&
      ((br.grocery && br.grocery.length > 0) || Boolean(br.grocerySubstitutions?.trim()));
    const mapsRun = br.kind === "maps";
    return (
      <div className="flex justify-start">
        <article
          className={`w-full max-w-[min(100%,40rem)] rounded-xl border bg-white p-4 shadow-md sm:p-5 ${
            groceryRun
              ? "border-cp-sage-200/80 shadow-cp-sage-900/5"
              : mapsRun
                ? "border-cp-sage-200/90 shadow-cp-sage-800/5"
                : "border-cp-sage-200/90"
          }`}
        >
          <header className="mb-3 border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold tracking-tight text-cp-dust-700">✨ CarePilot</h3>
          </header>
          {br.kind === "grocery" &&
          ((br.grocery && br.grocery.length > 0) || br.grocerySubstitutions) ? (
            <div className="rounded-xl border border-cp-sage-100/80 bg-gradient-to-br from-cp-sage-50/40 to-white px-3 py-3 sm:px-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-cp-sage-800">
                Browser price check
              </p>
              <h4 className="mt-1 text-base font-semibold text-slate-900">{br.title}</h4>
              {br.subtitle ? (
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{br.subtitle}</p>
              ) : null}
            </div>
          ) : br.kind === "maps" ? (
            <div className="rounded-xl border border-cp-sage-100/90 bg-gradient-to-br from-cp-sage-50/50 to-white px-3 py-3 sm:px-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-cp-sage-800">
                {br.mapsContext === "care" ? "Care locations (Maps)" : "Nearby stores (Maps)"}
              </p>
              <h4 className="mt-1 text-base font-semibold text-slate-900">{br.title}</h4>
              {br.subtitle ? (
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{br.subtitle}</p>
              ) : null}
            </div>
          ) : (
            <div className="rounded-lg border border-cp-sage-100 bg-gradient-to-br from-cp-sage-50/90 to-white px-3 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-cp-sage-800">
                Browser task results
              </p>
              <h4 className="mt-1.5 text-base font-semibold text-slate-900">{br.title}</h4>
              {br.subtitle ? <p className="mt-2 text-sm leading-relaxed text-slate-600">{br.subtitle}</p> : null}
            </div>
          )}

          {br.kind === "grocery" &&
          ((br.grocery && br.grocery.length > 0) || br.grocerySubstitutions) ? (
            <GroceryPriceBlock
              items={br.grocery ?? []}
              substitutionsNote={br.grocerySubstitutions}
            />
          ) : null}

          {br.kind === "care" && br.carePlaces && br.carePlaces.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {br.carePlaces.map((p) => (
                <PlaceCard key={`${p.name}-${p.mapsUrl ?? p.address ?? ""}`} p={p} />
              ))}
            </ul>
          ) : null}

          {br.kind === "maps" && br.mapsPlaces && br.mapsPlaces.length > 0 ? (
            <>
              <ul className="mt-4 space-y-3">
                {br.mapsPlaces.map((p) => (
                  <PlaceCard key={`${p.name}-${p.mapsUrl ?? p.address ?? ""}-${p.distanceMeters ?? ""}`} p={p} />
                ))}
              </ul>
              {br.mapsDisclaimer ? (
                <p className="mt-3 rounded-lg border border-amber-100 bg-amber-50/90 px-3 py-2 text-xs leading-relaxed text-amber-950">
                  {br.mapsDisclaimer}
                </p>
              ) : null}
            </>
          ) : null}

          {br.kind === "generic" && br.rawText ? (
            <div className="mt-4 max-h-[min(70vh,28rem)] overflow-y-auto rounded-xl border border-slate-200/90 bg-gradient-to-b from-slate-50/95 to-white p-4 shadow-inner">
              <AgentTextProse text={br.rawText} />
            </div>
          ) : null}
        </article>
      </div>
    );
  }

  const ns = message.nutritionSections;
  const intro = ns
    ? ns.intro.trim()
    : introFromAssistantText(message.text);
  const hasFoods = message.foodsToTry.length > 0;
  const hasResources = message.resourceLinks.length > 0;
  const resourceSectionTitle = hasResources
    ? titleForResourceLinks(message.resourceLinks.map((r) => r.url))
    : "";
  const showNutritionLayout =
    ns != null &&
    (intro.length > 0 ||
      hasFoods ||
      Boolean(ns.easeUpOn) ||
      Boolean(ns.closing));
  const showStructured =
    showNutritionLayout || (!ns && (hasFoods || hasResources));
  const showGroceryBtn = showGroceryButton && onCheckGroceryPrices;

  return (
    <div className="flex justify-start">
      <article className="w-full max-w-[min(100%,40rem)] rounded-xl border border-cp-sage-800/15 bg-white/95 p-4 shadow-md shadow-cp-sage-900/5 sm:p-5">
        <header className="mb-3 border-b border-cp-sage-900/10 pb-2">
          <h3 className="text-sm font-bold tracking-tight text-cp-sage-900">✨ CarePilot</h3>
        </header>

        {showNutritionLayout && intro ? (
          <p className="text-sm leading-relaxed text-slate-600">{intro}</p>
        ) : null}
        {!showNutritionLayout && showStructured && intro ? (
          <p className="text-sm leading-relaxed text-slate-600">{intro}</p>
        ) : null}
        {!showStructured ? (
          <p className="text-sm leading-relaxed text-slate-600">
            {message.text.split("\n").map((line, i) => (
              <span key={i}>
                {i > 0 ? <br /> : null}
                {line}
              </span>
            ))}
          </p>
        ) : null}

        {hasFoods ? (
          <section className="mt-4">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-cp-sage-700">
              Foods to emphasize
            </h4>
            <ul className="list-inside list-disc space-y-1 text-sm text-slate-700">
              {message.foodsToTry.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {ns?.easeUpOn ? (
          <section className="mt-4">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-600">
              Ease up on
            </h4>
            <p className="text-sm leading-relaxed text-slate-700">{ns.easeUpOn}</p>
          </section>
        ) : null}

        {ns?.closing ? (
          <p className="mt-3 text-xs leading-relaxed text-slate-500">{ns.closing}</p>
        ) : null}

        {hasResources ? (
          <section className="mt-4">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-cp-sage-800">
              {resourceSectionTitle}
            </h4>
            <ul className="space-y-1.5 text-sm text-slate-700">
              {message.resourceLinks.map((link) => (
                <li key={link.url} className="rounded-lg bg-cp-sage-50/80 px-2.5 py-1.5">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-cp-sage-900 underline-offset-2 hover:underline"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {showGroceryBtn ? (
          <div className="mt-4 border-t border-cp-sage-900/10 pt-4">
            <SmartButton
              variant="outline"
              onClick={onCheckGroceryPrices}
              loading={groceryLoading}
              loadingLabel="Checking…"
              className="w-full sm:w-auto"
            >
              Check grocery prices
            </SmartButton>
          </div>
        ) : null}
      </article>
    </div>
  );
}
