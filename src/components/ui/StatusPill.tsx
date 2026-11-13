import { FormattedDate } from "@/components/FormattedDates";
import { ReactNode } from "react";

import { formatShortDateRange } from "@/helpers/dates";
import type { Translations } from "@/translations/en";
import {
  getSignupPillState,
  type SignupPillKind,
  type SignupPillLarp,
} from "./signupPillState";

export interface SignupPill {
  kind: SignupPillKind;
  content: ReactNode;
}

/**
 * `short` drops the year from the date, as list rows do; the larp page signup card uses the long
 * form.
 */
function getSignupPill(
  larp: SignupPillLarp,
  messages: Translations["Larp"],
  locale: string,
  { short = true }: { short?: boolean } = {},
): SignupPill | null {
  const state = getSignupPillState(larp);
  if (!state) return null;

  const t = messages.attributes.signupStatus.choices;
  const date = state.date ? (
    short ? (
      <time dateTime={state.date}>
        {formatShortDateRange(state.date, null, locale)}
      </time>
    ) : (
      <FormattedDate date={state.date} locale={locale} />
    )
  ) : null;

  const content: Record<typeof state.reason, () => ReactNode> = {
    cancelled: () => t.cancelled,
    inviteOnly: () => t.inviteOnly,
    openUntil: () => (short ? t.openUntilShort : t.openUntil)(date),
    openIndefinitely: () => t.openIndefinitely,
    opens: () => (short ? t.opensShort : t.opensAt)(date),
    over: () => t.over,
  };

  return { kind: state.kind, content: content[state.reason]() };
}

interface Props {
  kind: SignupPillKind;
  children: ReactNode;
  small?: boolean;
}

export default function StatusPill({ kind, children, small }: Props) {
  return (
    <span
      className={`lf-pill lf-pill--${kind}${small ? " lf-pill--small" : ""}`}
    >
      {children}
    </span>
  );
}

export function LarpStatusPill({
  larp,
  messages,
  locale,
  small,
  short,
}: {
  larp: SignupPillLarp;
  messages: Translations["Larp"];
  locale: string;
  small?: boolean;
  short?: boolean;
}) {
  const pill = getSignupPill(larp, messages, locale, { short });
  if (!pill) return null;
  return (
    <StatusPill kind={pill.kind} small={small}>
      {pill.content}
    </StatusPill>
  );
}
