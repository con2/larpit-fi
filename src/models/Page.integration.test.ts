import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { db } from "@/prisma/db";
import { pool } from "@/prisma/pool";
import { truncateAll } from "@/test/truncate";
import { ensureDefaultPages, frontPageSlug, seeAlsoSlug } from "./Page";

describe("ensureDefaultPages", () => {
  beforeEach(truncateAll);
  afterAll(async () => {
    await db.close();
    await pool.end();
  });

  it("creates a front page for each language on an empty database", async () => {
    await ensureDefaultPages();

    const pages = await db.orm.public.Page.where({ slug: frontPageSlug }).all();
    expect(pages.map((p) => p.language).sort()).toEqual(["en", "fi"]);
    expect(pages.every((p) => p.content.includes("larpit.fi"))).toBe(true);
  });

  it("keeps an existing front page and fills in only the missing language", async () => {
    await db.orm.public.Page.create({
      slug: frontPageSlug,
      language: "fi",
      title: "Oma otsikko",
      content: "Oma sisältö",
    });

    await ensureDefaultPages();
    await ensureDefaultPages();

    const fi = await db.orm.public.Page.first({
      slug: frontPageSlug,
      language: "fi",
    });
    expect(fi?.content).toBe("Oma sisältö");
    const en = await db.orm.public.Page.first({
      slug: frontPageSlug,
      language: "en",
    });
    expect(en?.title).toBe("Larpit.fi development instance");
  });

  it("creates a see also page for each language", async () => {
    await ensureDefaultPages();

    const pages = await db.orm.public.Page.where({ slug: seeAlsoSlug }).all();
    expect(pages.map((p) => p.language).sort()).toEqual(["en", "fi"]);
  });
});
