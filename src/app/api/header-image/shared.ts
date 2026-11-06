import { auth } from "@/auth";
import { headerImagesEnabled } from "@/config";
import {
  type AuthorizedHeaderImageTarget,
  authorizeHeaderImageTarget,
  type HeaderImageError,
  type HeaderImageTarget,
} from "@/models/HeaderImage";
import { getUserFromSession } from "@/models/User";

export const uploadContentTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];

export type HeaderImageApiError =
  HeaderImageError | "forbidden" | "badRequest" | "disabled";

const statusOf: Record<HeaderImageApiError, number> = {
  tooLarge: 413,
  tooManyPixels: 413,
  tooSmall: 422,
  unsupported: 415,
  forbidden: 403,
  notFound: 404,
  badRequest: 400,
  disabled: 503,
};

export function fail(error: HeaderImageApiError) {
  return Response.json({ error }, { status: statusOf[error] });
}

/** The signed-in user and the target they may change, or the error response to send instead. */
export async function authorizeRequest(
  target: HeaderImageTarget,
): Promise<(AuthorizedHeaderImageTarget & { userId: string }) | Response> {
  if (!headerImagesEnabled) return fail("disabled");
  const user = await getUserFromSession(await auth());
  if (!user) return fail("forbidden");
  const authorized = await authorizeHeaderImageTarget(user, target);
  if (typeof authorized === "string") return fail(authorized);
  return { ...authorized, userId: user.id };
}
