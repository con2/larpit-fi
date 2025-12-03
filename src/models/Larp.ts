import {
  Larp,
  Municipality,
  RelatedUser,
  RelatedUserRole,
} from "@/generated/prisma/client";
import { ModerationRequestContent } from "./ModerationRequest";
import { string } from "zod";
import prisma from "@/prisma";
import { fromMorningNull } from "@/helpers/temporal";

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

export async function findExistingLarpsForFillIn(
  name: string,
  startsAt: Date | null
) {
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    select
      id
    from
      larp
    where
      -- only consider actual larps
      type in ('ONE_SHOT', 'CAMPAIGN_LARP')
      -- remove everything else than letters and numbers and lowercase for comparison
      and regexp_replace(lower(name), '[^a-z0-9]', '', 'g') = regexp_replace(lower(${name}), '[^a-z0-9]', '', 'g')
      -- either start date matches or start date is between existing larp's start and end date inclusive
      and (
        (starts_at is not null and starts_at::date = ${startsAt}::date)
        or
        (starts_at is not null and ends_at is not null and ${startsAt}::date >= starts_at::date and ${startsAt}::date <= ends_at::date)
      )
  `;

  return prisma.larp.findMany({
    where: {
      id: {
        in: rows.map((r) => r.id),
      },
    },
  });
}

/// enhanced upsert for use with importing external sources
export async function createLarpOrFillInMissingDetails(
  // we use this class for convenience, not really a moderation request though
  content: ModerationRequestContent
) {
  const existingLarps = await findExistingLarpsForFillIn(
    content.name,
    fromMorningNull(content.startsAt)
  );
}
