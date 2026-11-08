import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { db } from "@/prisma/db";
import { Language, UserRole } from "@/prisma/enums";
import { pool } from "@/prisma/pool";
import { truncateAll } from "@/test/truncate";
import {
  getLarpsWithoutAlias,
  larpIdOrAliasFilter,
  setLarpAlias,
} from "./Larp";

const moderator = { role: UserRole.MODERATOR };

async function createLarp(alias: string | null = null) {
  return db.orm.public.Larp.create({
    name: "Test Larp",
    language: Language.fi,
    alias,
  });
}

async function aliasOf(larpId: string) {
  const larp = await db.orm.public.Larp.select("alias").first({ id: larpId });
  return larp?.alias;
}

describe("larpIdOrAliasFilter", () => {
  const id = "0190a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b";

  it.each([
    [id, { id }],
    [id.toUpperCase(), { id }],
    ["welcome-to-grayhaven-p2", { alias: "welcome-to-grayhaven-p2" }],
    ["Welcome-To-Grayhaven", { alias: "welcome-to-grayhaven" }],
  ])("%j", (key, filter) => {
    expect(larpIdOrAliasFilter(key)).toEqual(filter);
  });

  it.each(["", "calendar", "not an alias", "-dash", "ä"])(
    "rejects %j",
    (key) => {
      expect(larpIdOrAliasFilter(key)).toBeNull();
    },
  );
});

describe("getLarpsWithoutAlias", () => {
  beforeEach(truncateAll);

  it("lists larps without an alias, the latest first and undated ones last", async () => {
    const create = (name: string, startsAt: string | null, alias?: string) =>
      db.orm.public.Larp.create({
        name,
        language: Language.fi,
        startsAt,
        alias: alias ?? null,
      });
    await create("Undated", null);
    await create("Older", "2024-05-01");
    await create("Newer", "2026-05-01");
    await create("Aliased", "2027-01-01", "aliased");

    const { larps, count } = await getLarpsWithoutAlias(0, 2);
    expect(count).toBe(3);
    expect(larps.map((larp) => [larp.name, larp.startsAt])).toEqual([
      ["Newer", "2026-05-01"],
      ["Older", "2024-05-01"],
    ]);

    const nextPage = await getLarpsWithoutAlias(2, 2);
    expect(nextPage.larps.map((larp) => larp.name)).toEqual(["Undated"]);
  });
});

describe("setLarpAlias", () => {
  beforeEach(truncateAll);
  afterAll(async () => {
    await db.close();
    await pool.end();
  });

  it("sets a normalized alias", async () => {
    const larp = await createLarp();

    const result = await setLarpAlias(moderator, larp.id, "  Lumi-Kuningatar ");

    expect(result).toEqual({ ok: true, alias: "lumi-kuningatar" });
    expect(await aliasOf(larp.id)).toBe("lumi-kuningatar");
  });

  it("clears the alias when given an empty string", async () => {
    const larp = await createLarp("vanha");

    const result = await setLarpAlias(moderator, larp.id, "   ");

    expect(result).toEqual({ ok: true, alias: null });
    expect(await aliasOf(larp.id)).toBeNull();
  });

  it("lets a larp keep its own alias", async () => {
    const larp = await createLarp("oma");

    const result = await setLarpAlias(moderator, larp.id, "oma");

    expect(result).toEqual({ ok: true, alias: "oma" });
  });

  it.each([UserRole.NOT_VERIFIED, UserRole.VERIFIED])(
    "rejects a %s user",
    async (role) => {
      const larp = await createLarp();

      const result = await setLarpAlias({ role }, larp.id, "ok");

      expect(result).toEqual({ ok: false, error: "forbidden" });
      expect(await aliasOf(larp.id)).toBeNull();
    },
  );

  it("rejects an anonymous user", async () => {
    const larp = await createLarp();

    expect(await setLarpAlias(null, larp.id, "ok")).toEqual({
      ok: false,
      error: "forbidden",
    });
  });

  it.each(["stats", "api", "en", "fi", "larp"])(
    "rejects the reserved alias %s",
    async (alias) => {
      const larp = await createLarp();

      expect(await setLarpAlias(moderator, larp.id, alias)).toEqual({
        ok: false,
        error: "reserved",
      });
    },
  );

  it.each([
    "with space",
    "-leading",
    "trailing-",
    "double--hyphen",
    "ääkkönen",
  ])("rejects the badly formatted alias %j", async (alias) => {
    const larp = await createLarp();

    expect(await setLarpAlias(moderator, larp.id, alias)).toEqual({
      ok: false,
      error: "invalidFormat",
    });
  });

  it("rejects an alias longer than 100 characters", async () => {
    const larp = await createLarp();

    expect(await setLarpAlias(moderator, larp.id, "a".repeat(101))).toEqual({
      ok: false,
      error: "tooLong",
    });
  });

  it("rejects an alias another larp has", async () => {
    await createLarp("varattu");
    const larp = await createLarp();

    expect(await setLarpAlias(moderator, larp.id, "varattu")).toEqual({
      ok: false,
      error: "takenByLarp",
    });
    expect(await aliasOf(larp.id)).toBeNull();
  });

  it("rejects an alias that is the slug of a content page in any language", async () => {
    await db.orm.public.Page.create({
      slug: "tietoa",
      language: "en",
      title: "About",
      content: "About this site",
    });
    const larp = await createLarp();

    expect(await setLarpAlias(moderator, larp.id, "tietoa")).toEqual({
      ok: false,
      error: "takenByPage",
    });
  });

  it("reports a larp that does not exist", async () => {
    expect(
      await setLarpAlias(
        moderator,
        "019a0000-0000-7000-8000-000000000000",
        "ok",
      ),
    ).toEqual({ ok: false, error: "notFound" });
  });
});
