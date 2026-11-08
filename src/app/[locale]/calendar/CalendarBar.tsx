import { CSSProperties, ReactNode } from "react";

import { getSignupPillState } from "@/components/ui/signupPillState";
import { formatShortDateRange } from "@/helpers/dates";
import { getLarpHref } from "@/models/Larp.client";
import type { Larp } from "@/prisma/models";
import type { Translations } from "@/translations/en";
import Link from "next/link";

import { typeGroupByType } from "./calendarFilters";
import styles from "./calendar.module.scss";
import { typesetDashes } from "@/helpers/larpName";

export type CalendarLarp = Pick<
  Larp,
  | "id"
  | "alias"
  | "name"
  | "type"
  | "language"
  | "openness"
  | "startsAt"
  | "endsAt"
  | "signupStartsAt"
  | "signupEndsAt"
  | "cancelledAt"
> & {
  startsAt: string;
  municipality: { nameFi: string | null } | null;
};

export type BarKind = "cancelled" | "event" | "open" | "soon" | "overOrUnknown";

const kindClass: Record<BarKind, string> = {
  cancelled: styles.kindCancelled,
  event: styles.kindEvent,
  open: styles.kindOpen,
  soon: styles.kindSoon,
  overOrUnknown: styles.kindOverOrUnknown,
};

export function barKind(larp: CalendarLarp): BarKind {
  const state = getSignupPillState(larp);
  if (state?.kind === "cancelled") return "cancelled";
  const group = typeGroupByType[larp.type];
  if (group === "events") return "event";
  if (state?.kind === "open") return "open";
  if (state?.kind === "soon") return "soon";
  return "overOrUnknown";
}

function statusText(
  larp: CalendarLarp,
  messages: Translations["CommandPalette"]["pill"],
  locale: string,
): string | null {
  const state = getSignupPillState(larp);
  if (!state) return null;
  const date = state.date ? formatShortDateRange(state.date, null, locale) : "";
  return messages[state.reason].replace("{date}", date);
}

const larpLanguages: string[] = ["fi", "sv", "en"];

interface Props {
  larp: CalendarLarp;
  locale: string;
  messages: Translations["CommandPalette"]["pill"];
  className?: string;
  style?: CSSProperties;
  /** Shown at the end of the bar, e.g. the agenda's "→ Sun". */
  trailing?: ReactNode;
}

/**
 * Link to a larp styled by its signup status and type. The visible text is name · place; the dates
 * and status are added for screen readers, as a cut bar does not show where the larp starts or ends.
 */
export default function CalendarBar({
  larp,
  locale,
  messages,
  className,
  style,
  trailing,
}: Props) {
  const kind = barKind(larp);
  const place = larp.municipality?.nameFi ?? null;
  const dates = formatShortDateRange(larp.startsAt, larp.endsAt, locale);
  const status = statusText(larp, messages, locale);
  const lang =
    larp.language !== locale && larpLanguages.includes(larp.language)
      ? larp.language
      : undefined;

  return (
    <Link
      href={getLarpHref(larp)}
      className={`${styles.bar} ${kindClass[kind]} ${className ?? ""}`}
      style={style}
      title={[typesetDashes(larp.name), place, dates]
        .filter(Boolean)
        .join(" · ")}
    >
      {kind !== "event" && <span className={styles.dot} aria-hidden="true" />}
      <span className={styles.barText}>
        <span className={styles.barName} lang={lang}>
          {typesetDashes(larp.name)}
        </span>
        {place && <span className={styles.place}> · {place}</span>}
        <span className="visually-hidden">
          , {dates}
          {status && `, ${status}`}
        </span>
      </span>
      {trailing}
    </Link>
  );
}
