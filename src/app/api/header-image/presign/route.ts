import z from "zod";

import { headerImagesEnabled } from "@/config";
import { uploadKeyFor } from "@/media/headerImageKeys";
import { getStorage } from "@/media/storage";
import { HeaderImageTargetSchema, maxUploadBytes } from "@/models/HeaderImage";

import { authorizeRequest, fail, uploadContentTypes } from "../shared";

const BodySchema = z.object({
  target: HeaderImageTargetSchema,
  filename: z.string().min(1).max(255),
  contentType: z.string(),
  size: z.number().int().nonnegative(),
});

/**
 * First step of an upload: the browser asks where to PUT the original. Uploads go straight to the
 * bucket because the ingress limits request bodies to the app to 1 MB.
 */
export async function POST(request: Request) {
  if (!headerImagesEnabled) return fail("disabled");
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("badRequest");
  const { target, filename, contentType, size } = parsed.data;

  const authorized = await authorizeRequest(target);
  if (authorized instanceof Response) return authorized;

  if (!uploadContentTypes.includes(contentType)) return fail("unsupported");
  if (size > maxUploadBytes) return fail("tooLarge");

  const uploadKey = uploadKeyFor(filename);
  const presigned = await getStorage().presignUpload(uploadKey, contentType);
  return Response.json({ uploadKey, ...presigned });
}
