import { not } from "@prisma/orm-postgres/orm-client";

import { deleteHeaderImage } from "@/models/HeaderImage";
import { iso, parseDates } from "@/prisma/dates";
import { db, type Tx } from "@/prisma/db";
import { EditAction, EditStatus, SubmitterRole } from "@/prisma/enums";
import { toJson } from "@/prisma/json";
import type { Row, User } from "@/prisma/models";

import {
  addLarpAliasRedirect,
  changeLarpAlias,
  findLarpIdsWithSameNameAndDates,
} from "./Larp";
import {
  diffLarps,
  type MergeableField,
  type MergeableLarp,
  type MergeChoices,
  type MergeFieldDiff,
  mergeableFields,
  type MergeLink,
  resolveMergeSides,
  unionLinks,
} from "./LarpMerge.client";
import { diffLarpContent, larpToContent } from "./ModerationRequest";
import { canModerate } from "./User";

const mergeLarpColumns = [
  "id",
  "updateCount",
  "updatedAt",
  ...mergeableFields,
] as const;

type MergeLarpRow = Pick<Row<"Larp">, (typeof mergeLarpColumns)[number]>;

export interface MergeCandidate {
  id: string;
  name: string;
  alias: string | null;
  startsAt: string | null;
  endsAt: string | null;
}

/** Larps that look like duplicates of this one: the same name and overlapping dates. */
export async function findMergeCandidates(
  larp: Pick<Row<"Larp">, "id" | "name" | "startsAt" | "endsAt">,
): Promise<MergeCandidate[]> {
  if (!larp.startsAt) return [];
  const ids = await findLarpIdsWithSameNameAndDates(
    larp.name,
    larp.startsAt,
    larp.endsAt,
    { onlyLarps: false, excludeId: larp.id },
  );
  if (ids.length === 0) return [];
  return db.orm.public.Larp.select("id", "name", "alias", "startsAt", "endsAt")
    .where((l) => l.id.in(ids))
    .orderBy((l) => l.name.asc())
    .all();
}

export interface MergePreview {
  a: MergeLarpRow;
  b: MergeLarpRow;
  diff: MergeFieldDiff[];
  links: MergeLink[];
}

function loadMergeLarp(id: string) {
  return db.orm.public.Larp.select(...mergeLarpColumns)
    .include("links", (l) =>
      l.select("id", "type", "href", "title").orderBy((l) => l.id.asc()),
    )
    .first({ id });
}

export async function getMergePreview(
  aId: string,
  bId: string,
): Promise<MergePreview | null> {
  if (aId === bId) return null;
  const [aRow, bRow] = await Promise.all([
    loadMergeLarp(aId),
    loadMergeLarp(bId),
  ]);
  if (!aRow || !bRow) return null;
  const { links: aLinks, ...a } = aRow;
  const { links: bLinks, ...b } = bRow;
  return {
    a,
    b,
    diff: diffLarps(a, b),
    links: unionLinks(aLinks, bLinks),
  };
}

export type MergeLarpsError =
  "forbidden" | "sameLarp" | "notFound" | "stale" | "undecided";

export type MergeLarpsResult =
  | { ok: true; larp: { id: string; alias: string | null } }
  | { ok: false; error: MergeLarpsError };

function isFresh(
  row: MergeLarpRow,
  updateCount: number,
  updatedAt: string,
): boolean {
  return (
    row.updateCount === updateCount &&
    new Date(row.updatedAt).getTime() === new Date(updatedAt).getTime()
  );
}

function asLarpContent(row: MergeableLarp) {
  return larpToContent(parseDates(row as MergeLarpRow));
}

async function mergeRelatedRows(tx: Tx, aId: string, bId: string) {
  const run = (q: ReturnType<typeof tx.raw.sql>) =>
    tx.execute(q.affectedCount().build());

  // Visibility and the date of the mark stay as on A when a user has the same role on both.
  await run(tx.raw.sql`
    insert into related_user (larp_id, user_id, role, visibility, created_at)
    select ${aId}::uuid, user_id, role, visibility, created_at
    from related_user
    where larp_id = ${bId}::uuid
    on conflict (larp_id, user_id, role) do nothing
  `);

  await run(tx.raw.sql`
    delete from related_larp
    where (left_id = ${aId}::uuid and right_id = ${bId}::uuid)
      or (left_id = ${bId}::uuid and right_id = ${aId}::uuid)
  `);
  // A relation between A and another larp in either direction wins over B's relation to it.
  await run(tx.raw.sql`
    insert into related_larp (left_id, right_id, type)
    select ${aId}::uuid, b.right_id, b.type
    from related_larp b
    where b.left_id = ${bId}::uuid
      and not exists (
        select 1 from related_larp a
        where (a.left_id = ${aId}::uuid and a.right_id = b.right_id)
          or (a.left_id = b.right_id and a.right_id = ${aId}::uuid)
      )
  `);
  await run(tx.raw.sql`
    insert into related_larp (left_id, right_id, type)
    select b.left_id, ${aId}::uuid, b.type
    from related_larp b
    where b.right_id = ${bId}::uuid
      and not exists (
        select 1 from related_larp a
        where (a.left_id = ${aId}::uuid and a.right_id = b.left_id)
          or (a.left_id = b.left_id and a.right_id = ${aId}::uuid)
      )
  `);

  // Pending requests move along, so that they are reviewed against the surviving larp.
  await run(tx.raw.sql`
    update moderation_request set larp_id = ${aId}::uuid where larp_id = ${bId}::uuid
  `);
  await run(tx.raw.sql`
    update moderation_request
    set
      add_related_larps = replace(add_related_larps::text, ${bId}, ${aId})::jsonb,
      remove_related_larps = replace(remove_related_larps::text, ${bId}, ${aId})::jsonb
    where status in ('PENDING_VERIFICATION', 'VERIFIED')
      and (add_related_larps::text like ${`%${bId}%`}
        or remove_related_larps::text like ${`%${bId}%`})
  `);

  // The partial unique indexes allow one pending and one verified signup per email and larp.
  await run(tx.raw.sql`
    update unauthenticated_signup b
    set larp_id = ${aId}::uuid
    where b.larp_id = ${bId}::uuid
      and not exists (
        select 1 from unauthenticated_signup a
        where a.larp_id = ${aId}::uuid
          and a.email = b.email
          and (a.verified_at is null) = (b.verified_at is null)
      )
  `);

  await run(tx.raw.sql`
    update larp_alias_redirect set larp_id = ${aId}::uuid where larp_id = ${bId}::uuid
  `);
  await run(tx.raw.sql`
    update larp_redirect set larp_id = ${aId}::uuid where larp_id = ${bId}::uuid
  `);
  await tx.orm.public.LarpRedirect.create({ fromId: bId, larpId: aId });
}

