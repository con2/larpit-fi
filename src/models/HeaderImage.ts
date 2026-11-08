import { revalidatePath } from "next/cache";
import z from "zod";

import {
  headerPrefix,
  originalKey,
  revisionPrefix,
  variantKey,
} from "@/media/headerImageKeys";
import {
  HeaderImagePipelineError,
  inspect,
  renderVariants,
} from "@/media/headerImagePipeline";
import { headerImagesEnabled } from "@/config";
import { getStorage } from "@/media/storage";
import { db } from "@/prisma/db";
import { HeaderImageSource } from "@/prisma/enums";
import type { HeaderImage, User } from "@/prisma/models";
import { supportedLanguages } from "@/translations";

import {
  bannerAspect,
  type Crop,
  CropSchema,
  photographerCreditMaxLength,
} from "./HeaderImage.client";
import { frontPageSlug } from "./Page";
import { canEditPages, isGmOrModerator } from "./User";

export const maxUploadBytes = 25 * 1024 * 1024;

export const HeaderImageMetaSchema = z.object({
  photographerCredit: z.string().trim().min(1).max(photographerCreditMaxLength),
  crop: CropSchema,
});
export type HeaderImageMeta = z.infer<typeof HeaderImageMetaSchema>;

export type HeaderImageTarget =
  | { kind: "larp"; id: string }
  | { kind: "page"; slug: string; language: string };

export const HeaderImageTargetSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("larp"), id: z.uuid() }),
  z.object({
    kind: z.literal("page"),
    slug: z.string().min(1).max(200),
    language: z.string().min(2).max(2),
  }),
]);

export interface AuthorizedHeaderImageTarget {
  target: HeaderImageTarget;
  /** The larp's alias route, which shows the header image too. */
  alias: string | null;
  headerImageId: string | null;
}

/**
 * Larp header images are managed by the larp's GMs and moderators; content page header images
 * by admins, who are the only ones who edit content pages.
 */
export async function authorizeHeaderImageTarget(
  user: Pick<User, "id" | "role"> | null,
  target: HeaderImageTarget,
): Promise<AuthorizedHeaderImageTarget | "forbidden" | "notFound"> {
  if (!user) return "forbidden";
  if (target.kind === "larp") {
    const larp = await db.orm.public.Larp.select("id", "alias", "headerImageId")
      .include("relatedUsers", (r) => r.select("userId", "role"))
      .first({ id: target.id });
    if (!larp) return "notFound";
    if (!isGmOrModerator(user, larp)) return "forbidden";
    return { target, alias: larp.alias, headerImageId: larp.headerImageId };
  }
  if (!canEditPages(user)) return "forbidden";
  const page = await db.orm.public.Page.select("headerImageId").first({
    slug: target.slug,
    language: target.language,
  });
  if (!page) return "notFound";
  return { target, alias: null, headerImageId: page.headerImageId };
}

export type HeaderImageError =
  "tooLarge" | "tooManyPixels" | "tooSmall" | "unsupported" | "notFound";

export class HeaderImageFailure extends Error {
  constructor(readonly code: HeaderImageError) {
    super(code);
  }
}

/** Everything a component needs to render a header image, as plain strings. */
export interface HeaderImageView {
  banner: { src: string; srcSet: string };
  full: string;
  credit: string;
  width: number;
  height: number;
  crop: Crop;
}

export type HeaderImageRow = Pick<
  HeaderImage,
  | "id"
  | "revision"
  | "photographerCredit"
  | "width"
  | "height"
  | "cropX"
  | "cropY"
  | "cropWidth"
  | "cropHeight"
>;

function cropOf(row: HeaderImageRow): Crop {
  return { x: row.cropX, y: row.cropY, w: row.cropWidth, h: row.cropHeight };
}

function cropColumns(crop: Crop) {
  return {
    cropX: crop.x,
    cropY: crop.y,
    cropWidth: crop.w,
    cropHeight: crop.h,
  };
}

export function headerImageView(row: HeaderImageRow): HeaderImageView {
  const storage = getStorage();
  const banner1200 = storage.url(
    variantKey(row.id, row.revision, "banner-1200"),
  );
  const banner2400 = storage.url(
    variantKey(row.id, row.revision, "banner-2400"),
  );
  return {
    banner: {
      src: banner2400,
      srcSet: `${banner1200} 1200w, ${banner2400} 2400w`,
    },
    full: storage.url(variantKey(row.id, row.revision, "full-2400")),
    credit: row.photographerCredit,
    width: row.width,
    height: row.height,
    crop: cropOf(row),
  };
}

async function putVariants(
  id: string,
  original: Buffer,
  size: { width: number; height: number },
  crop: Crop,
  revision: number,
) {
  const storage = getStorage();
  const variants = await renderVariants(id, original, size, crop, revision);
  await Promise.all(
    variants.map((variant) =>
      storage.put(variant.key, variant.buffer, variant.contentType),
    ),
  );
}

/**
 * Stores a header image from the original's bytes, whichever source they came from. Throws
 * `HeaderImageFailure` for pictures the pipeline refuses.
 */
