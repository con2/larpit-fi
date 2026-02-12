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

export function FormattedDateRange({
  locale,
  start,
  end,
  as: Component = "time",
}: Props) {
  if (!start && !end) {
    return <></>;
  } else if (start && !end) {
    return <FormattedDate locale={locale} date={start} as={Component} />;
  } else if (!start && end) {
    return <FormattedDate locale={locale} date={end} as={Component} />;
  }

  const startDateTime = Temporal.Instant.fromEpochMilliseconds(
    start!.getTime(),
  ).toZonedDateTimeISO(timezone);
  const endDateTime = Temporal.Instant.fromEpochMilliseconds(
    end!.getTime(),
  ).toZonedDateTimeISO(timezone);
  const startDay = startDateTime.toPlainDate();
  const endDay = endDateTime.toPlainDate();

  if (startDay.equals(endDay)) {
    return <FormattedDate locale={locale} date={start} as={Component} />;
  }

  if (locale === "fi" && startDay.year === endDay.year) {
    if (startDay.month === endDay.month) {
      // Same month and year: "1.–3.5.2024"
      return (
        <>
          <Component dateTime={startDay.toString()}>{startDay.day}.</Component>
          –
          <FormattedDate locale={locale} date={end} as={Component} />
        </>
      );
    } else {
      // Same year, different months: "28.4.–3.5.2024"
      return (
        <>
          <Component dateTime={startDay.toString()}>
            {startDay.day}.{startDay.month}.
          </Component>
          –
          <FormattedDate locale={locale} date={end} as={Component} />
        </>
      );
    }
  }

  return (
    <>
      <FormattedDate locale={locale} date={start} as={Component} />–
      <FormattedDate locale={locale} date={end} as={Component} />
    </>
  );
}
