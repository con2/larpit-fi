import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/prisma/db";
import { EditAction, EditStatus, Language, LarpLinkType } from "@/prisma/enums";
import { pool } from "@/prisma/pool";
import { truncateAll } from "@/test/truncate";
import {
  larpIdFromUrl,
  syncFromLarppikuvat,
  syncMessage,
} from "./larppikuvatSync";

const apiUrl = "https://larppikuvat.fi/api/v3/";

function fakeFetch(subalbums: { path: string; eventMetadataUrl: string }[]) {
  return (async () =>
    ({
      ok: true,
      json: async () => ({
        path: "/",
        title: "Larppikuvat.fi",
        eventMetadataUrl: "",
        subalbums: subalbums.map((subalbum) => ({
          ...subalbum,
          title: subalbum.path,
          thumbnail: null,
          preview: null,
        })),
      }),
    }) as unknown as Response) as typeof fetch;
}

async function createLarp(links: { type: LarpLinkType; href: string }[] = []) {
  return db.orm.public.Larp.create({
    name: "Test Larp",
    language: Language.fi,
    links: (larpLinks) => larpLinks.create(links),
  });
}

async function photosLinks(larpId: string) {
  const links = await db.orm.public.LarpLink.where({
    larpId,
    type: LarpLinkType.PHOTOS,
  }).all();
  return links.map((link) => link.href);
}

describe("larpIdFromUrl", () => {
  const id = "0190a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b";

  it("accepts the canonical form and its common variants", () => {
    expect(larpIdFromUrl(`https://larpit.fi/larp/${id}`)).toBe(id);
    expect(larpIdFromUrl(`https://www.larpit.fi/larp/${id}/`)).toBe(id);
    expect(larpIdFromUrl(`https://LARPIT.fi/larp/${id.toUpperCase()}`)).toBe(
      id,
    );
  });

  it("rejects other sites and paths", () => {
    expect(larpIdFromUrl(`https://example.com/larp/${id}`)).toBeNull();
    expect(larpIdFromUrl(`https://larpit.fi/some-alias`)).toBeNull();
    expect(larpIdFromUrl("")).toBeNull();
  });
});

describe("syncFromLarppikuvat", () => {
  beforeEach(truncateAll);
  afterAll(async () => {
    await db.close();
    await pool.end();
  });

  it("adds a PHOTOS link through an approved moderation request", async () => {
    const larp = await createLarp([
      { type: LarpLinkType.PHOTOS, href: "https://flickr.com/somewhere" },
    ]);

    const result = await syncFromLarppikuvat({
      apiUrl,
      fetchImpl: fakeFetch([
        {
          path: "/test-larp",
          eventMetadataUrl: `https://larpit.fi/larp/${larp.id}`,
        },
        { path: "/unrelated", eventMetadataUrl: "" },
      ]),
    });

    expect(result).toEqual({
      added: 1,
      unchanged: 0,
      mismatched: 0,
      missing: 0,
    });
    expect(await photosLinks(larp.id)).toEqual(
      expect.arrayContaining([
        "https://flickr.com/somewhere",
        "https://larppikuvat.fi/test-larp",
      ]),
    );
    const request = await db.orm.public.ModerationRequest.first({
      larpId: larp.id,
    });
    expect(request).toMatchObject({
      action: EditAction.UPDATE,
      status: EditStatus.APPROVED,
      message: syncMessage,
      submitterEmail: "yhteys@larppikuvat.fi",
    });
    const updated = await db.orm.public.Larp.first({ id: larp.id });
    expect(updated?.updateCount).toBe(1);
  });

  it("does nothing when the larp already links to the album", async () => {
    // Trailing slash and www. must not make the existing link look different.
    const larp = await createLarp([
      {
        type: LarpLinkType.PHOTOS,
        href: "https://www.larppikuvat.fi/test-larp/",
      },
    ]);

    const result = await syncFromLarppikuvat({
      apiUrl,
      fetchImpl: fakeFetch([
        {
          path: "/test-larp",
          eventMetadataUrl: `https://larpit.fi/larp/${larp.id}`,
        },
      ]),
    });

    expect(result).toEqual({
      added: 0,
      unchanged: 1,
      mismatched: 0,
      missing: 0,
    });
    expect(await photosLinks(larp.id)).toHaveLength(1);
    expect(
      await db.orm.public.ModerationRequest.aggregate((a) => ({
        count: a.count(),
      })),
    ).toEqual({ count: 0 });
  });

  it("warns and skips when the larp links to another album on the same site", async () => {
    const larp = await createLarp([
      { type: LarpLinkType.PHOTOS, href: "https://larppikuvat.fi/other-album" },
    ]);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await syncFromLarppikuvat({
      apiUrl,
      fetchImpl: fakeFetch([
        {
          path: "/test-larp",
          eventMetadataUrl: `https://larpit.fi/larp/${larp.id}`,
        },
      ]),
    });

    expect(result).toEqual({
      added: 0,
      unchanged: 0,
      mismatched: 1,
      missing: 0,
    });
    expect(warn).toHaveBeenCalledOnce();
    expect(await photosLinks(larp.id)).toEqual([
      "https://larppikuvat.fi/other-album",
    ]);
    warn.mockRestore();
  });

  it("warns about albums pointing to larps that do not exist", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await syncFromLarppikuvat({
      apiUrl,
      fetchImpl: fakeFetch([
        {
          path: "/test-larp",
          eventMetadataUrl:
            "https://larpit.fi/larp/0190a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b",
        },
      ]),
    });

    expect(result).toEqual({
      added: 0,
      unchanged: 0,
      mismatched: 0,
      missing: 1,
    });
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });
});
