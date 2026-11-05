/** The full Night-mode aurora behind a hero. Day mode hides it in CSS. */
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
