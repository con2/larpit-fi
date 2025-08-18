import { timezone } from "@/config";
import { Temporal } from "@js-temporal/polyfill";
import z from "zod";

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

/// Null in, null out
export function toZonedDateTimeNull(
  datetime:
    | Temporal.ZonedDateTime
    | Temporal.Instant
    | Date
    | string
    | null
    | undefined
): Temporal.ZonedDateTime | null {
  if (!datetime) return null;
  return toZonedDateTime(datetime);
}

export function toPlainDate(
  date:
    | Temporal.ZonedDateTime
    | Temporal.Instant
    | Temporal.PlainDate
    | Date
    | string
): Temporal.PlainDate {
  if (date instanceof Temporal.PlainDate) {
    return date;
  }
  return toZonedDateTime(date).toPlainDate();
}

/// Null in, null out
export function toPlainDateNull(
  date:
    | Temporal.ZonedDateTime
    | Temporal.Instant
    | Temporal.PlainDate
    | Date
    | string
    | null
    | undefined
): Temporal.PlainDate | null {
  if (!date) return null;
  return toPlainDate(date);
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

export const zPlainDateNull = z
  .string()
  .nullable()
  .optional()
  .transform((val) => {
    if (!val) return null;
    return Temporal.PlainDate.from(val);
  });
