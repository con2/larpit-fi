import { toZonedDateTime, type DateTimeValue } from "@con2/components/helpers";
import { Temporal } from "@js-temporal/polyfill";
import { Fragment } from "react";

import { dateRangeParts, formatDate, formatDateTime } from "@/helpers/dates";

// Use these instead of the date components of @con2/components, which render English dates as
// ISO 8601; larp.fi writes them as 27 Feb 2027.

type DateLike = Date | Temporal.PlainDate | string;

export function FormattedDate({
  locale,
  date,
}: {
  locale: string;
  date: DateLike | null | undefined;
}) {
  if (!date) return null;
  return <time dateTime={toIso(date)}>{formatDate(date, locale)}</time>;
}

function toIso(date: DateLike): string {
  return date instanceof Temporal.PlainDate
    ? date.toString()
    : toZonedDateTime(date).toPlainDate().toString();
}

export function FormattedDateRange({
  locale,
  start,
  end,
}: {
  locale: string;
  start: DateLike | null | undefined;
  end: DateLike | null | undefined;
}) {
  const { parts, separator } = dateRangeParts(start, end, locale);
  return (
    <>
      {parts.map((part, index) => (
        <Fragment key={index}>
          {index > 0 && separator}
          <time dateTime={part.date.toString()} className="text-nowrap">
            {part.text}
          </time>
        </Fragment>
      ))}
    </>
  );
}

export function FormattedDateTime({
  locale,
  value,
  includeWeekday = false,
}: {
  locale: string;
  value: DateTimeValue | null | undefined;
  includeWeekday?: boolean;
}) {
  if (!value) return null;
  return (
    <time dateTime={toZonedDateTime(value).toString()}>
      {formatDateTime(value, locale, includeWeekday)}
    </time>
  );
}
