import { timezone } from "@/config";
import { toSupportedLanguage } from "@/translations";
import { Temporal } from "@js-temporal/polyfill";

function formatDate(date: Temporal.PlainDate, locale: string): string {
  return date.toLocaleString(toSupportedLanguage(locale), {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
}

interface Props {
  locale: string;
  date: Date | Temporal.PlainDate | string | null | undefined;
}

export function FormattedDate({ locale, date }: Props) {
  if (!date) return null;

  if (typeof date === "string") {
    date = Temporal.PlainDate.from(date);
  } else if (date instanceof Date) {
    date = Temporal.Instant.fromEpochMilliseconds(date.getTime())
      .toZonedDateTimeISO(timezone)
      .toPlainDate();
  }

  return <time dateTime={date.toString()}>{formatDate(date, locale)}</time>;
}
