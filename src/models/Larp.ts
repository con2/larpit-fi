import { Larp, RelatedUser, RelatedUserRole } from "@/generated/prisma";

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
export default function getLarpHref(larp: Pick<Larp, "id" | "alias">): string {
  return larp.alias ? `/${larp.alias}` : `/larp/${larp.id}`;
}
export function hasEditors(larp: { relatedUsers: RelatedUser[] }): boolean {
  return larp.relatedUsers.some((user) => user.role === RelatedUserRole.EDITOR);
}
