import { timezone } from "@/config";
import { Temporal } from "@js-temporal/polyfill";

function formatDate(date: Date, locale: string): string {
  const dateTime = Temporal.Instant.fromEpochMilliseconds(date.getTime())
    .toZonedDateTimeISO(timezone)
    .toPlainDate();
  return dateTime.toLocaleString(locale, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
}

function isoDate(date: Date): string {
  return Temporal.Instant.fromEpochMilliseconds(date.getTime())
    .toZonedDateTimeISO(timezone)
    .toPlainDate()
    .toString();
}

interface Props {
  locale: string;
  date: Date;
}

export function FormattedDate({ locale, date }: Props) {
  return <time dateTime={isoDate(date)}>{formatDate(date, locale)}</time>;
}
