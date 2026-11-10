import sharp from "sharp";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import type { ObjectStorage } from "@/media/storage";
import { db } from "@/prisma/db";
import { Language, RelatedUserRole, UserRole } from "@/prisma/enums";
import { pool } from "@/prisma/pool";
import { truncateAll } from "@/test/truncate";

const objects = new Map<string, Buffer>();

vi.mock("@/media/storage", () => {
  const storage: ObjectStorage = {
    async put(key, data) {
      objects.set(key, data);
    },
    async get(key) {
      return objects.get(key) ?? null;
    },
    async stat(key) {
      const data = objects.get(key);
      return data ? { size: data.length } : null;
    },
    async delete(key) {
      objects.delete(key);
    },
    async deletePrefix(prefix) {
      for (const key of [...objects.keys()])
        if (key.startsWith(prefix)) objects.delete(key);
    },
    url(key) {
      return `https://garage.test/larpit/${key}`;
    },
    async presignUpload(key) {
      return { url: `https://garage.test/larpit/${key}`, headers: {} };
    },
  };
  return { getStorage: () => storage };
});

const {
  attachHeaderImage,
  authorizeHeaderImageTarget,
  createHeaderImage,
  createHeaderImageFromUpload,
  deleteHeaderImage,
  HeaderImageFailure,
  updateHeaderImage,
} = await import("./HeaderImage");

const meta = {
  photographerCredit: "Kuvaaja Kuvaajainen",
  crop: { x: 0, y: 0.25, w: 1, h: 0.5 },
};

function jpeg(width: number, height: number) {
  return sharp({
    create: { width, height, channels: 3, background: "#888" },
  })
    .jpeg()
    .toBuffer();
}

function keysUnder(prefix: string) {
  return [...objects.keys()].filter((key) => key.startsWith(prefix)).sort();
}

async function createUser(role: UserRole, email: string) {
  return db.orm.public.User.create({ email, name: email, role });
}

async function createLarp() {
  return db.orm.public.Larp.create({
    name: "Kuvalarppi",
    language: Language.fi,
  });
}

