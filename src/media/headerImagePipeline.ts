import sharp, { type Metadata } from "sharp";

import {
  bannerAspect,
  type Crop,
  pixelCrop,
} from "@/models/HeaderImage.client";

import { type VariantName, variantKey } from "./headerImageKeys";

const maxInputPixels = 40_000_000;
const minOriginalWidth = 1200;

const acceptedFormats = new Set(["jpeg", "png", "webp", "heif"]);

export type PipelineError = "unsupported" | "tooManyPixels" | "tooSmall";

export class HeaderImagePipelineError extends Error {
  constructor(readonly code: PipelineError) {
    super(code);
  }
}

function open(data: Buffer) {
  return sharp(data, { failOn: "none", limitInputPixels: maxInputPixels });
}

export interface InspectedImage {
  format: string;
  /** Pixel size after EXIF rotation. */
  width: number;
  height: number;
}

export async function inspect(data: Buffer): Promise<InspectedImage> {
  let metadata: Metadata;
  try {
    metadata = await sharp(data, { failOn: "none" }).metadata();
  } catch {
    throw new HeaderImagePipelineError("unsupported");
  }
  // sharp reports AVIF as "heif" with compression "av1"; HEIC photos are refused.
  const isAvif = metadata.format === "heif" && metadata.compression === "av1";
  if (
    !metadata.format ||
    !acceptedFormats.has(metadata.format) ||
    (metadata.format === "heif" && !isAvif)
  )
    throw new HeaderImagePipelineError("unsupported");
  if (!metadata.width || !metadata.height)
    throw new HeaderImagePipelineError("unsupported");
  if (metadata.width * metadata.height > maxInputPixels)
    throw new HeaderImagePipelineError("tooManyPixels");

  const width = metadata.autoOrient.width;
  const height = metadata.autoOrient.height;
  if (width < minOriginalWidth) throw new HeaderImagePipelineError("tooSmall");
  return { format: isAvif ? "avif" : metadata.format, width, height };
}

export interface RenderedVariant {
  key: string;
  buffer: Buffer;
  contentType: string;
}

const webp = { quality: 82, effort: 4 } as const;

export async function renderVariants(
  id: string,
  original: Buffer,
  size: { width: number; height: number },
  crop: Crop,
  revision: number,
): Promise<RenderedVariant[]> {
  const region = pixelCrop(crop, size);
  const banner = (width: number) =>
    open(original)
      .autoOrient()
      .extract(region)
      .resize({ width, height: width / bannerAspect, fit: "cover" })
      .webp(webp)
      .toBuffer();
  const full = open(original)
    .autoOrient()
    .resize({
      width: 2400,
      height: 2400,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp(webp)
    .toBuffer();

  const rendered: [VariantName, Promise<Buffer>][] = [
    ["banner-2400", banner(2400)],
    ["banner-1200", banner(1200)],
    ["full-2400", full],
  ];
  return Promise.all(
    rendered.map(async ([name, buffer]) => ({
      key: variantKey(id, revision, name),
      buffer: await buffer,
      contentType: "image/webp",
    })),
  );
}
