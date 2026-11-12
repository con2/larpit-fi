import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/prisma/db";
import { EditAction, EditStatus, Language, LarpLinkType } from "@/prisma/enums";
import { pool } from "@/prisma/pool";
import { truncateAll } from "@/test/truncate";
import {
  larpFilterFromUrl,
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

describe("larpFilterFromUrl", () => {
  const id = "0190a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b";

  it("accepts the canonical form and its common variants", () => {
    expect(larpFilterFromUrl(`https://larp.fi/larp/${id}`)).toEqual({ id });
    expect(larpFilterFromUrl(`https://www.larp.fi/larp/${id}/`)).toEqual({
      id,
    });
    expect(
      larpFilterFromUrl(`https://LARP.fi/larp/${id.toUpperCase()}`),
    ).toEqual({ id });
  });

  it("accepts the former larpit.fi domain", () => {
    expect(larpFilterFromUrl(`https://larpit.fi/larp/${id}`)).toEqual({ id });
    expect(larpFilterFromUrl("https://www.larpit.fi/some-alias")).toEqual({
      alias: "some-alias",
    });
  });

  it("accepts the short address of a larp", () => {
    expect(larpFilterFromUrl("https://larp.fi/some-alias")).toEqual({
      alias: "some-alias",
    });
    expect(larpFilterFromUrl("https://www.larp.fi/Some-Alias/")).toEqual({
      alias: "some-alias",
    });
  });

  it("rejects other sites and paths", () => {
    expect(larpFilterFromUrl(`https://example.com/larp/${id}`)).toBeNull();
    expect(larpFilterFromUrl(`https://example.com/some-alias`)).toBeNull();
    expect(larpFilterFromUrl("https://larp.fi/calendar")).toBeNull();
    expect(larpFilterFromUrl(`https://larp.fi/${id}`)).toBeNull();
    expect(larpFilterFromUrl("https://larp.fi/larp/some-alias")).toBeNull();
    expect(larpFilterFromUrl("https://larp.fi/a/b")).toBeNull();
    expect(larpFilterFromUrl("https://larp.fi/")).toBeNull();
    expect(larpFilterFromUrl("")).toBeNull();
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
          eventMetadataUrl: `https://larp.fi/larp/${larp.id}`,
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

  it("finds the larp by the short address too", async () => {
    const larp = await createLarp();
    await db.orm.public.Larp.where({ id: larp.id }).update({
      alias: "test-larp",
    });

    const result = await syncFromLarppikuvat({
      apiUrl,
      fetchImpl: fakeFetch([
        { path: "/test-larp", eventMetadataUrl: "https://larp.fi/test-larp" },
        {
          path: "/unknown-alias",
          eventMetadataUrl: "https://larp.fi/no-such-larp",
        },
      ]),
    });

    expect(result).toEqual({
      added: 1,
      unchanged: 0,
      mismatched: 0,
      missing: 1,
    });
    expect(await photosLinks(larp.id)).toEqual([
      "https://larppikuvat.fi/test-larp",
    ]);
  });

  it("follows a former alias of the larp", async () => {
    const larp = await createLarp();
    await db.orm.public.Larp.where({ id: larp.id }).update({
      alias: "new-alias",
    });
    await db.orm.public.LarpAliasRedirect.create({
      alias: "old-alias",
      larpId: larp.id,
    });

    const result = await syncFromLarppikuvat({
      apiUrl,
      fetchImpl: fakeFetch([
        { path: "/test-larp", eventMetadataUrl: "https://larp.fi/old-alias" },
      ]),
    });

    expect(result.added).toBe(1);
    expect(await photosLinks(larp.id)).toEqual([
      "https://larppikuvat.fi/test-larp",
    ]);
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
          eventMetadataUrl: `https://larp.fi/larp/${larp.id}`,
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
          eventMetadataUrl: `https://larp.fi/larp/${larp.id}`,
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
            "https://larp.fi/larp/0190a1b2-c3d4-7e5f-8a9b-0c1d2e3f4a5b",
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
