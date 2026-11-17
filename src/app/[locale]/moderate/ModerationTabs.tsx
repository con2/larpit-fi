import Link from "next/link";
import { ReactNode } from "react";

import type { Translations } from "@/translations/en";

export type ModerationTab = "open" | "resolved" | "all";

const tabHrefs: Record<ModerationTab, string> = {
  open: "/moderate",
  resolved: "/moderate/resolved",
  all: "/moderate/all",
};

interface Props {
  current: ModerationTab;
  title: string;
  openCount: number;
  messages: Translations["ModerationRequest"];
  /** Below the title, above the tabs. */
  lede?: ReactNode;
  /** Below the tabs. */
  children?: ReactNode;
}

/** Page header shared by the moderation request lists. */
export default function ModerationTabs({
  current,
  title,
  openCount,
  messages: t,
  lede,
  children,
}: Props) {
  return (
    <header className="lf-page-header lf-mod-header">
      <p className="lf-eyebrow">{t.eyebrow}</p>
      <h1 className="lf-display-l">{title}</h1>
      {lede}
      <nav className="lf-mod-tabs" aria-label={t.tabs.label}>
        {(Object.keys(tabHrefs) as ModerationTab[]).map((tab) => (
          <Link
            key={tab}
            href={tabHrefs[tab]}
            aria-current={tab === current ? "page" : undefined}
          >
            {t.tabs[tab]}
            {tab === "open" && <span className="lf-count"> {openCount}</span>}
          </Link>
        ))}
      </nav>
      {children}
    </header>
  );
}
