import { randomUUID } from "node:crypto";

export type VariantName = "banner-2400" | "banner-1200" | "full-2400";

const extensionOf: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export function headerPrefix(id: string): string {
  return `header/${id}/`;
}

export function originalKey(id: string, contentType: string): string {
  return `${headerPrefix(id)}original.${extensionOf[contentType] ?? "bin"}`;
}

/**
 * Variants carry the revision in their key so that a re-crop gets new URLs; otherwise browsers
 * would keep showing the old crop from cache until the presigned URLs change the next UTC day.
 */
export function revisionPrefix(id: string, revision: number): string {
  return `${headerPrefix(id)}${revision}/`;
}

export function variantKey(
  id: string,
  revision: number,
  name: VariantName,
): string {
  return `${revisionPrefix(id, revision)}${name}.webp`;
}

/** The filename is kept for readability; the UUID keeps concurrent uploads apart. */
export function uploadKeyFor(filename: string): string {
  const base = filename.split(/[\\/]/).pop() ?? filename;
  return `uploads/${randomUUID()}/${base.replace(/[^\w.-]+/g, "_")}`;
}

export const uploadKeyPattern = /^uploads\/[0-9a-f-]{36}\/[\w.-]+$/;
