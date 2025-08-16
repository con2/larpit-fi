import { timezone } from "@/config";
import { Temporal } from "@js-temporal/polyfill";

export function toZonedDateTime(datetime: Date): Temporal.ZonedDateTime {
  return Temporal.Instant.fromEpochMilliseconds(
    datetime.getTime()
  ).toZonedDateTimeISO(timezone);
}

export function toPlainDate(date: Date): Temporal.PlainDate {
  return toZonedDateTime(date).toPlainDate();
}

/// Null in, null out
export function toZonedDateTimeNull(
  datetime: Date | null
): Temporal.ZonedDateTime | null {
  if (datetime === null) return null;
  return toZonedDateTime(datetime);
}

/// Null in, null out
export function toPlainDateNull(date: Date | null): Temporal.PlainDate | null {
  if (date === null) return null;
  return toZonedDateTime(date).toPlainDate();
}

export function withZonedDateTime(
  fn: (zdt: Temporal.ZonedDateTime) => Temporal.ZonedDateTime
): (dt: Date) => Date {
  return (dt: Date) => {
    const zdt = toZonedDateTime(dt);
    const newZdt = fn(zdt);
    return new Date(newZdt.toInstant().epochMilliseconds);
  };
}

/// NOTE: fn is not called if dt is null
export function withZonedDateTimeNull(
  fn: (zdt: Temporal.ZonedDateTime) => Temporal.ZonedDateTime
): (dt: Date | null) => Date | null {
  return (dt: Date | null) => {
    if (dt === null) return null;
    const zdt = toZonedDateTime(dt);
    const newZdt = fn(zdt);
    return new Date(newZdt.toInstant().epochMilliseconds);
  };
}

export const morning: Temporal.PlainTime = Temporal.PlainTime.from({
  hour: 8,
  minute: 0,
  second: 0,
});

export function fromMorning(date: Temporal.PlainDate): Date {
  return new Date(
    date
      .toZonedDateTime({
        timeZone: timezone,
        plainTime: morning,
      })
      .toInstant().epochMilliseconds
  );
}

export function fromMorningNull(date: Temporal.PlainDate | null): Date | null {
  if (date === null) return null;
  return fromMorning(date);
}

export const evening: Temporal.PlainTime = Temporal.PlainTime.from({
  hour: 20,
  minute: 0,
  second: 0,
});

export function fromEvening(date: Temporal.PlainDate): Date {
  return new Date(
    date
      .toZonedDateTime({
        timeZone: timezone,
        plainTime: evening,
      })
      .toInstant().epochMilliseconds
  );
}

export function fromEveningNull(date: Temporal.PlainDate | null): Date | null {
  if (date === null) return null;
  return fromEvening(date);
}
