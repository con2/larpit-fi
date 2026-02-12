/**
 * Client-safe Larp helpers.
 * This file only uses `import type` to avoid pulling in Prisma runtime code.
 */
import type { Larp } from "@/generated/prisma/client";

type LarpDates = Pick<
  Larp,
  "signupStartsAt" | "signupEndsAt" | "startsAt" | "endsAt"
>;

export function isSignupOpen(larp: LarpDates): boolean {
  const now = new Date();

  const signupEndsAt = larp.signupEndsAt || larp.startsAt;

  return !!(
    larp.signupStartsAt &&
    larp.signupStartsAt <= now &&
    (!signupEndsAt || signupEndsAt >= now)
  );
}

export function isSignupOpeningSoon(
  larp: LarpDates,
  deltaDays: number = 7
): boolean {
  const now = new Date();
  const soon = new Date(now.getTime() + deltaDays * 24 * 60 * 60 * 1000);
  return !!(
    larp.signupStartsAt &&
    larp.signupStartsAt > now &&
    larp.signupStartsAt < soon
  );
}

export function isSignupOpenOrOpeningSoon(
  larp: LarpDates,
  deltaDays: number = 7
): boolean {
  return isSignupOpen(larp) || isSignupOpeningSoon(larp, deltaDays);
}

export function isSignupOver(larp: LarpDates): boolean {
  const now = new Date();

  return !!(larp.signupEndsAt && larp.signupEndsAt < now);
}

export default function getLarpHref(larp: Pick<Larp, "id" | "alias">): string {
  return larp.alias ? `/${larp.alias}` : `/larp/${larp.id}`;
}

export function ensureEndsAt(larp: {
  startsAt: Date | null;
  endsAt: Date | null;
}): Date | null {
  if (larp.endsAt) {
    return larp.endsAt;
  }
  if (larp.startsAt) {
    // assume ending at 8PM Europe/Helsinki same day
    const endDate = new Date(larp.startsAt);
    endDate.setHours(20, 0, 0, 0);
    return endDate;
  }
  return null;
}
