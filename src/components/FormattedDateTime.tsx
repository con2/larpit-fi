import { Temporal } from "@js-temporal/polyfill";
import { toZonedDateTime } from "@/helpers/temporal";

/// NOTE: scope and session are non-? but |undefined by design so that omitting them is a conscious decision
interface Props {
  locale: string;
  value:
    | Date
    | Temporal.Instant
    | Temporal.ZonedDateTime
    | string
    | null
    | undefined;
  options?: Intl.DateTimeFormatOptions;
}

const options: Intl.DateTimeFormatOptions = {
  dateStyle: "medium",
  timeStyle: "short",
};

// TODO(#436) proper handling of event & session time zones
export default function FormattedDateTime({ value, locale = "en" }: Props) {
  if (!value) {
    return <></>;
  }
  value = toZonedDateTime(value);
  const formatted = value.toLocaleString(locale, options);
  const isoFormat = value.toString();
  return <time dateTime={isoFormat}>{formatted}</time>;
}
