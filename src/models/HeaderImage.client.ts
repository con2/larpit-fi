/**
 * Client-safe header image helpers: the crop geometry shared by the crop editor in the browser
 * and the image pipeline on the server.
 */
import z from "zod";

/** Banner width divided by height. */
export const bannerAspect = 3;
export const minZoom = 1;
export const maxZoom = 4;
/** Narrower crops are accepted but upscaled for the 2400px banner. */
export const recommendedCropWidth = 1200;

export const photographerCreditMaxLength = 200;

const fractionTolerance = 1e-6;

/** A crop as fractions of the EXIF-rotated original's width (x, w) and height (y, h). */
export const CropSchema = z
  .object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    w: z.number().min(0.05).max(1),
    h: z.number().min(0).max(1),
  })
  .refine((crop) => crop.x + crop.w <= 1 + fractionTolerance, {
    path: ["w"],
  })
  .refine((crop) => crop.y + crop.h <= 1 + fractionTolerance, {
    path: ["h"],
  });
export type Crop = z.infer<typeof CropSchema>;

export interface Size {
  width: number;
  height: number;
}

/**
 * How the image sits in the crop frame: `zoom` relative to the smallest scale that covers the
 * frame, offsets in frame pixels from the frame's top left corner to the image's (always <= 0).
 */
export interface CropView {
  zoom: number;
  offsetX: number;
  offsetY: number;
}

export function coverScale(frame: Size, image: Size): number {
  return Math.max(frame.width / image.width, frame.height / image.height);
}

function displayedSize(frame: Size, image: Size, zoom: number): Size {
  const scale = coverScale(frame, image) * zoom;
  return { width: image.width * scale, height: image.height * scale };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Keeps the frame fully covered by the image. */
export function clampView(view: CropView, frame: Size, image: Size): CropView {
  const zoom = clamp(view.zoom, minZoom, maxZoom);
  const displayed = displayedSize(frame, image, zoom);
  return {
    zoom,
    offsetX: clamp(view.offsetX, frame.width - displayed.width, 0),
    offsetY: clamp(view.offsetY, frame.height - displayed.height, 0),
  };
}

export function centeredView(frame: Size, image: Size): CropView {
  const displayed = displayedSize(frame, image, minZoom);
  return {
    zoom: minZoom,
    offsetX: (frame.width - displayed.width) / 2,
    offsetY: (frame.height - displayed.height) / 2,
  };
}

export function panView(
  view: CropView,
  dx: number,
  dy: number,
  frame: Size,
  image: Size,
): CropView {
  return clampView(
    { ...view, offsetX: view.offsetX + dx, offsetY: view.offsetY + dy },
    frame,
    image,
  );
}

/** Changes the zoom while keeping the point under the frame's centre in place. */
export function zoomView(
  view: CropView,
  zoom: number,
  frame: Size,
  image: Size,
): CropView {
  const nextZoom = clamp(zoom, minZoom, maxZoom);
  const ratio = nextZoom / view.zoom;
  const centerX = frame.width / 2;
  const centerY = frame.height / 2;
  return clampView(
    {
      zoom: nextZoom,
      offsetX: centerX - (centerX - view.offsetX) * ratio,
      offsetY: centerY - (centerY - view.offsetY) * ratio,
    },
    frame,
    image,
  );
}

export function cropFromView(view: CropView, frame: Size, image: Size): Crop {
  const displayed = displayedSize(frame, image, view.zoom);
  return {
    x: -view.offsetX / displayed.width,
    y: -view.offsetY / displayed.height,
    w: frame.width / displayed.width,
    h: frame.height / displayed.height,
  };
}

export function viewFromCrop(crop: Crop, frame: Size, image: Size): CropView {
  const zoom = frame.width / (crop.w * image.width) / coverScale(frame, image);
  const displayed = displayedSize(frame, image, zoom);
  return clampView(
    {
      zoom,
      offsetX: -crop.x * displayed.width,
      offsetY: -crop.y * displayed.height,
    },
    frame,
    image,
  );
}

export interface PixelCrop {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** The crop in whole pixels of an image of the given size, inside its bounds and exactly 3:1. */
export function pixelCrop(crop: Crop, image: Size): PixelCrop {
  const height = Math.max(
    1,
    Math.min(
      Math.round((crop.w * image.width) / bannerAspect),
      Math.floor(image.width / bannerAspect),
      image.height,
    ),
  );
  const width = height * bannerAspect;
  return {
    left: clamp(Math.round(crop.x * image.width), 0, image.width - width),
    top: clamp(Math.round(crop.y * image.height), 0, image.height - height),
    width,
    height,
  };
}

export function cropWidthPixels(crop: Crop, image: Size): number {
  return Math.round(crop.w * image.width);
}
