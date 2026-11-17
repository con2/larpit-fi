import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { iso, parseDates } from "@/prisma/dates";
import { db } from "@/prisma/db";
import { Language } from "@/prisma/enums";
import { pool } from "@/prisma/pool";
import { query } from "@/prisma/sql";
import { truncateAll } from "@/test/truncate";
import {
  createTag,
  deleteTag,
  getTagBySlug,
  getTagsOfLarps,
  getTagsWithCounts,
  updateTag,
} from "./Tag";

const form = {
  slug: "horror",
  nameFi: "Kauhu",
  nameEn: "Horror",
  descriptionFi: "",
  descriptionEn: "",
};

async function createLarp() {
  return db.orm.public.Larp.create({ name: "Larp", language: Language.fi });
}

beforeEach(truncateAll);
afterAll(async () => {
  await db.close();
  await pool.end();
});

describe("tags", () => {
  it("creates a tag and counts the larps that have it", async () => {
    const result = await createTag(form);
    if (!result.ok) throw new Error(result.error);
    const [a, b] = [await createLarp(), await createLarp()];
    await db.orm.public.LarpTag.createAndCount([
      { larpId: a.id, tagId: result.tag.id },
      { larpId: b.id, tagId: result.tag.id },
    ]);
    await createTag({ ...form, slug: "unused", nameEn: "Unused" });

    const tags = await getTagsWithCounts({ query });
    expect(tags.map((tag) => [tag.slug, tag.larpCount])).toEqual([
      ["horror", 2],
      ["unused", 0],
    ]);
    expect((await getTagBySlug({ query }, "horror"))?.larpCount).toBe(2);

    const tagsByLarp = await getTagsOfLarps({ query }, [a.id]);
    expect(tagsByLarp.get(a.id)?.map((tag) => tag.slug)).toEqual(["horror"]);
  });

  it("refuses a slug that is taken or malformed", async () => {
    await createTag(form);
    expect(await createTag(form)).toEqual({ ok: false, error: "slugTaken" });
    expect(await createTag({ ...form, slug: "Bad Slug" })).toEqual({
      ok: false,
      error: "invalidSlug",
    });
  });

  it("changes the slug only while no larp has the tag", async () => {
    const result = await createTag(form);
    if (!result.ok) throw new Error(result.error);
    const tagId = result.tag.id;

    expect(await updateTag(tagId, { ...form, slug: "kauhu" })).toEqual({
      ok: true,
      tag: { id: tagId, slug: "kauhu" },
    });

    const larp = await createLarp();
    await db.orm.public.LarpTag.create({ larpId: larp.id, tagId });

    expect(await updateTag(tagId, { ...form, slug: "horror" })).toEqual({
      ok: false,
      error: "slugLocked",
    });
    // Renaming keeps working on a tag in use.
    expect(
      await updateTag(tagId, { ...form, slug: "kauhu", nameEn: "Terror" }),
    ).toEqual({ ok: true, tag: { id: tagId, slug: "kauhu" } });
  });

  it("removes the tag from its larps on delete and bumps their updatedAt", async () => {
    const result = await createTag(form);
    if (!result.ok) throw new Error(result.error);
    const larp = await createLarp();
    await db.orm.public.LarpTag.create({
      larpId: larp.id,
      tagId: result.tag.id,
    });
    const longAgo = new Date("2020-01-01T00:00:00Z");
    await pool.query("update larp set updated_at = $1 where id = $2", [
      iso(longAgo),
      larp.id,
    ]);

    expect(await deleteTag(result.tag.id)).toBe(1);
    expect(await deleteTag(result.tag.id)).toBeNull();

    expect(await db.orm.public.LarpTag.all()).toHaveLength(0);
    const updated = parseDates(
      (await db.orm.public.Larp.first({ id: larp.id }))!,
    );
    expect(updated.updatedAt.getTime()).toBeGreaterThan(longAgo.getTime());
  });
});
