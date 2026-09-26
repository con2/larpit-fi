/**
 * Client-safe Larp helpers.
 * This file only imports types from the database layer, so client components can use it.
 */
import {
  fromEveningNull,
  fromJustBeforeMidnightNull,
  fromMorningNull,
} from "@con2/components/helpers";
import { Temporal } from "@js-temporal/polyfill";

import type { Larp } from "@/prisma/models";

type LarpDates = Pick<
  Larp,
  "signupStartsAt" | "signupEndsAt" | "startsAt" | "endsAt"
>;

function plainDate(date: string | null): Temporal.PlainDate | null {
  return date ? Temporal.PlainDate.from(date) : null;
}

// Larp dates are calendar days. Anything that compares them to the current time uses the same
// instants the days were stored as before they became plain dates: a larp starts in the morning
// and ends in the evening, sign-up opens in the evening and closes just before midnight.

export function larpStartsAt(larp: Pick<Larp, "startsAt">): Date | null {
  return fromMorningNull(plainDate(larp.startsAt));
}

export function ensureEndsAt(
  larp: Pick<Larp, "startsAt" | "endsAt">,
): Date | null {
  return (
    fromEveningNull(plainDate(larp.endsAt)) ??
    fromEveningNull(plainDate(larp.startsAt))
  );
}

export function signupStartsAt(
  larp: Pick<Larp, "signupStartsAt">,
): Date | null {
  return fromEveningNull(plainDate(larp.signupStartsAt));
}

/** An unbounded sign-up closes when the larp starts. */
export function signupEndsAt(
  larp: Pick<Larp, "signupEndsAt" | "startsAt">,
): Date | null {
  return (
    fromJustBeforeMidnightNull(plainDate(larp.signupEndsAt)) ??
    larpStartsAt(larp)
  );
}

export function isSignupOpen(larp: LarpDates): boolean {
  const now = new Date();
  const opensAt = signupStartsAt(larp);
  const closesAt = signupEndsAt(larp);

  return !!(opensAt && opensAt <= now && (!closesAt || closesAt >= now));
}

export function isSignupOpeningSoon(
  larp: LarpDates,
  deltaDays: number = 14,
): boolean {
  const now = new Date();
  const soon = new Date(now.getTime() + deltaDays * 24 * 60 * 60 * 1000);
  const opensAt = signupStartsAt(larp);
  return !!(opensAt && opensAt > now && opensAt < soon);
}

export function isSignupOpenOrOpeningSoon(
  larp: LarpDates,
  deltaDays: number = 14,
): boolean {
  return isSignupOpen(larp) || isSignupOpeningSoon(larp, deltaDays);
}

export function isSignupOver(larp: LarpDates): boolean {
  const now = new Date();
  const closesAt = fromJustBeforeMidnightNull(plainDate(larp.signupEndsAt));

  return !!(closesAt && closesAt < now);
}

export function getLarpHref(larp: Pick<Larp, "id" | "alias">): string {
  return larp.alias ? `/${larp.alias}` : `/larp/${larp.id}`;
}
