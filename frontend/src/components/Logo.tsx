export type LogoVariant = "default" | "compact" | "hero";

const LOGO_SRC = "/carepilot-logo.png";

type LogoProps = {
  variant?: LogoVariant;
  className?: string;
};

/**
 * Full CarePilot mark from raster (square PNG — icon + wordmark). Scales with object-fit: contain only.
 */
export function Logo({ variant = "default", className = "" }: LogoProps) {
  const variantClass =
    variant === "compact" ? "cp-logo--compact" : variant === "hero" ? "cp-logo--hero" : "";
  return (
    <div className={`cp-logo ${variantClass} ${className}`.trim()}>
      <img
        src={LOGO_SRC}
        alt="CarePilot"
        className="cp-logo__img"
        width={1024}
        height={1024}
        decoding="async"
      />
    </div>
  );
}
