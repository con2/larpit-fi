import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { ensureBuiltinCommands } from "@/models/Command";
import { db } from "@/prisma/db";
import { Language } from "@/prisma/enums";
import { pool } from "@/prisma/pool";
import { query, type SqlQuery } from "@/prisma/sql";
import { truncateAll } from "@/test/truncate";
import {
  searchCommands,
  searchLarpIds,
  searchLarps,
  searchPages,
  type SearchReader,
} from "./search";
import { parseSearchQuery } from "./searchQuery";

const reader: SearchReader = { db, query };

beforeEach(async () => {
  await truncateAll();
});
afterAll(async () => {
  await db.close();
  await pool.end();
});

async function createLarp(
  name: string,
  fields: {
    language?: Language;
    tagline?: string;
    description?: string;
    fluffText?: string;
    startsAt?: string;
    municipalityId?: string;
  } = {},
) {
  const larp = await db.orm.public.Larp.create({
    name,
    language: Language.fi,
    ...fields,
  });
  return larp.id;
}

async function larpNames(text: string, limit = 50, offset = 0) {
  const { results } = await searchLarps(reader, parseSearchQuery(text), {
    limit,
    offset,
  });
  return results.map((larp) => larp.name);
}

async function createPage(
  slug: string,
  language: string,
  title: string,
  content = "",
  ingress = "",
) {
  await db.orm.public.Page.create({ slug, language, title, content, ingress });
}

describe("searchLarps", () => {
  it("finds Finnish larps by inflected forms", async () => {
    await createLarp("Velho ja lohikäärme");
    expect(await larpNames("velhot")).toEqual(["Velho ja lohikäärme"]);
    expect(await larpNames("velhossa")).toEqual(["Velho ja lohikäärme"]);
  });

  it("treats the last word as a prefix", async () => {
    await createLarp("Odysseus");
    expect(await larpNames("odys")).toEqual(["Odysseus"]);
  });

  it("requires every word to match", async () => {
    await createLarp("Talon kirous");
    await createLarp("Talon salaisuus");
    expect(await larpNames("talo kirous")).toEqual(["Talon kirous"]);
  });

  it("ranks name above tagline above description above fluff text", async () => {
    await createLarp("Fluff", { fluffText: "Kummitus" });
    await createLarp("Description", { description: "Kummitus" });
    await createLarp("Tagline", { tagline: "Kummitus" });
    await createLarp("Kummitus");
    expect(await larpNames("kummitus")).toEqual([
      "Kummitus",
      "Tagline",
      "Description",
      "Fluff",
    ]);
  });

  it("stems each larp in its own language", async () => {
    // English stems both "running" and "runs" to "run"; Finnish leaves "runs" alone.
    await createLarp("Runs of the river", { language: Language.en });
    await createLarp("Joki", { language: Language.fi, tagline: "runs" });
    expect(await larpNames("running")).toEqual(["Runs of the river"]);
  });

  it("does not match by municipality name", async () => {
    await pool.query(`
      insert into country (id, code) values ('wd:Q33', 'FI') on conflict do nothing
    `);
    await pool.query(`
      insert into municipality (id, name_fi, lat, long)
      values ('wd:Q1757', 'Helsinki', 60.17, 24.94)
      on conflict do nothing
    `);
    await createLarp("Kaupunkilarppi", { municipalityId: "wd:Q1757" });
    expect(await larpNames("helsinki")).toEqual([]);
  });

  it("puts upcoming larps before past ones of equal rank", async () => {
    await createLarp("Kummitus", { startsAt: "2001-01-01" });
    await createLarp("Kummitus", { startsAt: "2999-01-01" });
    const { results } = await searchLarps(
      reader,
      parseSearchQuery("kummitus"),
      { limit: 10 },
    );
    expect(results.map((larp) => larp.startsAt)).toEqual([
      "2999-01-01",
      "2001-01-01",
    ]);
  });

  it("counts every match and pages without overlap", async () => {
    for (let i = 0; i < 5; i++) await createLarp(`Kummitus ${i}`);
    const q = parseSearchQuery("kummitus");
    const firstPage = await searchLarpIds(reader, q, { limit: 2 });
    const secondPage = await searchLarpIds(reader, q, { limit: 2, offset: 2 });
    const pastEnd = await searchLarpIds(reader, q, { limit: 2, offset: 10 });
    expect(firstPage.total).toBe(5);
    expect(pastEnd).toEqual({ total: 5, results: [] });
    expect(new Set([...firstPage.results, ...secondPage.results]).size).toBe(4);
  });

  it("returns nothing for input without searchable words", async () => {
    await createLarp("Kummitus");
    expect(await larpNames("!!")).toEqual([]);
  });

  it("finds names with foreign letters when typed without the marks", async () => {
    // The Finnish stemmer cuts "Erreàn" and "Errean" differently, so only folding finds it.
    await createLarp("Erreàn kronikat");
    await createLarp("Balançoire");
    await createLarp("Z-ØM – Turvapaikka");
    expect(await larpNames("Errean")).toEqual(["Erreàn kronikat"]);
    expect(await larpNames("errean kron")).toEqual(["Erreàn kronikat"]);
    expect(await larpNames("balancoire")).toEqual(["Balançoire"]);
    expect(await larpNames("z om")).toEqual(["Z-ØM – Turvapaikka"]);
  });

  it("still finds names with foreign letters when typed with them", async () => {
    await createLarp("Erreàn kronikat");
    expect(await larpNames("Erreàn")).toEqual(["Erreàn kronikat"]);
  });

  it("keeps ä and ö apart from a and o", async () => {
    await createLarp("Pöllö");
    await createLarp("Pollo");
    expect(await larpNames("pollo")).toEqual(["Pollo"]);
  });
});

