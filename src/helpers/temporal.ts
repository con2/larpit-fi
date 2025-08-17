import { timezone } from "@/config";
import { Temporal } from "@js-temporal/polyfill";

export function toZonedDateTime(
  value: Temporal.ZonedDateTime | Temporal.Instant | Date | string
): Temporal.ZonedDateTime {
  if (value instanceof Temporal.ZonedDateTime) {
    return value;
  }
  if (value instanceof Date) {
    value = Temporal.Instant.fromEpochMilliseconds(value.getTime());
  }
  if (typeof value === "string") {
    value = Temporal.Instant.from(value);
  }
  return value.toZonedDateTimeISO(timezone);
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

export function fromMorningNull(
  date: Temporal.PlainDate | null | undefined
): Date | null {
  if (!date) return null;
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

export function fromEveningNull(
  date: Temporal.PlainDate | null | undefined
): Date | null {
  if (!date) return null;
  return fromEvening(date);
}

export const justBeforeMidnight: Temporal.PlainTime = Temporal.PlainTime.from({
  hour: 23,
  minute: 59,
  second: 59,
});

export function fromJustBeforeMidnight(date: Temporal.PlainDate): Date {
  return new Date(
    date
      .toZonedDateTime({
        timeZone: timezone,
        plainTime: justBeforeMidnight,
      })
      .toInstant().epochMilliseconds
  );
}

export function fromJustBeforeMidnightNull(
  date: Temporal.PlainDate | null | undefined
): Date | null {
  if (!date) return null;
  return fromJustBeforeMidnight(date);
}

export function uuid7ToInstant(uuid: string): Temporal.Instant {
  const parts = uuid.split("-");
  const highBitsHex = parts[0] + parts[1].slice(0, 4);
  const timestampInMilliseconds = parseInt(highBitsHex, 16);
  return Temporal.Instant.fromEpochMilliseconds(timestampInMilliseconds);
}

export function uuid7ToZonedDateTime(uuid: string): Temporal.ZonedDateTime {
  return uuid7ToInstant(uuid).toZonedDateTimeISO(timezone);
}
