import { publicUrl } from "@/config";
import { getLarpHref } from "@/models/Larp.client";
import { toPlainDate } from "@/helpers/temporal";
import prisma from "@/prisma";

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
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

const cancelledPrefix: Record<string, string> = {
  fi: "PERUUTETTU",
  en: "CANCELLED",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") === "fi" ? "fi" : "en";
  const prefix = cancelledPrefix[locale];

  const larps = await prisma.larp.findMany({
    where: { startsAt: { not: null } },
    select: {
      id: true,
      alias: true,
      name: true,
      tagline: true,
      startsAt: true,
      endsAt: true,
      locationText: true,
      municipality: { select: { nameFi: true } },
      updatedAt: true,
      isCancelled: true,
      updateCount: true,
    },
    orderBy: { startsAt: "desc" },
  });

  const now = new Date();
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//larpit.fi//Larpit.fi//FI",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Larpit.fi",
  ];

  for (const larp of larps) {
    if (!larp.startsAt) continue;

    const startDate = toPlainDate(larp.startsAt);
    const endDate = larp.endsAt ? toPlainDate(larp.endsAt).add({ days: 1 }) : startDate.add({ days: 1 });
    const url = `${publicUrl}${getLarpHref(larp)}`;

    const locationParts = [larp.locationText, larp.municipality?.nameFi].filter(
      Boolean,
    );

    const summary = larp.isCancelled
      ? `[${prefix}] ${larp.name}`
      : larp.name;

    lines.push("BEGIN:VEVENT");
    lines.push(foldLine(`UID:${larp.id}@larpit.fi`));
    lines.push(foldLine(`SEQUENCE:${larp.updateCount}`));
    lines.push(foldLine(`DTSTAMP:${formatUtc(now)}`));
    lines.push(foldLine(`LAST-MODIFIED:${formatUtc(larp.updatedAt)}`));
    if (larp.isCancelled) lines.push("STATUS:CANCELLED");
    lines.push(foldLine(`DTSTART;VALUE=DATE:${startDate.toString().replace(/-/g, "")}`));
    lines.push(foldLine(`DTEND;VALUE=DATE:${endDate.toString().replace(/-/g, "")}`));
    lines.push(foldLine(`SUMMARY:${escapeText(summary)}`));

    if (larp.tagline) {
      lines.push(foldLine(`DESCRIPTION:${escapeText(larp.tagline)}`));
    }

    if (locationParts.length > 0) {
      lines.push(foldLine(`LOCATION:${escapeText(locationParts.join(", "))}`));
    }

    lines.push(foldLine(`URL:${url}`));
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");

  return new Response(lines.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="larpit.ics"',
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
