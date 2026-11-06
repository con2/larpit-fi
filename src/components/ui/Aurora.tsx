import { featureFlags } from "@/config";

/** The full Night-mode aurora behind a hero; the first child of a `nightSkyProps` hero. */
export default function Aurora({ variant }: { variant: "home" | "larp" }) {
  return (
    <div aria-hidden="true" className={`lf-aurora lf-aurora--${variant}`}>
      <div className="lf-aurora__glows" />
      <div className="lf-aurora__curtain" />
      {variant === "home" && <div className="lf-aurora__rays" />}
      <div className="lf-aurora__fade" />
    </div>
  );
}

/**
 * Props for the app bar and an aurora hero. With Nordic Night they are Night islands in both
 * modes: no change in Night mode, a night sky over the day page in Day mode. Without it they keep
 * the page's theme, which is then always Day, and the aurora stays hidden.
 */
export function nightSkyProps(className: string) {
  return featureFlags.nordicNight
    ? { className: `${className} lf-night-sky`, "data-bs-theme": "dark" }
    : { className };
}
