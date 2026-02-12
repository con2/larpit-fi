import type {
  Larp,
  Municipality,
  RelatedUser,
} from "@/generated/prisma/client";
import { RelatedUserRole } from "@/generated/prisma/client";

// Re-export client-safe helpers for convenience
export {
  default,
  ensureEndsAt,
  isSignupOpen,
  isSignupOpeningSoon,
  isSignupOpenOrOpeningSoon,
  isSignupOver,
} from "./Larp.client";

export function hasEditors(larp: { relatedUsers: RelatedUser[] }): boolean {
  return larp.relatedUsers.some((user) => user.role === RelatedUserRole.EDITOR);
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
