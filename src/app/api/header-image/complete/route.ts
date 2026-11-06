import z from "zod";

import { headerImagesEnabled } from "@/config";
import { uploadKeyPattern } from "@/media/headerImageKeys";
import {
  attachHeaderImage,
  createHeaderImageFromUpload,
  HeaderImageFailure,
  HeaderImageMetaSchema,
  HeaderImageTargetSchema,
  revalidateHeaderImageTargets,
} from "@/models/HeaderImage";

import { authorizeRequest, fail } from "../shared";

const BodySchema = HeaderImageMetaSchema.extend({
  target: HeaderImageTargetSchema,
  uploadKey: z.string().regex(uploadKeyPattern),
});

/** Second step of an upload: the original is in the bucket under `uploadKey`. */
export async function POST(request: Request) {
  if (!headerImagesEnabled) return fail("disabled");
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("badRequest");
  const { target, uploadKey, ...meta } = parsed.data;

  const authorized = await authorizeRequest(target);
  if (authorized instanceof Response) return authorized;

  try {
    const { id } = await createHeaderImageFromUpload(
      uploadKey,
      meta,
      authorized.userId,
    );
    await attachHeaderImage(target, id);
    revalidateHeaderImageTargets(target, { alias: authorized.alias });
    return Response.json({ id }, { status: 201 });
  } catch (error) {
    if (error instanceof HeaderImageFailure) return fail(error.code);
    throw error;
  }
}
