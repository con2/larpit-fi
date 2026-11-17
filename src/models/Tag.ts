import z from "zod";

import { iso } from "@/prisma/dates";
import { db, type Tx } from "@/prisma/db";
import type { getReader } from "@/prisma/reader";
import { sql } from "@/prisma/sql";
import {
  type TagSummary,
  tagSlugMaxLength,
  tagSlugPattern,
} from "./Tag.client";

type Reader = Pick<Awaited<ReturnType<typeof getReader>>, "query">;

// Text is stored in Unicode NFC, as on larps (see ModerationRequestContent).
export const TagForm = z.object({
  slug: z.string().trim().toLowerCase().max(tagSlugMaxLength),
  nameFi: z.string().normalize().trim().min(1).max(100),
  nameEn: z.string().normalize().trim().min(1).max(100),
  descriptionFi: z.string().normalize().trim().max(2000).default(""),
  descriptionEn: z.string().normalize().trim().max(2000).default(""),
});

export type TagForm = z.infer<typeof TagForm>;

export const TagIds = z.array(z.uuid());

export type TagError = "invalidSlug" | "slugTaken" | "slugLocked" | "notFound";

export type TagResult =
  | { ok: true; tag: { id: string; slug: string } }
  | { ok: false; error: TagError };

interface TagSummaryRow extends Omit<TagSummary, "larpCount"> {
  larpCount: string;
}

/** Every tag with the number of larps that have it, oldest first. */
export async function getTagsWithCounts(reader: Reader): Promise<TagSummary[]> {
  const rows = await reader.query<TagSummaryRow>(sql`
    select
      t.id,
      t.slug,
      t.name_fi as "nameFi",
      t.name_en as "nameEn",
      t.description_fi as "descriptionFi",
      t.description_en as "descriptionEn",
      count(lt.larp_id) as "larpCount"
    from tag t
    left join larp_tag lt on lt.tag_id = t.id
    group by t.id
    order by t.id
  `);
  return rows.map((row) => ({ ...row, larpCount: Number(row.larpCount) }));
}

export async function getTagBySlug(
  reader: Reader,
  slug: string,
): Promise<TagSummary | null> {
  const [row] = await reader.query<TagSummaryRow>(sql`
    select
      t.id,
      t.slug,
      t.name_fi as "nameFi",
      t.name_en as "nameEn",
      t.description_fi as "descriptionFi",
      t.description_en as "descriptionEn",
      (select count(*) from larp_tag lt where lt.tag_id = t.id) as "larpCount"
    from tag t
    where t.slug = ${slug}
  `);
  return row ? { ...row, larpCount: Number(row.larpCount) } : null;
}

export interface LarpTagChip {
  id: string;
  slug: string;
  nameFi: string;
  nameEn: string;
}

/** The tags of each of the given larps, keyed by larp id. Larps without tags are left out. */
export async function getTagsOfLarps(
  reader: Reader,
  larpIds: string[],
): Promise<Map<string, LarpTagChip[]>> {
  const result = new Map<string, LarpTagChip[]>();
  if (larpIds.length === 0) return result;

  const rows = await reader.query<LarpTagChip & { larpId: string }>(sql`
    select
      lt.larp_id as "larpId",
      t.id,
      t.slug,
      t.name_fi as "nameFi",
      t.name_en as "nameEn"
    from larp_tag lt
    join tag t on t.id = lt.tag_id
    where lt.larp_id = any(${larpIds}::uuid[])
  `);
  for (const { larpId, ...tag } of rows) {
    const tags = result.get(larpId);
    if (tags) tags.push(tag);
    else result.set(larpId, [tag]);
  }
  return result;
}

export type ApiLarpTag = Pick<LarpTagChip, "slug" | "nameFi" | "nameEn">;

/** The tags of each of the given larps as the API shows them, sorted by slug. */
export async function getApiTagsOfLarps(
  reader: Reader,
  larpIds: string[],
): Promise<Map<string, ApiLarpTag[]>> {
  const tagsByLarp = await getTagsOfLarps(reader, larpIds);
  return new Map(
    [...tagsByLarp].map(([larpId, tags]) => [
      larpId,
      tags
        .map(({ slug, nameFi, nameEn }) => ({ slug, nameFi, nameEn }))
        .sort((a, b) => a.slug.localeCompare(b.slug)),
    ]),
  );
}

export async function getTagIdsOfLarp(larpId: string): Promise<string[]> {
  const rows = await db.orm.public.LarpTag.select("tagId")
    .where({ larpId })
    .all();
  return rows.map((row) => row.tagId);
}

