import { SmartButton } from "./SmartButton";
import type { RecommendationAction } from "./types";

type ActionItemProps = {
  action: RecommendationAction;
  checked: boolean;
  onToggle: () => void;
  onRun?: () => void;
  runLoading?: boolean;
  runDisabled?: boolean;
};

export function ActionItem({
  action,
  checked,
  onToggle,
  onRun,
  runLoading,
  runDisabled,
}: ActionItemProps) {
  const showRun = action.type === "browseruse" && onRun;

  return (
    <div className="group rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-sm transition hover:border-teal-200/80 hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <label className="flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            checked={checked}
            onChange={onToggle}
            className="mt-0.5 size-4 shrink-0 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
          />
          <span className="text-sm font-medium leading-snug text-slate-800">{action.label}</span>
        </label>
        {showRun ? (
          <SmartButton
            variant="primary"
            className="shrink-0 min-w-[4.5rem] py-1.5 text-xs"
            onClick={onRun}
            disabled={runDisabled}
            loading={runLoading}
          >
            {action.buttonLabel ?? "Run"}
          </SmartButton>
        ) : null}
      </div>
    </div>
  );
}