async function mergeLinks(
  tx: Tx,
  aId: string,
  bId: string,
  keepLinkIds: string[],
) {
  if (keepLinkIds.length > 0) {
    await tx.orm.public.LarpLink.where({ larpId: bId })
      .where((l) => l.id.in(keepLinkIds))
      .updateAndCount({ larpId: aId });
    await tx.orm.public.LarpLink.where({ larpId: aId })
      .where((l) => not(l.id.in(keepLinkIds)))
      .deleteAndCount();
  } else {
    await tx.orm.public.LarpLink.where({ larpId: aId }).deleteAndCount();
  }
}

/**
 * Folds larp B into larp A: A takes the chosen field values and gains B's links, people,
 * relations, requests and signups, and B's id and aliases redirect to A. Records the merge as an
 * approved MERGE request on A.
 */
export async function mergeLarps(
  moderator: Pick<User, "id" | "name" | "email" | "role">,
  aId: string,
  bId: string,
  choices: MergeChoices,
  describeMerge: (mergedLarp: { id: string; name: string }) => string,
): Promise<MergeLarpsResult> {
  if (!canModerate(moderator)) return { ok: false, error: "forbidden" };
  if (aId === bId) return { ok: false, error: "sameLarp" };

  const result = await db.transaction(async (tx) => {
    const rows = await tx.orm.public.Larp.select(...mergeLarpColumns)
      .where((l) => l.id.in([aId, bId]))
      .orderBy((l) => l.id.asc())
      .forUpdate()
      .all();
    const a = rows.find((row) => row.id === aId);
    const b = rows.find((row) => row.id === bId);
    if (!a || !b) return { ok: false, error: "notFound" } as const;
    if (
      !isFresh(a, choices.aUpdateCount, choices.aUpdatedAt) ||
      !isFresh(b, choices.bUpdateCount, choices.bUpdatedAt)
    ) {
      return { ok: false, error: "stale" } as const;
    }

    const sides = resolveMergeSides(diffLarps(a, b), choices);
    if (!sides) return { ok: false, error: "undecided" } as const;

    const merged: MergeableLarp = { ...a };
    for (const [field, side] of Object.entries(sides) as [
      MergeableField,
      "a" | "b",
    ][]) {
      if (side === "b") merged[field] = b[field];
    }
    if (choices.customName) merged.name = choices.customName;

    await mergeRelatedRows(tx, aId, bId);
    await mergeLinks(tx, aId, bId, choices.keepLinkIds);

    await tx.orm.public.Larp.where({ id: bId }).delete();

    if (merged.alias !== a.alias) {
      await changeLarpAlias(tx, aId, a.alias, merged.alias as string | null);
    } else if (b.alias) {
      await addLarpAliasRedirect(tx, b.alias, aId);
    }

    const { alias: _alias, ...columns } = merged;
    await tx.orm.public.Larp.where({ id: aId }).update({
      ...(columns as Omit<MergeLarpRow, "alias" | "id" | "updateCount">),
      updatedAt: iso(new Date()),
      updateCount: a.updateCount + 1,
    });

    const now = iso(new Date());
    await tx.orm.public.ModerationRequest.create({
      action: EditAction.MERGE,
      status: EditStatus.APPROVED,
      larpId: aId,
      submitterId: moderator.id,
      submitterName: moderator.name || "",
      submitterEmail: moderator.email,
      submitterRole: SubmitterRole.NONE,
      verificationCode: null,
      verifiedAt: now,
      resolvedById: moderator.id,
      resolvedAt: now,
      message: describeMerge({ id: bId, name: b.name }),
      newContent: toJson(
        diffLarpContent(asLarpContent(a), asLarpContent(merged)),
      ),
    });

    const discardedHeaderImageId =
      merged.headerImageId === a.headerImageId
        ? b.headerImageId
        : a.headerImageId;
    return {
      ok: true,
      larp: { id: aId, alias: merged.alias as string | null },
      discardedHeaderImageId: discardedHeaderImageId as string | null,
      bName: b.name,
    } as const;
  });

  if (!result.ok) return result;

  if (result.discardedHeaderImageId) {
    await deleteHeaderImage(result.discardedHeaderImageId);
  }
  console.log(
    "AUDIT",
    JSON.stringify({
      action: "mergeLarps",
      moderatorId: moderator.id,
      larpId: aId,
      mergedLarpId: bId,
      mergedLarpName: result.bName,
    }),
  );
  return { ok: true, larp: result.larp };
}
