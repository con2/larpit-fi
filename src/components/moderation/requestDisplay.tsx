import { uuid7ToZonedDateTime } from "@con2/components/helpers";
import Link from "next/link";
import { Fragment, type ReactNode } from "react";

import type { RequestSummary } from "@/models/ModerationQueue";
import { EditStatus } from "@/prisma/enums";
import type { Translations } from "@/translations/en";

const statusPillModifiers: Record<EditStatus, string> = {
  PENDING_VERIFICATION: "",
  VERIFIED: " lf-pill--warning",
  AUTO_APPROVED: " lf-pill--soon",
  APPROVED: " lf-pill--open",
  REJECTED: " lf-pill--cancelled",
  WITHDRAWN: "",
};

export function StatusPill({
  status,
  messages: t,
}: {
  status: EditStatus;
  messages: Translations["ModerationRequest"];
}) {
  return (
    <span className={`lf-pill lf-pill--small${statusPillModifiers[status]}`}>
      {t.attributes.status.choices[status].title}
    </span>
  );
}

export function requestCreatedAt(requestId: string): Date {
  return new Date(uuid7ToZonedDateTime(requestId).epochMilliseconds);
}

const dayMs = 24 * 60 * 60 * 1000;

export function requestAgeDays(requestId: string, now: Date): number {
  return Math.max(
    0,
    Math.floor((now.getTime() - requestCreatedAt(requestId).getTime()) / dayMs),
  );
}

/**
 * The name a request goes by: the larp's, or for a new larp not yet created, the proposed one.
 */
export function requestLarpName(request: {
  larp?: { name: string } | null;
  newContent: unknown;
}): string | null {
  if (request.larp) return request.larp.name;
  const proposed = (request.newContent as { name?: unknown } | null)?.name;
  return typeof proposed === "string" && proposed ? proposed : null;
}

interface Chip {
  key: string;
  label: string;
  anchor: string;
  cancelled?: boolean;
}

function summaryChips(
  summary: RequestSummary,
  t: Translations["ModerationRequest"]["chips"],
): Chip[] {
  const chips: Chip[] = [];
  if (summary.marksCancelled) {
    chips.push({
      key: "cancelled",
      label: t.marksCancelled,
      anchor: "details",
      cancelled: true,
    });
  }
  if (summary.fieldKeys.length > 0) {
    chips.push({
      key: "fields",
      label: t.fields(summary.fieldKeys.length),
      anchor: "details",
    });
  }
  if (summary.addsRole) {
    chips.push({ key: "role", label: t.role, anchor: "role" });
  }
  const counted: [keyof RequestSummary & keyof typeof t, string][] = [
    ["linksAdded", "links"],
    ["linksRemoved", "links"],
    ["tagsAdded", "tags"],
    ["tagsRemoved", "tags"],
    ["relationsAdded", "related"],
    ["relationsRemoved", "related"],
  ];
  for (const [key, anchor] of counted) {
    const count = summary[key] as number;
    if (count > 0) {
      chips.push({
        key,
        label: (t[key] as (count: number) => string)(count),
        anchor,
      });
    }
  }
  return chips;
}

/**
 * What a request changes, as chips. With `linkToSections`, each chip links to its section on the
 * request page.
 */
export function SummaryChips({
  summary,
  messages: t,
  linkToSections = false,
}: {
  summary: RequestSummary;
  messages: Translations["ModerationRequest"]["chips"];
  linkToSections?: boolean;
}) {
  const chips = summaryChips(summary, t);
  if (chips.length === 0) {
    return (
      <div className="lf-tags lf-row__tags">
        <span className="lf-tag lf-tag--small">{t.noChanges}</span>
      </div>
    );
  }
  return (
    <div className="lf-tags lf-row__tags">
      {chips.map((chip) => {
        const className = chip.cancelled
          ? "lf-pill lf-pill--small lf-pill--cancelled"
          : "lf-tag lf-tag--small";
        return linkToSections ? (
          <Link
            key={chip.key}
            href={`#${chip.anchor}`}
            className={`${className} lf-tag--link`}
          >
            {chip.label}
          </Link>
        ) : (
          <span key={chip.key} className={className}>
            {chip.label}
          </span>
        );
      })}
    </div>
  );
}

/** Joins the present parts with the separator; translated titles may be JSX, not strings. */
export function Separated({
  children,
  separator,
}: {
  children: ReactNode[];
  separator: string;
}) {
  const parts = children.filter(
    (part) =>
      part !== null &&
      part !== undefined &&
      part !== false &&
      part !== "" &&
      !(Array.isArray(part) && part.length === 0),
  );
  return (
    <>
      {parts.map((part, index) => (
        <Fragment key={index}>
          {index > 0 && separator}
          {part}
        </Fragment>
      ))}
    </>
  );
}

export function DotSeparated({ children }: { children: ReactNode[] }) {
  return <Separated separator=" · ">{children}</Separated>;
}