async function isSlugTaken(slug: string): Promise<boolean> {
  return !!(await db.orm.public.Tag.select("id").first({ slug }));
}

export async function createTag(form: TagForm): Promise<TagResult> {
  if (!tagSlugPattern.test(form.slug))
    return { ok: false, error: "invalidSlug" };
  if (await isSlugTaken(form.slug)) return { ok: false, error: "slugTaken" };

  const tag = await db.orm.public.Tag.select("id", "slug").create(form);
  return { ok: true, tag };
}

/**
 * The slug stays as it is once a larp has the tag, so that links to the tag page keep working.
 * Renaming the tag bumps the updatedAt of its larps, since the API shows tag names on larps.
 */
export async function updateTag(id: string, form: TagForm): Promise<TagResult> {
  return db.transaction(async (tx) => {
    // FOR UPDATE conflicts with the FOR KEY SHARE that adding the tag to a larp takes on this row,
    // so no larp can get the tag between the check below and the slug change.
    const existing = await tx.orm.public.Tag.select(
      "id",
      "slug",
      "nameFi",
      "nameEn",
    )
      .where({ id })
      .forUpdate()
      .first();
    if (!existing) return { ok: false, error: "notFound" };

    const tagged = await tx.orm.public.LarpTag.select("larpId")
      .where({ tagId: id })
      .all();

    if (form.slug !== existing.slug) {
      if (!tagSlugPattern.test(form.slug)) {
        return { ok: false, error: "invalidSlug" };
      }
      if (tagged.length > 0) return { ok: false, error: "slugLocked" };
      const taken = await tx.orm.public.Tag.select("id").first({
        slug: form.slug,
      });
      if (taken && taken.id !== id) return { ok: false, error: "slugTaken" };
    }

    await tx.orm.public.Tag.where({ id }).update(form);

    const renamed =
      form.nameFi !== existing.nameFi || form.nameEn !== existing.nameEn;
    if (renamed && tagged.length > 0) {
      await tx.orm.public.Larp.where((l) =>
        l.id.in(tagged.map((row) => row.larpId)),
      ).updateAndCount({ updatedAt: iso(new Date()) });
    }
    return { ok: true, tag: { id, slug: form.slug } };
  });
}

/** Returns the number of larps that lost the tag, or null if there was no such tag. */
export async function deleteTag(id: string): Promise<number | null> {
  return db.transaction(async (tx) => {
    const tagged = await tx.orm.public.LarpTag.select("larpId")
      .where({ tagId: id })
      .all();
    const larpIds = tagged.map((row) => row.larpId);
    if (larpIds.length > 0) {
      // API consumers polling with updatedAfter need to see the larps lose the tag.
      await tx.orm.public.Larp.where((l) => l.id.in(larpIds)).updateAndCount({
        updatedAt: iso(new Date()),
      });
    }
    const count = await tx.orm.public.Tag.where({ id }).deleteAndCount();
    return count > 0 ? larpIds.length : null;
  });
}

/**
 * Tags deleted since the request was made are skipped, so that a pending request still applies.
 */
export async function handleLarpTags(
  tx: Tx,
  larpId: string,
  addTags: string[],
  removeTags: string[],
) {
  if (addTags.length === 0 && removeTags.length === 0) {
    return;
  }

  if (removeTags.length > 0) {
    await tx.orm.public.LarpTag.where({ larpId })
      .where((lt) => lt.tagId.in(removeTags))
      .deleteAndCount();
  }

  if (addTags.length > 0) {
    const existingTags = await tx.orm.public.Tag.select("id")
      .where((t) => t.id.in(addTags))
      .all();
    const presentTags = await tx.orm.public.LarpTag.select("tagId")
      .where({ larpId })
      .where((lt) => lt.tagId.in(addTags))
      .all();
    const present = new Set(presentTags.map((row) => row.tagId));
    const existing = new Set(existingTags.map((tag) => tag.id));
    const rows = [...new Set(addTags)]
      .filter((tagId) => existing.has(tagId) && !present.has(tagId))
      .map((tagId) => ({ larpId, tagId }));
    if (rows.length > 0) {
      await tx.orm.public.LarpTag.createAndCount(rows);
    }
  }

  // API consumers polling with updatedAfter need to see tag changes, and updatedAt only moves on
  // writes to the larp row itself.
  await tx.orm.public.Larp.where({ id: larpId }).update({
    updatedAt: iso(new Date()),
  });
}