export async function createHeaderImage(
  original: Buffer,
  meta: HeaderImageMeta,
  options: {
    source: HeaderImageSource;
    larppikuvatPictureId?: string | null;
    userId: string | null;
  },
): Promise<Pick<HeaderImage, "id">> {
  let inspected;
  try {
    inspected = await inspect(original);
  } catch (error) {
    if (error instanceof HeaderImagePipelineError)
      throw new HeaderImageFailure(error.code);
    throw error;
  }
  const contentType = `image/${inspected.format}`;
  const row = await db.orm.public.HeaderImage.create({
    source: options.source,
    larppikuvatPictureId: options.larppikuvatPictureId ?? null,
    contentType,
    width: inspected.width,
    height: inspected.height,
    ...cropColumns(meta.crop),
    revision: 1,
    photographerCredit: meta.photographerCredit,
    uploadedById: options.userId,
  });

  try {
    const storage = getStorage();
    await storage.put(originalKey(row.id, contentType), original, contentType);
    await putVariants(row.id, original, inspected, meta.crop, 1);
  } catch (error) {
    await deleteHeaderImage(row.id);
    throw error;
  }
  return { id: row.id };
}

/** Second step of a direct upload: the browser has PUT the original under `uploadKey`. */
export async function createHeaderImageFromUpload(
  uploadKey: string,
  meta: HeaderImageMeta,
  userId: string,
): Promise<Pick<HeaderImage, "id">> {
  const storage = getStorage();
  try {
    // A presigned PUT cannot limit the size, so the cap is enforced after the fact.
    const stat = await storage.stat(uploadKey);
    if (!stat) throw new HeaderImageFailure("notFound");
    if (stat.size > maxUploadBytes) throw new HeaderImageFailure("tooLarge");
    const original = await storage.get(uploadKey);
    if (!original) throw new HeaderImageFailure("notFound");
    return await createHeaderImage(original, meta, {
      source: HeaderImageSource.UPLOAD,
      userId,
    });
  } finally {
    await storage.delete(uploadKey);
  }
}

async function currentHeaderImageId(
  target: HeaderImageTarget,
): Promise<string | null> {
  if (target.kind === "larp") {
    const larp = await db.orm.public.Larp.select("headerImageId").first({
      id: target.id,
    });
    return larp?.headerImageId ?? null;
  }
  const page = await db.orm.public.Page.select("headerImageId").first({
    slug: target.slug,
    language: target.language,
  });
  return page?.headerImageId ?? null;
}

async function setHeaderImageId(
  target: HeaderImageTarget,
  headerImageId: string | null,
) {
  if (target.kind === "larp") {
    await db.orm.public.Larp.where({ id: target.id }).update({ headerImageId });
  } else {
    await db.orm.public.Page.where({
      slug: target.slug,
      language: target.language,
    }).update({ headerImageId });
  }
}

/** Makes the image the target's header image, deleting the one it replaces. */
export async function attachHeaderImage(
  target: HeaderImageTarget,
  imageId: string,
) {
  const oldId = await currentHeaderImageId(target);
  await setHeaderImageId(target, imageId);
  if (oldId && oldId !== imageId) await deleteHeaderImage(oldId);
}

/** Removes the target's header image, if it has one. */
export async function detachHeaderImage(target: HeaderImageTarget) {
  const oldId = await currentHeaderImageId(target);
  if (!oldId) return;
  await setHeaderImageId(target, null);
  await deleteHeaderImage(oldId);
}

/** Updates the credit, re-rendering the variants under a new revision if the crop changed. */
export async function updateHeaderImage(id: string, meta: HeaderImageMeta) {
  const row = await db.orm.public.HeaderImage.first({ id });
  if (!row) throw new HeaderImageFailure("notFound");
  const settings = { photographerCredit: meta.photographerCredit };

  const old = cropOf(row);
  const cropChanged = (["x", "y", "w", "h"] as const).some(
    (field) => Math.abs(old[field] - meta.crop[field]) > 1e-6,
  );
  if (!cropChanged) {
    await db.orm.public.HeaderImage.where({ id }).update(settings);
    return;
  }

  const storage = getStorage();
  const original = await storage.get(originalKey(id, row.contentType));
  if (!original) throw new HeaderImageFailure("notFound");
  const revision = row.revision + 1;
  await putVariants(id, original, row, meta.crop, revision);
  await db.orm.public.HeaderImage.where({ id }).update({
    ...settings,
    ...cropColumns(meta.crop),
    revision,
  });
  await storage.deletePrefix(revisionPrefix(id, row.revision));
}

/** Deletes the image's files and row; larps and pages showing it lose their header image. */
export async function deleteHeaderImage(id: string) {
  await getStorage().deletePrefix(headerPrefix(id));
  await db.orm.public.HeaderImage.where({ id }).delete();
}

export function revalidateHeaderImageTargets(
  target: HeaderImageTarget,
  options: { alias?: string | null } = {},
) {
  for (const locale of supportedLanguages) {
    if (target.kind === "larp") {
      revalidatePath(`/${locale}/larp/${target.id}`);
      if (options.alias) revalidatePath(`/${locale}/${options.alias}`);
    } else if (target.slug === frontPageSlug) {
      revalidatePath(`/${locale}`);
    } else {
      revalidatePath(`/${locale}/page/${target.slug}`);
      revalidatePath(`/${locale}/page/${target.slug}/${target.language}`);
    }
  }
}

/** The view of a larp's or page's header image, or null when it has none or the feature is off. */
export function headerImageViewOrNull(
  row: HeaderImageRow | null | undefined,
): HeaderImageView | null {
  return row && headerImagesEnabled ? headerImageView(row) : null;
}

/** The 1200 px banner, for link previews (Open Graph, Twitter cards). */
export function headerImageSocialPreviewOrNull(
  row: HeaderImageRow | null | undefined,
): { url: string; width: number; height: number } | null {
  if (!row || !headerImagesEnabled) return null;
  const width = 1200;
  return {
    url: getStorage().url(variantKey(row.id, row.revision, "banner-1200")),
    width,
    height: width / bannerAspect,
  };
}
