import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { db } from "@/prisma/db";
import { pool } from "@/prisma/pool";
import { truncateAll } from "@/test/truncate";
import { ensureFrontPages, frontPageSlug } from "./Page";

describe("ensureFrontPages", () => {
  beforeEach(truncateAll);
  afterAll(async () => {
    await db.close();
    await pool.end();
  });

  it("creates a front page for each language on an empty database", async () => {
    await ensureFrontPages();

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

    await ensureFrontPages();
    await ensureFrontPages();

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
});
