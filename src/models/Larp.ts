import {
  Larp,
  Municipality,
  RelatedUser,
  RelatedUserRole,
} from "@/generated/prisma";

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

export function ensureLocation(
  larp: Pick<Larp, "locationText" | "language"> & {
    municipality: Pick<
      Municipality,
      "nameFi" | "nameOther" | "nameOtherLanguageCode"
    > | null;
  }
): { location: string; language: string } | null {
  if (larp.locationText && larp.municipality) {
    const location = `${larp.locationText}, ${larp.municipality.nameFi}`;
    return { location, language: larp.language };
  } else if (larp.locationText) {
    return { location: larp.locationText, language: larp.language };
  } else if (larp.municipality) {
    if (larp.municipality.nameFi) {
      return { location: larp.municipality.nameFi, language: "fi" as const };
    } else if (
      larp.municipality.nameOther &&
      larp.municipality.nameOtherLanguageCode
    ) {
      return {
        location: larp.municipality.nameOther,
        language: larp.municipality.nameOtherLanguageCode,
      };
    }
  }
  return null;
}