describe("header images", () => {
  beforeEach(async () => {
    objects.clear();
    await truncateAll();
  });
  afterAll(async () => {
    await db.close();
    await pool.end();
  });

  it("stores the original and the revision 1 variants", async () => {
    const original = await jpeg(2400, 1600);
    const { id } = await createHeaderImage(original, meta, {
      source: "UPLOAD",
      userId: null,
    });

    expect(keysUnder(`header/${id}/`)).toEqual([
      `header/${id}/1/banner-1200.webp`,
      `header/${id}/1/banner-2400.webp`,
      `header/${id}/1/full-2400.webp`,
      `header/${id}/original.jpg`,
    ]);
    expect(objects.get(`header/${id}/original.jpg`)).toEqual(original);
    const banner = await sharp(
      objects.get(`header/${id}/1/banner-2400.webp`),
    ).metadata();
    expect([banner.width, banner.height]).toEqual([2400, 800]);
    const full = await sharp(
      objects.get(`header/${id}/1/full-2400.webp`),
    ).metadata();
    expect([full.width, full.height]).toEqual([2400, 1600]);

    const row = await db.orm.public.HeaderImage.first({ id });
    expect(row).toMatchObject({
      contentType: "image/jpeg",
      width: 2400,
      height: 1600,
      revision: 1,
      photographerCredit: "Kuvaaja Kuvaajainen",
    });
  });

  it("measures and crops an EXIF-rotated original in its upright orientation", async () => {
    // Stored landscape, shown portrait: the crop refers to the upright 1600x2400 picture.
    const rotated = await sharp({
      create: { width: 2400, height: 1600, channels: 3, background: "#888" },
    })
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer();
    const { id } = await createHeaderImage(
      rotated,
      { ...meta, crop: { x: 0, y: 0.4, w: 1, h: 1 / 9 } },
      { source: "UPLOAD", userId: null },
    );
    const row = await db.orm.public.HeaderImage.first({ id });
    expect([row?.width, row?.height]).toEqual([1600, 2400]);
    const full = await sharp(
      objects.get(`header/${id}/1/full-2400.webp`),
    ).metadata();
    expect([full.width, full.height]).toEqual([1600, 2400]);
  });

  it("refuses pictures narrower than 1200 px and leaves nothing behind", async () => {
    await expect(
      createHeaderImage(await jpeg(1000, 800), meta, {
        source: "UPLOAD",
        userId: null,
      }),
    ).rejects.toEqual(new HeaderImageFailure("tooSmall"));
    expect(objects.size).toBe(0);
    expect(await db.orm.public.HeaderImage.all()).toEqual([]);
  });

  it("refuses files that are not pictures", async () => {
    await expect(
      createHeaderImage(Buffer.from("not a picture"), meta, {
        source: "UPLOAD",
        userId: null,
      }),
    ).rejects.toEqual(new HeaderImageFailure("unsupported"));
  });

  it("creates from an upload and removes the uploaded object", async () => {
    const user = await createUser(UserRole.VERIFIED, "gm@example.com");
    const uploadKey = "uploads/00000000-0000-4000-8000-000000000000/kuva.jpg";
    objects.set(uploadKey, await jpeg(2400, 1600));

    const { id } = await createHeaderImageFromUpload(uploadKey, meta, user.id);

    expect(objects.has(uploadKey)).toBe(false);
    expect(keysUnder(`header/${id}/`)).toHaveLength(4);
    const row = await db.orm.public.HeaderImage.first({ id });
    expect(row?.uploadedById).toBe(user.id);
  });

  it("replaces a larp's previous header image and deletes its files and row", async () => {
    const larp = await createLarp();
    const first = await createHeaderImage(await jpeg(2400, 1600), meta, {
      source: "UPLOAD",
      userId: null,
    });
    await attachHeaderImage({ kind: "larp", id: larp.id }, first.id);
    const second = await createHeaderImage(await jpeg(2400, 1600), meta, {
      source: "UPLOAD",
      userId: null,
    });
    await attachHeaderImage({ kind: "larp", id: larp.id }, second.id);

    const reloaded = await db.orm.public.Larp.first({ id: larp.id });
    expect(reloaded?.headerImageId).toBe(second.id);
    expect(keysUnder(`header/${first.id}/`)).toEqual([]);
    expect(await db.orm.public.HeaderImage.first({ id: first.id })).toBeNull();
    expect(keysUnder(`header/${second.id}/`)).toHaveLength(4);
  });

  it("re-crops under a new revision and removes the old one", async () => {
    const { id } = await createHeaderImage(await jpeg(2400, 1600), meta, {
      source: "UPLOAD",
      userId: null,
    });

    await updateHeaderImage(id, {
      ...meta,
      crop: { x: 0.25, y: 0.25, w: 0.5, h: 0.25 },
    });

    const row = await db.orm.public.HeaderImage.first({ id });
    expect(row?.revision).toBe(2);
    expect(row?.cropX).toBe(0.25);
    expect(keysUnder(`header/${id}/1/`)).toEqual([]);
    expect(keysUnder(`header/${id}/2/`)).toHaveLength(3);
    expect(objects.has(`header/${id}/original.jpg`)).toBe(true);
  });

  it("keeps the revision when only the credit changes", async () => {
    const { id } = await createHeaderImage(await jpeg(2400, 1600), meta, {
      source: "UPLOAD",
      userId: null,
    });

    await updateHeaderImage(id, {
      ...meta,
      photographerCredit: "Toinen Kuvaaja",
    });

    const row = await db.orm.public.HeaderImage.first({ id });
    expect(row).toMatchObject({
      revision: 1,
      photographerCredit: "Toinen Kuvaaja",
    });
    expect(keysUnder(`header/${id}/1/`)).toHaveLength(3);
  });

  it("clears the larp's header image when the image is deleted", async () => {
    const larp = await createLarp();
    const { id } = await createHeaderImage(await jpeg(2400, 1600), meta, {
      source: "UPLOAD",
      userId: null,
    });
    await attachHeaderImage({ kind: "larp", id: larp.id }, id);

    await deleteHeaderImage(id);

    const reloaded = await db.orm.public.Larp.first({ id: larp.id });
    expect(reloaded?.headerImageId).toBeNull();
    expect(objects.size).toBe(0);
  });

  describe("authorizeHeaderImageTarget", () => {
    it("allows the larp's GM and moderators but not players or anonymous users", async () => {
      const larp = await createLarp();
      const gm = await createUser(UserRole.VERIFIED, "gm@example.com");
      const player = await createUser(UserRole.VERIFIED, "player@example.com");
      const moderator = await createUser(UserRole.MODERATOR, "mod@example.com");
      await db.orm.public.RelatedUser.create({
        larpId: larp.id,
        userId: gm.id,
        role: RelatedUserRole.GAME_MASTER,
      });
      await db.orm.public.RelatedUser.create({
        larpId: larp.id,
        userId: player.id,
        role: RelatedUserRole.PLAYER,
      });
      const target = { kind: "larp", id: larp.id } as const;

      expect(await authorizeHeaderImageTarget(gm, target)).toMatchObject({
        target,
      });
      expect(await authorizeHeaderImageTarget(moderator, target)).toMatchObject(
        { target },
      );
      expect(await authorizeHeaderImageTarget(player, target)).toBe(
        "forbidden",
      );
      expect(await authorizeHeaderImageTarget(null, target)).toBe("forbidden");
    });

    it("allows moderators and admins to change content pages", async () => {
      await db.orm.public.Page.create({
        slug: "front-page",
        language: "fi",
        title: "Etusivu",
        content: "",
      });
      const admin = await createUser(UserRole.ADMIN, "admin@example.com");
      const moderator = await createUser(UserRole.MODERATOR, "mod@example.com");
      const verified = await createUser(UserRole.VERIFIED, "user@example.com");
      const target = {
        kind: "page",
        slug: "front-page",
        language: "fi",
      } as const;

      expect(await authorizeHeaderImageTarget(admin, target)).toMatchObject({
        target,
      });
      expect(await authorizeHeaderImageTarget(moderator, target)).toMatchObject(
        { target },
      );
      expect(await authorizeHeaderImageTarget(verified, target)).toBe(
        "forbidden",
      );
      expect(
        await authorizeHeaderImageTarget(admin, { ...target, language: "en" }),
      ).toBe("notFound");
    });
  });
});
