import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { iso, parseDates } from "@/prisma/dates";
import { db } from "@/prisma/db";
import { Language, UserRole } from "@/prisma/enums";
import { pool } from "@/prisma/pool";
import { query } from "@/prisma/sql";
import { truncateAll } from "@/test/truncate";
import {
  createTag,
  deleteTag,
  getLarpsForTagging,
  getTagBySlug,
  getTagIdsOfLarp,
  getTagsOfLarps,
  getTagsWithCounts,
  setLarpTags,
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

  it("bumps the updatedAt of the tag's larps on a rename, not on a description edit", async () => {
    const result = await createTag(form);
    if (!result.ok) throw new Error(result.error);
    const larp = await createLarp();
    await db.orm.public.LarpTag.create({
      larpId: larp.id,
      tagId: result.tag.id,
    });
    const longAgo = new Date("2020-01-01T00:00:00Z");
    const backdate = () =>
      pool.query("update larp set updated_at = $1 where id = $2", [
        iso(longAgo),
        larp.id,
      ]);
    const updatedAt = async () =>
      parseDates((await db.orm.public.Larp.first({ id: larp.id }))!).updatedAt;

    await backdate();
    await updateTag(result.tag.id, { ...form, descriptionEn: "Scary." });
    expect(await updatedAt()).toEqual(longAgo);

    await updateTag(result.tag.id, { ...form, nameEn: "Terror" });
    expect((await updatedAt()).getTime()).toBeGreaterThan(longAgo.getTime());
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

describe("bulk tagging", () => {
  const moderator = { role: UserRole.MODERATOR };

  async function createTags() {
    const tags = await Promise.all(
      ["horror", "scifi", "fantasy"].map(async (slug) => {
        const result = await createTag({ ...form, slug, nameEn: slug });
        if (!result.ok) throw new Error(result.error);
        return result.tag.id;
      }),
    );
    return tags as [string, string, string];
  }

  it("lists untagged larps or all of them, filtered by name", async () => {
    const [horror] = await createTags();
    const tagged = await db.orm.public.Larp.create({
      name: "Tagged 100% larp",
      language: Language.fi,
    });
    const untagged = await db.orm.public.Larp.create({
      name: "Untagged larp",
      language: Language.fi,
    });
    await db.orm.public.LarpTag.createAndCount([
      { larpId: tagged.id, tagId: horror },
    ]);

    const onlyUntagged = await getLarpsForTagging(
      { untaggedOnly: true, name: "" },
      0,
      10,
    );
    expect(onlyUntagged.count).toBe(1);
    expect(onlyUntagged.larps.map((larp) => [larp.id, larp.tagIds])).toEqual([
      [untagged.id, []],
    ]);

    const all = await getLarpsForTagging(
      { untaggedOnly: false, name: "" },
      0,
      10,
    );
    expect(all.count).toBe(2);
    expect(all.larps.find((larp) => larp.id === tagged.id)?.tagIds).toEqual([
      horror,
    ]);

    // The percent sign is matched literally, not as a wildcard.
    const byName = await getLarpsForTagging(
      { untaggedOnly: false, name: "100%" },
      0,
      10,
    );
    expect(byName.larps.map((larp) => larp.id)).toEqual([tagged.id]);
    const wildcard = await getLarpsForTagging(
      { untaggedOnly: false, name: "d%l" },
      0,
      10,
    );
    expect(wildcard.count).toBe(0);
  });

  it("applies only the moderator's changes against the tags loaded", async () => {
    const [horror, scifi, fantasy] = await createTags();
    const larp = await createLarp();
    await db.orm.public.LarpTag.createAndCount([
      { larpId: larp.id, tagId: horror },
    ]);
    // Someone else added fantasy after the page was loaded with only horror.
    await db.orm.public.LarpTag.createAndCount([
      { larpId: larp.id, tagId: fantasy },
    ]);

    const result = await setLarpTags(moderator, larp.id, [horror], [scifi]);
    expect(result).toEqual({ ok: true, changed: true });
    expect((await getTagIdsOfLarp(larp.id)).sort()).toEqual(
      [scifi, fantasy].sort(),
    );
  });

  it("reports a larp whose tags were left as they were as unchanged", async () => {
    const [horror] = await createTags();
    const larp = await createLarp();
    await db.orm.public.LarpTag.createAndCount([
      { larpId: larp.id, tagId: horror },
    ]);
    expect(await setLarpTags(moderator, larp.id, [horror], [horror])).toEqual({
      ok: true,
      changed: false,
    });
  });

  it("refuses anyone but a moderator", async () => {
    const [horror] = await createTags();
    const larp = await createLarp();
    expect(
      await setLarpTags({ role: UserRole.VERIFIED }, larp.id, [], [horror]),
    ).toEqual({ ok: false, error: "forbidden" });
    expect(await getTagIdsOfLarp(larp.id)).toEqual([]);
  });
});