describe("searchPages", () => {
  async function pageSlugs(text: string, language: "fi" | "en") {
    const { results } = await searchPages(
      reader,
      parseSearchQuery(text),
      language,
      { limit: 10 },
    );
    return results.map((page) => page.slug);
  }

  it("searches only pages in the UI language", async () => {
    await createPage("ohje", "fi", "Ohjeita larppaajalle");
    await createPage("ohje", "en", "Ohjeita in English");
    expect(await pageSlugs("ohjeita", "fi")).toEqual(["ohje"]);
    const { results } = await searchPages(
      reader,
      parseSearchQuery("ohjeita"),
      "fi",
      { limit: 10 },
    );
    expect(results[0].language).toBe("fi");
  });

  it("never returns the front page or the see also page", async () => {
    await createPage("front-page", "fi", "Larppiarkisto");
    await createPage("see-also", "fi", "Larppiarkisto");
    await createPage("contact", "fi", "Larppiarkisto");
    expect(await pageSlugs("larppiarkisto", "fi")).toEqual(["contact"]);
  });

  it("ranks a title hit above an ingress hit above a body hit", async () => {
    await createPage("body", "fi", "Yksi", "Turvallisuus on tärkeää");
    await createPage("ingress", "fi", "Kaksi", "", "Turvallisuus");
    await createPage("title", "fi", "Turvallisuus");
    expect(await pageSlugs("turvallisuus", "fi")).toEqual([
      "title",
      "ingress",
      "body",
    ]);
  });

  it("counts beyond the limit", async () => {
    for (let i = 0; i < 4; i++) await createPage(`p${i}`, "fi", "Ohjeita");
    const page = await searchPages(reader, parseSearchQuery("ohjeita"), "fi", {
      limit: 3,
    });
    expect(page.total).toBe(4);
    expect(page.results).toHaveLength(3);
  });
});

describe("searchCommands", () => {
  async function actions(text: string, language: "fi" | "en") {
    const { results } = await searchCommands(
      reader,
      parseSearchQuery(text),
      language,
      { limit: 20 },
    );
    return results.map((command) => command.action);
  }

  it("finds a built-in command by a synonym", async () => {
    await ensureBuiltinCommands();
    expect(await actions("suhteet", "fi")).toContain("larp:addRelated");
    expect(await actions("relations", "en")).toContain("larp:addRelated");
  });

  it("finds the theme command by either of its labels", async () => {
    await ensureBuiltinCommands();
    expect(await actions("tummaan", "fi")).toContain("global:theme");
    expect(await actions("vaaleaan", "fi")).toContain("global:theme");
  });

  it("ranks a label hit above a synonym hit", async () => {
    await db.orm.public.Command.create({
      language: "fi",
      action: "/synonym",
      label: "Muu",
      synonyms: "Roolit",
    });
    await db.orm.public.Command.create({
      language: "fi",
      action: "/label",
      label: "Roolit",
    });
    expect(await actions("roolit", "fi")).toEqual(["/label", "/synonym"]);
  });
});

