import sharp from "sharp";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import type { ObjectStorage } from "@/media/storage";
import { db } from "@/prisma/db";
import { pool } from "@/prisma/pool";
import { truncateAll } from "@/test/truncate";
import { contactPageSlug, frontPageSlug, seeAlsoSlug } from "./Page.client";

const objects = new Map<string, Buffer>();

vi.mock("@/media/storage", () => {
  const storage: Pick<ObjectStorage, "put" | "deletePrefix"> = {
    async put(key, data) {
      objects.set(key, data);
    },
    async deletePrefix(prefix) {
      for (const key of [...objects.keys()])
        if (key.startsWith(prefix)) objects.delete(key);
    },
  };
  return { getStorage: () => storage };
});

const {
  createPage,
  deletePage,
  ensureDefaultPages,
  getInfoMenuPages,
  renamePage,
} = await import("./Page");
const { createHeaderImage } = await import("./HeaderImage");

async function createInfoPage(
  slug: string,
  language: string,
  title: string,
  menuPosition: number | null,
) {
  await db.orm.public.Page.create({
    slug,
    language,
    title,
    content: "",
    menuPosition,
  });
}

beforeEach(async () => {
  await truncateAll();
  objects.clear();
});
afterAll(async () => {
  await db.close();
  await pool.end();
});

describe("ensureDefaultPages", () => {
  it("creates a front page for each language on an empty database", async () => {
    await ensureDefaultPages();

    const pages = await db.orm.public.Page.where({ slug: frontPageSlug }).all();
    expect(pages.map((p) => p.language).sort()).toEqual(["en", "fi"]);
    // The front page shows only its ingress.
    expect(pages.every((p) => p.ingress.includes("larp.fi"))).toBe(true);
    expect(pages.every((p) => p.content === "")).toBe(true);
  });

  it("keeps an existing front page and fills in only the missing language", async () => {
    await db.orm.public.Page.create({
      slug: frontPageSlug,
      language: "fi",
      title: "Oma otsikko",
      ingress: "Oma ingressi",
      content: "",
    });

    await ensureDefaultPages();
    await ensureDefaultPages();

    const fi = await db.orm.public.Page.first({
      slug: frontPageSlug,
      language: "fi",
    });
    expect(fi?.ingress).toBe("Oma ingressi");
    const en = await db.orm.public.Page.first({
      slug: frontPageSlug,
      language: "en",
    });
    expect(en?.title).toBe("Larp.fi development instance");
  });

  it("creates a see also page for each language", async () => {
    await ensureDefaultPages();

    const pages = await db.orm.public.Page.where({ slug: seeAlsoSlug }).all();
    expect(pages.map((p) => p.language).sort()).toEqual(["en", "fi"]);
  });

  it("creates a contact page with an ingress and content for each language", async () => {
    await ensureDefaultPages();

    const pages = await db.orm.public.Page.where({
      slug: contactPageSlug,
    }).all();
    expect(pages.map((p) => p.language).sort()).toEqual(["en", "fi"]);
    expect(pages.every((p) => p.ingress && p.content)).toBe(true);
  });
});

describe("getInfoMenuPages", () => {
  it("lists the pages of one language that have a menu position, in menu order", async () => {
    await createInfoPage("larppaus/sanasto", "fi", "Sanasto", 2);
    await createInfoPage("larppaus/saannot", "fi", "Säännöt", 2);
    await createInfoPage("larppaus/mita-on-larppaus", "fi", "Mitä?", 1);
    await createInfoPage("larppaus/piilossa", "fi", "Ei valikossa", null);
    await createInfoPage("larp/what-is-larp", "en", "What is larp?", 1);

    const pages = await getInfoMenuPages("fi");

    // Equal positions fall back to Finnish title order, where Ä sorts after Z.
    expect(pages.map((p) => p.slug)).toEqual([
      "larppaus/mita-on-larppaus",
      "larppaus/sanasto",
      "larppaus/saannot",
    ]);
  });
});

