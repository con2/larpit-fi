import { timezone } from "@/config";
import { Temporal } from "@js-temporal/polyfill";
import { FormattedDate } from "./FormattedDate";

interface Props {
  locale: string;
  start: Date | null | undefined;
  end: Date | null | undefined;
}

function isSameDay(start: Date, end: Date): boolean {
  const startDateTime = Temporal.Instant.fromEpochMilliseconds(
    start.getTime()
  ).toZonedDateTimeISO(timezone);
  const endDateTime = Temporal.Instant.fromEpochMilliseconds(
    end.getTime()
  ).toZonedDateTimeISO(timezone);
  const startDay = startDateTime.toPlainDate();
  const endDay = endDateTime.toPlainDate();
  return startDay.equals(endDay);
}

export function FormattedDateRange({ locale, start, end }: Props) {
  if (!start || !end) {
    return <></>;
  }

  if (start && !end) {
    return <FormattedDate locale={locale} date={start} />;
  }

  if (!start && end) {
    return <FormattedDate locale={locale} date={end} />;
  }

  if (isSameDay(start, end)) {
    return <FormattedDate locale={locale} date={start} />;
  }

  return (
    <span>
      <FormattedDate locale={locale} date={start} /> –{" "}
      <FormattedDate locale={locale} date={end} />
    </span>
  );
}