describe("ensureBuiltinCommands", () => {
  async function commandRows() {
    return db.orm.public.Command.select(
      "language",
      "action",
      "label",
      "synonyms",
      "isBuiltin",
    ).all();
  }

  it("overwrites built-ins, removes stale built-ins and keeps admin rows", async () => {
    await db.orm.public.Command.create({
      language: "fi",
      action: "global:addLarp",
      label: "Vanha nimi",
      isBuiltin: true,
    });
    await db.orm.public.Command.create({
      language: "fi",
      action: "global:removed",
      label: "Poistunut",
      isBuiltin: true,
    });
    await db.orm.public.Command.create({
      language: "fi",
      action: "/larp/{larpId}/roles",
      label: "Roolit",
    });

    await ensureBuiltinCommands([
      {
        language: "fi",
        action: "global:addLarp",
        label: "Lisää larppi",
        synonyms: "Uusi larppi",
      },
    ]);

    const rows = await commandRows();
    expect(rows).toHaveLength(2);
    expect(rows).toContainEqual({
      language: "fi",
      action: "global:addLarp",
      label: "Lisää larppi",
      synonyms: "Uusi larppi",
      isBuiltin: true,
    });
    expect(rows).toContainEqual({
      language: "fi",
      action: "/larp/{larpId}/roles",
      label: "Roolit",
      synonyms: "",
      isBuiltin: false,
    });
  });

  it("is idempotent", async () => {
    await ensureBuiltinCommands();
    const before = await commandRows();
    await ensureBuiltinCommands();
    expect(await commandRows()).toEqual(before);
    expect(before.length).toBeGreaterThan(0);
  });
});

describe("index use", () => {
  /** Runs the search's own SQL under `explain` and returns the plan. */
  async function plan(
    search: (reader: SearchReader) => Promise<unknown>,
  ): Promise<string> {
    const lines: string[] = [];
    const explainingReader: SearchReader = {
      db,
      query: async <Row>(q: SqlQuery) => {
        const result = await pool.query(`explain ${q.text}`, q.values);
        lines.push(...result.rows.map((row) => row["QUERY PLAN"]));
        return [] as Row[];
      },
    };
    await search(explainingReader).catch(() => {});
    return lines.join("\n");
  }

  // With a handful of rows the planner prefers a sequential scan whatever the indexes, so the
  // tables are filled with enough non-matching rows to make the index worth using.
  beforeEach(async () => {
    await pool.query(`
      insert into larp (name, language, description, updated_at)
      select
        'Filler ' || i,
        (array['fi', 'en', 'sv', 'OTHER'])[i % 4 + 1]::"Language",
        'Lorem ipsum dolor',
        now()
      from generate_series(1, 4000) i
    `);
    await pool.query(`
      insert into page (slug, language, title, content, updated_at)
      select 'filler-' || i, lang, 'Filler ' || i, 'Lorem ipsum dolor', now()
      from generate_series(1, 4000) i, unnest(array['fi', 'en']) lang
    `);
    await pool.query(`
      insert into command (language, action, label)
      select lang, '/filler/' || i, 'Filler ' || i
      from generate_series(1, 4000) i, unnest(array['fi', 'en']) lang
    `);
    await pool.query("analyze larp, page, command");
  });

  const q = parseSearchQuery("kummitus");

  it("uses every larp language index", async () => {
    const larpPlan = await plan((r) => searchLarpIds(r, q, { limit: 10 }));
    for (const index of ["fi", "en", "sv", "other"]) {
      expect(larpPlan).toMatch(
        new RegExp(`Index Scan on larp_search_${index}_`),
      );
    }
    expect(larpPlan).toMatch(/Index Scan on larp_folded_name_search_/);
  });

  it("uses the page index of the UI language", async () => {
    for (const language of ["fi", "en"] as const) {
      expect(
        await plan((r) => searchPages(r, q, language, { limit: 10 })),
      ).toMatch(new RegExp(`Index Scan on page_search_${language}_`));
    }
  });

  it("uses the command index of the UI language", async () => {
    for (const language of ["fi", "en"] as const) {
      expect(
        await plan((r) => searchCommands(r, q, language, { limit: 10 })),
      ).toMatch(new RegExp(`Index Scan on command_search_${language}_`));
    }
  });
});
