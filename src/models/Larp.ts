import { toISODateNull } from "@con2/components/helpers";
import { publicUrl } from "@/config";
import { parseDates } from "@/prisma/dates";
import { db } from "@/prisma/db";
import {
  EditAction,
  EditStatus,
  RelatedUserRole,
  SubmitterRole,
} from "@/prisma/enums";
import { toJson } from "@/prisma/json";
import type { Larp, Municipality, RelatedUser, User } from "@/prisma/models";
import { query, sql } from "@/prisma/sql";
import { getLarpHref } from "./Larp.client";
import {
  approveRequest,
  larpToContent,
  ModerationRequestContent,
} from "./ModerationRequest";

// Re-export client-safe helpers for convenience
export {
  getLarpHref,
  ensureEndsAt,
  isSignupOpen,
  isSignupOpeningSoon,
  isSignupOpenOrOpeningSoon,
  isSignupOver,
} from "./Larp.client";

export function getLarpUrl(larp: Parameters<typeof getLarpHref>[0]): string {
  return `${publicUrl}${getLarpHref(larp)}`;
}

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
  startsAt: string | null,
  endsAt: string | null,
): Promise<Larp[]> {
  const rows = await query<{ id: string }>(sql`
    select
      id
    from
      larp
    where
      -- only consider actual larps
      type in ('ONE_SHOT', 'CAMPAIGN_LARP')
      -- strip run indicator like "(1. pelautus)" then normalize to letters and numbers only
      and regexp_replace(lower(regexp_replace(name, '\s*\(\d+\..*\)$', '')), '[^a-z0-9]', '', 'g')
        = regexp_replace(lower(regexp_replace(${name}, '\s*\(\d+\..*\)$', '')), '[^a-z0-9]', '', 'g')
      -- date ranges overlap: [starts_at, coalesce(ends_at, starts_at)] overlaps [startsAt, coalesce(endsAt, startsAt)]
      -- null end date means one-day larp (end = start)
      and starts_at is not null
      and starts_at <= coalesce(${endsAt}::date, ${startsAt}::date)
      and ${startsAt}::date <= coalesce(ends_at, starts_at)
  `);
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  return parseDates(await db.orm.public.Larp.where((l) => l.id.in(ids)).all());
}

export type ImportAction =
  | { kind: "create"; content: ModerationRequestContent }
  | {
      kind: "update";
      larpId: string;
      name: string;
      fields: Partial<ModerationRequestContent>;
    }
  | {
      kind: "skip";
      name: string;
      reason: "ambiguous_match";
      candidates: number;
    }
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
    toISODateNull(content.startsAt),
    toISODateNull(content.endsAt),
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
    const request = await db.orm.public.ModerationRequest.create({
      action: EditAction.CREATE,
      status,
      submitterId: user.id,
      submitterName: user.name || "",
      submitterEmail: user.email,
      submitterRole: SubmitterRole.NONE,
      message,
      newContent: toJson(action.content),
    });
    const larp = await approveRequest(request, user, message, status);
    return larp.id;
  } else {
    const request = await db.orm.public.ModerationRequest.create({
      action: EditAction.UPDATE,
      status,
      larpId: action.larpId,
      submitterId: user.id,
      submitterName: user.name || "",
      submitterEmail: user.email,
      submitterRole: SubmitterRole.NONE,
      message,
      newContent: toJson(action.fields),
    });
    const larp = await approveRequest(request, user, message, status);
    return larp.id;
  }
}
