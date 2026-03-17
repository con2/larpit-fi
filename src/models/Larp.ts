import type {
  Larp,
  Municipality,
  RelatedUser,
  User,
} from "@/generated/prisma/client";
import { EditAction, EditStatus, RelatedUserRole, SubmitterRole } from "@/generated/prisma/client";
import {
  approveRequest,
  larpToContent,
  ModerationRequestContent,
} from "./ModerationRequest";
import { fromMorningNull } from "@/helpers/temporal";
import prisma from "@/prisma";

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
  },
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
  startsAt: Date | null,
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

export type ImportAction =
  | { kind: "create"; content: ModerationRequestContent }
  | {
      kind: "update";
      larpId: string;
      name: string;
      fields: Partial<ModerationRequestContent>;
    }
  | { kind: "skip"; name: string; reason: "ambiguous_match"; candidates: number }
  | { kind: "skip"; name: string; reason: "already_complete" };

function isFieldEmpty(value: unknown): boolean {
  return value === null || value === undefined || value === "";
}

function getFieldsToFill(
  existing: ModerationRequestContent,
  incoming: ModerationRequestContent,
): Partial<ModerationRequestContent> {
  const fields: Partial<ModerationRequestContent> = {};
  const fillableKeys: (keyof ModerationRequestContent)[] = [
    "tagline",
    "openness",
    "fluffText",
    "description",
    "locationText",
    "municipality",
    "numPlayerCharacters",
    "numTotalParticipants",
    "startsAt",
    "endsAt",
    "signupStartsAt",
    "signupEndsAt",
  ];

  for (const key of fillableKeys) {
    const existingVal = existing[key];
    const incomingVal = incoming[key];
    if (isFieldEmpty(existingVal) && !isFieldEmpty(incomingVal)) {
      (fields as Record<string, unknown>)[key] = incomingVal;
    }
  }

  return fields;
}

/// enhanced upsert for use with importing external sources
export async function createLarpOrFillInMissingDetails(
  // we use this class for convenience, not really a moderation request though
  content: ModerationRequestContent,
): Promise<ImportAction> {
  const existingLarps = await findExistingLarpsForFillIn(
    content.name,
    fromMorningNull(content.startsAt),
  );

  if (existingLarps.length === 0) {
    return { kind: "create", content };
  }

  if (existingLarps.length > 1) {
    return {
      kind: "skip",
      name: content.name,
      reason: "ambiguous_match",
      candidates: existingLarps.length,
    };
  }

  const existingLarp = existingLarps[0];
  const existingContent = larpToContent(existingLarp);
  const fields = getFieldsToFill(existingContent, content);

  if (Object.keys(fields).length === 0) {
    return { kind: "skip", name: content.name, reason: "already_complete" };
  }

  return {
    kind: "update",
    larpId: existingLarp.id,
    name: existingLarp.name,
    fields,
  };
}

export async function executeImportAction(
  action: ImportAction,
  user: Pick<User, "id" | "name" | "email" | "role">,
  message: string,
): Promise<string | null> {
  if (action.kind === "skip") {
    return null;
  }

  const status = EditStatus.APPROVED;

  if (action.kind === "create") {
    const request = await prisma.moderationRequest.create({
      data: {
        action: EditAction.CREATE,
        status,
        submitterId: user.id,
        submitterName: user.name || "",
        submitterEmail: user.email,
        submitterRole: SubmitterRole.NONE,
        message,
        newContent: action.content,
      },
    });
    const larp = await approveRequest(request, user, message, status);
    return larp.id;
  } else {
    const request = await prisma.moderationRequest.create({
      data: {
        action: EditAction.UPDATE,
        status,
        larpId: action.larpId,
        submitterId: user.id,
        submitterName: user.name || "",
        submitterEmail: user.email,
        submitterRole: SubmitterRole.NONE,
        message,
        newContent: action.fields,
      },
    });
    const larp = await approveRequest(request, user, message, status);
    return larp.id;
  }
}