describe("createPage", () => {
  it("creates a page with empty ingress and content", async () => {
    const result = await createPage({
      slug: "larppaus/aloittaminen",
      language: "fi",
      title: "Aloittaminen",
      menuPosition: 1,
    });

    expect(result).toEqual({ ok: true });
    const page = await db.orm.public.Page.first({
      slug: "larppaus/aloittaminen",
      language: "fi",
    });
    expect(page).toMatchObject({ ingress: "", content: "", menuPosition: 1 });
  });

  it("refuses a slug the language already has, a reserved slug and a malformed slug", async () => {
    const page = {
      slug: "larppaus/aloittaminen",
      language: "fi",
      title: "Aloittaminen",
      menuPosition: null,
    } as const;
    await createPage(page);

    expect(await createPage(page)).toEqual({ ok: false, error: "taken" });
    expect(await createPage({ ...page, slug: "larp/uusi" })).toEqual({
      ok: false,
      error: "reserved",
    });
    expect(await createPage({ ...page, slug: "Larppaus/" })).toEqual({
      ok: false,
      error: "invalid",
    });
    // The same slug in another language is a different page.
    expect(await createPage({ ...page, language: "en" })).toEqual({
      ok: true,
    });
  });
});

describe("renamePage", () => {
  it("moves the page to the new slug and keeps its header image", async () => {
    const image = await createHeaderImage(
      await sharp({
        create: { width: 1200, height: 800, channels: 3, background: "#888" },
      })
        .jpeg()
        .toBuffer(),
      { photographerCredit: "", crop: { x: 0, y: 0, w: 1, h: 0.5 } },
      { source: "UPLOAD", userId: null },
    );
    await db.orm.public.Page.create({
      slug: "larppaus/proppaus",
      language: "fi",
      title: "Proppaus",
      content: "",
      headerImageId: image.id,
    });

    expect(
      await renamePage("larppaus/proppaus", "fi", "larppaus/proppi"),
    ).toEqual({ ok: true });

    expect(
      await db.orm.public.Page.first({
        slug: "larppaus/proppaus",
        language: "fi",
      }),
    ).toBeNull();
    const renamed = await db.orm.public.Page.first({
      slug: "larppaus/proppi",
      language: "fi",
    });
    expect(renamed?.headerImageId).toBe(image.id);
  });

  it("refuses a taken or reserved slug and the protected pages", async () => {
    await createInfoPage("larppaus/a", "fi", "A", null);
    await createInfoPage("larppaus/b", "fi", "B", null);
    await ensureDefaultPages();

    expect(await renamePage("larppaus/a", "fi", "larppaus/b")).toEqual({
      ok: false,
      error: "taken",
    });
    expect(await renamePage("larppaus/a", "fi", "calendar/a")).toEqual({
      ok: false,
      error: "reserved",
    });
    expect(await renamePage(frontPageSlug, "fi", "etusivu/uusi")).toEqual({
      ok: false,
      error: "protected",
    });
  });
});

describe("deletePage", () => {
  it("deletes the page and its header image", async () => {
    const image = await createHeaderImage(
      await sharp({
        create: { width: 1200, height: 800, channels: 3, background: "#888" },
      })
        .jpeg()
        .toBuffer(),
      { photographerCredit: "", crop: { x: 0, y: 0, w: 1, h: 0.5 } },
      { source: "UPLOAD", userId: null },
    );
    await db.orm.public.Page.create({
      slug: "larppaus/linkit",
      language: "fi",
      title: "Linkit",
      content: "",
      headerImageId: image.id,
    });

    expect(await deletePage("larppaus/linkit", "fi")).toBe(true);

    expect(
      await db.orm.public.Page.first({
        slug: "larppaus/linkit",
        language: "fi",
      }),
    ).toBeNull();
    expect(await db.orm.public.HeaderImage.first({ id: image.id })).toBeNull();
    expect([...objects.keys()].some((key) => key.includes(image.id))).toBe(
      false,
    );
  });

  it("refuses to delete the front page, the see also page and the contact page", async () => {
    await ensureDefaultPages();

    expect(await deletePage(frontPageSlug, "fi")).toBe(false);
    expect(await deletePage(seeAlsoSlug, "en")).toBe(false);
    expect(await deletePage(contactPageSlug, "fi")).toBe(false);
    expect(
      await db.orm.public.Page.where({ language: "fi" }).all(),
    ).toHaveLength(3);
  });
});
