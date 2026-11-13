import { toISODateNull } from "@con2/components/helpers";
import { validate as validateUuid } from "uuid";
import { publicUrl } from "@/config";
import { parseDates } from "@/prisma/dates";
import { db, type Tx } from "@/prisma/db";
import { EditAction, EditStatus, SubmitterRole } from "@/prisma/enums";
import { toJson } from "@/prisma/json";
import type { Larp, Municipality, User } from "@/prisma/models";
import { query, sql } from "@/prisma/sql";
import { supportedLanguages } from "@/i18n/locales";
import { getLarpHref } from "./Larp.client";
import type { LarpLinkUpsertable } from "./LarpLink";
import type { RelatedLarpAddable } from "./RelatedLarp";
import {
  approveRequest,
  larpToContent,
  ModerationRequestContent,
} from "./ModerationRequest";
import { canModerate } from "./User";

// Re-export client-safe helpers for convenience
export {
  getLarpHref,
  ensureEndsAt,
  isSignupOpenOrOpeningSoon,
} from "./Larp.client";

export function getLarpUrl(larp: Parameters<typeof getLarpHref>[0]): string {
  return `${publicUrl}${getLarpHref(larp)}`;
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

// Strips a run indicator such as " (2. pelautus)" from a larp name. Kept as a string parameter
// because the sql tag cooks backslash escapes out of the template text.
const runIndicatorPattern = String.raw`\s*\(\d+\..*\)$`;

/**
 * Larps whose names match once run indicators, case and punctuation are ignored, and whose date
 * ranges overlap the given one. A missing end date means a one-day larp.
 */
export async function findLarpIdsWithSameNameAndDates(
  name: string,
  startsAt: string | null,
  endsAt: string | null,
  options: { onlyLarps: boolean; excludeId?: string },
): Promise<string[]> {
  const rows = await query<{ id: string }>(sql`
    select
      id
    from
      larp
    where
      (not ${options.onlyLarps}::boolean or type in ('ONE_SHOT', 'CAMPAIGN_LARP'))
      and (${options.excludeId ?? null}::uuid is null or id <> ${options.excludeId ?? null}::uuid)
      -- strip run indicator like "(1. pelautus)" then normalize to letters and numbers only
      and regexp_replace(lower(regexp_replace(name, ${runIndicatorPattern}, '')), '[^a-z0-9]', '', 'g')
        = regexp_replace(lower(regexp_replace(${name}, ${runIndicatorPattern}, '')), '[^a-z0-9]', '', 'g')
      -- date ranges overlap: [starts_at, coalesce(ends_at, starts_at)] overlaps [startsAt, coalesce(endsAt, startsAt)]
      and starts_at is not null
      and starts_at <= coalesce(${endsAt}::date, ${startsAt}::date)
      and ${startsAt}::date <= coalesce(ends_at, starts_at)
  `);
  return rows.map((r) => r.id);
}

export async function findExistingLarpsForFillIn(
  name: string,
  startsAt: string | null,
  endsAt: string | null,
): Promise<Larp[]> {
  const ids = await findLarpIdsWithSameNameAndDates(name, startsAt, endsAt, {
    onlyLarps: true,
  });
  if (ids.length === 0) return [];
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

export function getFieldsToFill(
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
  addLinks: LarpLinkUpsertable[] = [],
  addRelatedLarps: RelatedLarpAddable[] = [],
): Promise<string | null> {
  if (action.kind === "skip") {
    return null;
  }

  if (action.kind === "create") {
    // Approving a create request does not apply relations, and the new larp has no id to
    // relate from until it exists.
    if (addRelatedLarps.length > 0) {
      throw new Error("Relations can only be added to an existing larp");
    }
    const request = await db.orm.public.ModerationRequest.create({
      action: EditAction.CREATE,
      status: EditStatus.VERIFIED,
      submitterId: user.id,
      submitterName: user.name || "",
      submitterEmail: user.email,
      submitterRole: SubmitterRole.NONE,
      message,
      newContent: toJson(action.content),
      addLinks: toJson(addLinks),
    });
    const larp = await approveRequest(
      request,
      user,
      message,
      EditStatus.APPROVED,
    );
    return larp.id;
  } else {
    const request = await db.orm.public.ModerationRequest.create({
      action: EditAction.UPDATE,
      status: EditStatus.VERIFIED,
      larpId: action.larpId,
      submitterId: user.id,
      submitterName: user.name || "",
      submitterEmail: user.email,
      submitterRole: SubmitterRole.NONE,
      message,
      newContent: toJson(action.fields),
      addLinks: toJson(addLinks),
      addRelatedLarps: toJson(addRelatedLarps),
    });
    const larp = await approveRequest(
      request,
      user,
      message,
      EditStatus.APPROVED,
    );
    return larp.id;
  }
}

export const larpAliasMaxLength = 100;

const larpAliasPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Top-level paths that win over the `[alias]` route. Must stay in sync with the route
 * directories under `src/app/` and `src/app/[locale]/` and the matcher in `src/proxy.ts`, or a
 * larp could take an alias it can never be reached at.
 */
const reservedLarpAliases: ReadonlySet<string> = new Set([
  "api",
  "api-docs",
  "calendar",
  "contact",
  "favicon.ico",
  "healthz",
  "icon.svg",
  "larp",
  "moderate",
  "page",
  "profile",
  "search",
  "stats",
  "user",
  "verify",
  ...supportedLanguages,
]);

export type LarpAliasError =
  "invalidFormat" | "tooLong" | "reserved" | "takenByLarp" | "takenByPage";

/** Trims and lowercases an alias; an empty alias becomes null, which removes the alias. */
export function normalizeLarpAlias(alias: string | null): string | null {
  return alias?.trim().toLowerCase() || null;
}

export function validateLarpAlias(alias: string): LarpAliasError | null {
  if (alias.length > larpAliasMaxLength) return "tooLong";
  if (!larpAliasPattern.test(alias)) return "invalidFormat";
  if (reservedLarpAliases.has(alias)) return "reserved";
  return null;
}

export type LarpIdOrAliasFilter = { id: string } | { alias: string };

/** Looks a larp up by its id or, failing that, its alias; null if `key` can be neither. */
export function larpIdOrAliasFilter(key: string): LarpIdOrAliasFilter | null {
  const lowercaseKey = key.toLowerCase();
  if (validateUuid(lowercaseKey)) return { id: lowercaseKey };
  if (validateLarpAlias(lowercaseKey) === null) return { alias: lowercaseKey };
  return null;
}

function isLarpAliasUniqueViolation(error: unknown): boolean {
  const { sqlState, constraint } = (error ?? {}) as {
    sqlState?: unknown;
    constraint?: unknown;
  };
  return sqlState === "23505" && constraint === "larp_alias_key";
}

/**
 * Gives a larp a new alias within a transaction. The old alias keeps leading to the larp as a
 * redirect, and a redirect of the new alias is replaced by the larp itself.
 */
export async function changeLarpAlias(
  tx: Tx,
  larpId: string,
  oldAlias: string | null,
  newAlias: string | null,
) {
  await tx.orm.public.Larp.where({ id: larpId }).update({ alias: newAlias });
  if (!newAlias) return;

  await tx.orm.public.LarpAliasRedirect.where({ alias: newAlias }).delete();
  if (oldAlias && oldAlias !== newAlias) {
    await addLarpAliasRedirect(tx, oldAlias, larpId);
  }
}

export async function addLarpAliasRedirect(
  tx: Tx,
  alias: string,
  larpId: string,
) {
  await tx.orm.public.LarpAliasRedirect.upsert({
    create: { alias, larpId },
    update: { larpId },
    conflictOn: { alias },
  });
}

export type SetLarpAliasResult =
  | { ok: true; alias: string | null }
  | { ok: false; error: LarpAliasError | "forbidden" | "notFound" };

export interface LarpWithoutAlias {
  id: string;
  name: string;
  language: Larp["language"];
  startsAt: string | null;
  endsAt: string | null;
}

/** Larps that have no alias yet, the latest first and undated ones last. */
export async function getLarpsWithoutAlias(
  offset: number,
  limit: number,
): Promise<{ larps: LarpWithoutAlias[]; count: number }> {
  const [larps, [{ count }]] = await Promise.all([
    query<LarpWithoutAlias>(sql`
      select id, name, language, starts_at::text as "startsAt", ends_at::text as "endsAt"
      from larp
      where alias is null
      order by starts_at desc nulls last, id desc
      offset ${offset}
      limit ${limit}
    `),
    query<{ count: string }>(sql`
      select count(*) as count from larp where alias is null
    `),
  ]);
  return { larps, count: Number(count) };
}

/**
 * Sets or removes the alias of a larp. Only moderators may do this, and the change goes
 * straight to the larp without a moderation request. Changing an alias to another keeps the old
 * one as a redirect to the larp; taking an alias replaces any redirect of the same name.
 */
export async function setLarpAlias(
  user: Pick<User, "role"> | null,
  larpId: string,
  rawAlias: string | null,
): Promise<SetLarpAliasResult> {
  if (!canModerate(user)) return { ok: false, error: "forbidden" };

  const alias = normalizeLarpAlias(rawAlias);
  if (alias) {
    const error = validateLarpAlias(alias);
    if (error) return { ok: false, error };

    const [otherLarp, page] = await Promise.all([
      db.orm.public.Larp.select("id").first({ alias }),
      db.orm.public.Page.select("slug").first({ slug: alias }),
    ]);
    if (otherLarp && otherLarp.id !== larpId) {
      return { ok: false, error: "takenByLarp" };
    }
    if (page) return { ok: false, error: "takenByPage" };
  }

  let found;
  try {
    found = await db.transaction(async (tx) => {
      const larp = await tx.orm.public.Larp.select("alias").first({
        id: larpId,
      });
      if (!larp) return false;

      await changeLarpAlias(tx, larpId, larp.alias, alias);
      return true;
    });
  } catch (error) {
    if (isLarpAliasUniqueViolation(error)) {
      return { ok: false, error: "takenByLarp" };
    }
    throw error;
  }
  if (!found) return { ok: false, error: "notFound" };
  return { ok: true, alias };
}

/** The larp that a former alias of it redirects to. */
export async function findLarpByAliasRedirect(
  alias: string,
  reader: typeof db = db,
): Promise<{ id: string; alias: string | null } | null> {
  const redirect = await reader.orm.public.LarpAliasRedirect.select("larpId")
    .include("larp", (larp) => larp.select("id", "alias"))
    .first({ alias });
  return redirect?.larp ?? null;
}

/** The larp that a larp merged into it used to be. */
export async function findLarpRedirect(
  id: string,
  reader: typeof db = db,
): Promise<{ id: string; alias: string | null } | null> {
  const redirect = await reader.orm.public.LarpRedirect.select("larpId")
    .include("larp", (larp) => larp.select("id", "alias"))
    .first({ fromId: id });
  return redirect?.larp ?? null;
}
