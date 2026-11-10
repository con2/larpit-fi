import type { ReactNode } from "react";

import Aurora, { nightSkyProps } from "./Aurora";

/**
 * A page header on the front page's aurora. With Nordic Night it is a night sky in Day mode too;
 * without it the header keeps the page's theme. The children own the inner layout, so they should
 * not draw their own bottom border.
 */
export default function AuroraHero({ children }: { children: ReactNode }) {
  return (
    <section {...nightSkyProps("lf-aurora-hero")}>
      <Aurora variant="home" />
      <div className="lf-container">{children}</div>
    </section>
  );
}
