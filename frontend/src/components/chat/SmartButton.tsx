type SmartButtonProps = {
  children: React.ReactNode;
  variant?: "primary" | "ghost" | "outline";
  disabled?: boolean;
  loading?: boolean;
  /** Shown next to the spinner when `loading` — easier to see than spinner alone. */
  loadingLabel?: string;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit";
};

export function SmartButton({
  children,
  variant = "primary",
  disabled,
  loading,
  loadingLabel,
  onClick,
  className = "",
  type = "button",
}: SmartButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cp-sage-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";
  const variants = {
    primary:
      "bg-gradient-to-br from-cp-sage-600 to-cp-dust-600 text-white shadow-md shadow-cp-sage-900/10 hover:shadow-lg hover:brightness-[1.02] active:scale-[0.98]",
    ghost: "bg-transparent text-cp-dust-700 hover:bg-slate-100",
    outline: "border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-cp-sage-300 hover:bg-slate-50",
  };
  const spinnerClass =
    variant === "primary"
      ? "border-white/40 border-t-white"
      : "border-slate-300 border-t-cp-sage-600";
  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? (
        <>
          <span
            className={`inline-block size-3.5 shrink-0 animate-spin rounded-full border-2 ${spinnerClass}`}
            aria-hidden
          />
          {loadingLabel ? <span>{loadingLabel}</span> : null}
        </>
      ) : (
        children
      )}
    </button>
  );
}
