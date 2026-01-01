import { timezone } from "@/config";
import { Temporal } from "@js-temporal/polyfill";
import { FormattedDate } from "./FormattedDate";

interface Props {
  locale: string;
  start: Date | null | undefined;
  end: Date | null | undefined;
  /// passed as-is to FormattedDate
  /// pass React.Fragment to avoid wrapping in <time>
  /// useful eg. inside <option> elements
  as?: React.ElementType;
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

export function FormattedDateRange({
  locale,
  start,
  end,
  as: Component = "time",
}: Props) {
  if (start && !end) {
    return <FormattedDate locale={locale} date={start} as={Component} />;
  } else if (!start && end) {
    return <FormattedDate locale={locale} date={end} as={Component} />;
  } else if (start && end) {
    if (isSameDay(start, end)) {
      return <FormattedDate locale={locale} date={start} as={Component} />;
    } else {
      return (
        <>
          <FormattedDate locale={locale} date={start} as={Component} /> –{" "}
          <FormattedDate locale={locale} date={end} as={Component} />
        </>
      );
    }
  } else {
    return <></>;
  }
}
