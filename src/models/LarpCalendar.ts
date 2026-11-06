import { toPlainDate } from "@con2/components/helpers";

import { publicUrl } from "@/config";
import { getLarpHref } from "@/models/Larp.client";
import type { Larp, Municipality } from "@/prisma/models";
import { typesetDashes } from "@/helpers/larpName";

export type CalendarLarp = Pick<
  Larp,
  | "id"
  | "alias"
  | "name"
  | "tagline"
  | "startsAt"
  | "endsAt"
  | "locationText"
  | "updatedAt"
  | "cancelledAt"
  | "updateCount"
> & {
  municipality: Pick<Municipality, "nameFi"> | null;
};

const encoder = new TextEncoder();

function escapeText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "");
}

/** Fold a single property line per RFC 5545 §3.1 (75-octet limit). */
function foldLine(line: string): string {
  if (encoder.encode(line).length <= 75) return line;

  const segments: string[] = [];
  let remaining = line;
  let first = true;

  while (remaining.length > 0) {
    const limit = first ? 75 : 74; // continuation lines have a leading space byte
    let len = Math.min(remaining.length, limit);
    while (encoder.encode(remaining.slice(0, len)).length > limit) {
      len--;
    }
    segments.push((first ? "" : " ") + remaining.slice(0, len));
    remaining = remaining.slice(len);
    first = false;
  }

  return segments.join("\r\n");
}

/** Format a Date as an iCalendar UTC timestamp: YYYYMMDDTHHMMSSZ */
function formatUtc(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

const cancelledPrefix: Record<string, string> = {
  fi: "PERUUTETTU",
  en: "CANCELLED",
};

/** Larps without a start date are left out. */
export function renderLarpCalendar(
  larps: CalendarLarp[],
  { locale, calendarName }: { locale: string; calendarName: string },
): string {
  const prefix = cancelledPrefix[locale] ?? cancelledPrefix.en;
  const now = new Date();
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//larpit.fi//Larpit.fi//FI",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    foldLine(`X-WR-CALNAME:${escapeText(typesetDashes(calendarName))}`),
  ];

  for (const larp of larps) {
    if (!larp.startsAt) continue;

    const startDate = toPlainDate(larp.startsAt);
    const endDate = larp.endsAt
      ? toPlainDate(larp.endsAt).add({ days: 1 })
      : startDate.add({ days: 1 });
    const url = `${publicUrl}${getLarpHref(larp)}`;

    const locationParts = [larp.locationText, larp.municipality?.nameFi].filter(
      Boolean,
    );

    const name = typesetDashes(larp.name);
    const summary = larp.cancelledAt ? `[${prefix}] ${name}` : name;

    lines.push("BEGIN:VEVENT");
    lines.push(foldLine(`UID:${larp.id}@larpit.fi`));
    lines.push(foldLine(`SEQUENCE:${larp.updateCount}`));
    lines.push(foldLine(`DTSTAMP:${formatUtc(now)}`));
    lines.push(foldLine(`LAST-MODIFIED:${formatUtc(larp.updatedAt)}`));
    if (larp.cancelledAt) lines.push("STATUS:CANCELLED");
    lines.push(
      foldLine(`DTSTART;VALUE=DATE:${startDate.toString().replace(/-/g, "")}`),
    );
    lines.push(
      foldLine(`DTEND;VALUE=DATE:${endDate.toString().replace(/-/g, "")}`),
    );
    lines.push(foldLine(`SUMMARY:${escapeText(summary)}`));

    if (larp.tagline) {
      lines.push(
        foldLine(`DESCRIPTION:${escapeText(typesetDashes(larp.tagline))}`),
      );
    }

    if (locationParts.length > 0) {
      lines.push(foldLine(`LOCATION:${escapeText(locationParts.join(", "))}`));
    }

    lines.push(foldLine(`URL:${url}`));
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");

  return lines.join("\r\n") + "\r\n";
}
