import logoSrc from "../assets/carepilot-logo.svg";

export type LogoVariant = "default" | "compact" | "hero";

type LogoProps = {
  variant?: LogoVariant;
  className?: string;
  /** Empty string when the brand name is shown next to the logo (avoids duplicate screen reader text). */
  alt?: string;
};

/**
 * CarePilot mark (square SVG — icon + wordmark). Scales with object-fit: contain only.
 */
export function Logo({ variant = "default", className = "", alt = "CarePilot" }: LogoProps) {
  const variantClass =
    variant === "compact"
      ? "cp-logo--compact"
      : variant === "hero"
        ? "cp-logo--hero"
        : "";
  return (
    <div className={`cp-logo ${variantClass} ${className}`.trim()}>
      <img
        src={logoSrc}
        alt={alt}
        className="cp-logo__img"
        width={1024}
        height={1024}
        decoding="async"
      />
    </div>
  );
}
