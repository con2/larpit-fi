import {
  defaultTimezone,
  formatTimeOfDay,
  formatWeekdayAbbreviation,
  toPlainDate,
  toZonedDateTime,
  type DateTimeValue,
} from "@con2/components/helpers";
import { Temporal } from "@js-temporal/polyfill";

type DateLike = Date | Temporal.PlainDate | string;

function usesDottedDates(locale: string) {
  return locale !== "en";
}

const englishMonths = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function dayMonth(date: Temporal.PlainDate, locale: string): string {
  if (usesDottedDates(locale)) return `${date.day}.${date.month}.`;
  return `${date.day} ${englishMonths[date.month - 1]}`;
}

/** 27.2.2027 in Finnish and Swedish, 27 Feb 2027 in English. */
export function formatDate(date: DateLike, locale: string): string {
  const day = toPlainDate(date);
  return usesDottedDates(locale)
    ? `${day.day}.${day.month}.${day.year}`
    : `${dayMonth(day, locale)} ${day.year}`;
}

export interface DateRangePart {
  date: Temporal.PlainDate;
  text: string;
}

/**
 * A date range as one or two parts joined by `separator`, sharing the month and year where the
 * endpoints do: 16.–18.4.2027 and 16–18 Apr 2027, 30.11.–2.12.2027 and 30 Nov – 2 Dec 2027.
 */
export function dateRangeParts(
  start: DateLike | null | undefined,
  end: DateLike | null | undefined,
  locale: string,
): { parts: DateRangePart[]; separator: string } {
  const startDate = start ? toPlainDate(start) : null;
  const endDate = end ? toPlainDate(end) : null;
  const dotted = usesDottedDates(locale);
  const whole = (date: Temporal.PlainDate) => ({
    date,
    text: formatDate(date, locale),
  });

  if (!startDate || !endDate || startDate.equals(endDate)) {
    const single = startDate ?? endDate;
    return { parts: single ? [whole(single)] : [], separator: "" };
  }

  const sameYear = startDate.year === endDate.year;
  const sameMonth = sameYear && startDate.month === endDate.month;
  // Spaces around the dash only where an endpoint has spaces of its own; the non-breaking one
  // keeps the dash from starting a line.
  const separator = dotted || sameMonth ? "–" : "\u00a0– ";

  if (!sameYear) {
    return { parts: [whole(startDate), whole(endDate)], separator };
  }

  const startText = sameMonth
    ? dotted
      ? `${startDate.day}.`
      : `${startDate.day}`
    : dayMonth(startDate, locale);
  return {
    parts: [{ date: startDate, text: startText }, whole(endDate)],
    separator,
  };
}

export function formatDateRange(
  start: DateLike | null | undefined,
  end: DateLike | null | undefined,
  locale: string,
): string {
  const { parts, separator } = dateRangeParts(start, end, locale);
  return parts.map((part) => part.text).join(separator);
}

/** A point in time in Europe/Helsinki: 27.2.2027 18:00 or 27 Feb 2027 18:00. */
export function formatDateTime(
  value: DateTimeValue,
  locale: string,
  includeWeekday = false,
): string {
  const zdt = toZonedDateTime(value, defaultTimezone);
  const weekday = includeWeekday
    ? `${formatWeekdayAbbreviation(zdt, locale)} `
    : "";
  return `${weekday}${formatDate(zdt.toPlainDate(), locale)} ${formatTimeOfDay(zdt)}`;
}

/**
 * A date or range without the year, for rows grouped under a year or within the coming weeks:
 * 6.–7.11. in Finnish and Swedish, 6–7 Nov in English.
 */
export function formatShortDateRange(
  start: DateLike | null | undefined,
  end: DateLike | null | undefined,
  locale: string,
): string {
  if (!start) return "";
  const startDate = toPlainDate(start);
  const endDate = end ? toPlainDate(end) : null;

  if (!endDate || Temporal.PlainDate.compare(startDate, endDate) === 0) {
    return dayMonth(startDate, locale);
  }

  const sameMonth =
    startDate.year === endDate.year && startDate.month === endDate.month;

  if (usesDottedDates(locale)) {
    return sameMonth
      ? `${startDate.day}.–${endDate.day}.${endDate.month}.`
      : `${dayMonth(startDate, locale)}–${dayMonth(endDate, locale)}`;
  }

  return sameMonth
    ? `${startDate.day}–${dayMonth(endDate, locale)}`
    : `${dayMonth(startDate, locale)}\u00a0– ${dayMonth(endDate, locale)}`;
}

/** ISO week number and its Monday–Sunday bounds for the given day in Europe/Helsinki. */
export function isoWeekOf(date: Date | Temporal.PlainDate = new Date()) {
  const day = toPlainDate(date);
  const monday = day.subtract({ days: day.dayOfWeek - 1 });
  const sunday = monday.add({ days: 6 });
  return { week: day.weekOfYear ?? 0, monday, sunday };
}
