import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { db } from "@/prisma/db";
import { Language, LarpLinkType, LarpType, UserRole } from "@/prisma/enums";
import { pool } from "@/prisma/pool";
import { truncateAll } from "@/test/truncate";
import {
  executeImportAction,
  findLarpByAliasRedirect,
  getLarpsWithoutAlias,
  larpIdOrAliasFilter,
  setLarpAlias,
} from "./Larp";
import { ModerationRequestContent } from "./ModerationRequest";

const moderator = { role: UserRole.MODERATOR };

afterAll(async () => {
  await db.close();
  await pool.end();
});

async function createLarp(alias: string | null = null) {
  return db.orm.public.Larp.create({
    name: "Test Larp",
    language: Language.fi,
    alias,
  });
}

async function redirectsOf(larpId: string) {
  const redirects = await db.orm.public.LarpAliasRedirect.where({ larpId })
    .select("alias")
    .all();
  return redirects.map((redirect) => redirect.alias).sort();
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

  it("keeps a changed alias as a redirect to the larp", async () => {
    const larp = await createLarp("first");

    await setLarpAlias(moderator, larp.id, "second");
    await setLarpAlias(moderator, larp.id, "third");

    expect(await redirectsOf(larp.id)).toEqual(["first", "second"]);
    expect(await findLarpByAliasRedirect("first")).toEqual({
      id: larp.id,
      alias: "third",
    });
  });

  it("does not keep a removed alias as a redirect", async () => {
    const larp = await createLarp("first");

    await setLarpAlias(moderator, larp.id, "");

    expect(await redirectsOf(larp.id)).toEqual([]);
  });

  it("drops the redirect when the larp takes its old alias back", async () => {
    const larp = await createLarp("first");

    await setLarpAlias(moderator, larp.id, "second");
    await setLarpAlias(moderator, larp.id, "first");

    expect(await redirectsOf(larp.id)).toEqual(["second"]);
  });

  it("lets another larp take a former alias over its redirect", async () => {
    const renamed = await createLarp("taken-over");
    await setLarpAlias(moderator, renamed.id, "renamed");
    const other = await createLarp();

    expect(await setLarpAlias(moderator, other.id, "taken-over")).toEqual({
      ok: true,
      alias: "taken-over",
    });
    expect(await redirectsOf(renamed.id)).toEqual([]);
    expect(await findLarpByAliasRedirect("taken-over")).toBeNull();
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

describe("executeImportAction", () => {
  beforeEach(truncateAll);

  const importer = () =>
    db.orm.public.User.create({
      email: "importer@example.com",
      name: "Importer",
      role: UserRole.ADMIN,
    });

  const linksOf = async (larpId: string) =>
    (
      await db.orm.public.LarpLink.where({ larpId })
        .select("type", "href", "title")
        .all()
    ).sort((a, b) => a.type.localeCompare(b.type));

  it("creates a larp with its links", async () => {
    const user = await importer();
    const content = ModerationRequestContent.parse({
      name: "Kolme Mannerta 2",
      type: LarpType.ONE_SHOT,
      startsAt: "2003-05-02",
      endsAt: "2003-05-04",
    });

    const larpId = await executeImportAction(
      { kind: "create", content },
      user,
      "imported",
      [
        {
          type: LarpLinkType.SOURCE,
          href: "https://example.com/a",
          title: "A",
        },
      ],
    );

    const larp = await db.orm.public.Larp.first({ id: larpId! });
    expect(larp?.name).toBe("Kolme Mannerta 2");
    expect(larp?.startsAt).toBe("2003-05-02");
    expect(await linksOf(larpId!)).toEqual([
      { type: LarpLinkType.SOURCE, href: "https://example.com/a", title: "A" },
    ]);
  });

  it("fills in fields and adds links to an existing larp", async () => {
    const user = await importer();
    const existing = await createLarp();

    await executeImportAction(
      {
        kind: "update",
        larpId: existing.id,
        name: existing.name,
        fields: { locationText: "Ohkola" },
      },
      user,
      "imported",
      [{ type: LarpLinkType.SOURCE, href: "https://example.com/b" }],
    );

    const larp = await db.orm.public.Larp.first({ id: existing.id });
    expect(larp?.locationText).toBe("Ohkola");
    expect(await linksOf(existing.id)).toEqual([
      { type: LarpLinkType.SOURCE, href: "https://example.com/b", title: null },
    ]);
  });
});
