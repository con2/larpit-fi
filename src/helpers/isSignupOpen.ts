import { Larp } from "@/generated/prisma";

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
