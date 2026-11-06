import { s3 } from "@/config";

import { S3ObjectStorage } from "./s3";

export interface PresignedUpload {
  url: string;
  /** Headers the browser must send with the PUT, exactly as given; they are part of the signature. */
  headers: Record<string, string>;
}

/**
 * Where header image files live. Uploads and any later picture source (such as larppikuvat.fi)
 * write through this interface; tests replace `getStorage` with an in-memory implementation.
 */
export interface ObjectStorage {
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<Buffer | null>;
  stat(key: string): Promise<{ size: number } | null>;
  delete(key: string): Promise<void>;
  deletePrefix(prefix: string): Promise<void>;
  /** A URL a browser can fetch the object from. */
  url(key: string): string;
  presignUpload(key: string, contentType: string): Promise<PresignedUpload>;
}

let storage: ObjectStorage | undefined;

export function getStorage(): ObjectStorage {
  if (!storage) {
    if (!s3.bucket)
      throw new Error("Header images are disabled: S3_BUCKET is not set");
    const missing = (
      [
        ["S3_ENDPOINT", s3.endpoint],
        ["S3_ACCESS_KEY_ID", s3.accessKeyId],
        ["S3_SECRET_ACCESS_KEY", s3.secretAccessKey],
      ] as const
    )
      .filter(([, value]) => !value)
      .map(([name]) => name);
    if (missing.length)
      throw new Error(`S3_BUCKET is set but ${missing.join(", ")} is not`);
    storage = new S3ObjectStorage(s3);
  }
  return storage;
}
