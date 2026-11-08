import { auth } from "@/auth";
import { headerImagesEnabled } from "@/config";
import { getUserFromSession } from "@/models/User";

import {
  type AuthorizedHeaderImageTarget,
  authorizeHeaderImageTarget,
  detachHeaderImage,
  HeaderImageMetaSchema,
  type HeaderImageTarget,
  HeaderImageTargetSchema,
  revalidateHeaderImageTargets,
  updateHeaderImage,
} from "./HeaderImage";

async function authorizeAction(
  target: HeaderImageTarget,
): Promise<AuthorizedHeaderImageTarget> {
  if (!headerImagesEnabled) throw new Error("Header images are disabled");
  const user = await getUserFromSession(await auth());
  const authorized = await authorizeHeaderImageTarget(
    user,
    HeaderImageTargetSchema.parse(target),
  );
  if (authorized === "forbidden") throw new Error("Insufficient permissions");
  if (authorized === "notFound") throw new Error("Not found");
  return authorized;
}

/** Form fields: `photographerCredit` and the crop as `cropX`, `cropY`, `cropW`, `cropH`. */
export async function saveHeaderImageSettingsFor(
  target: HeaderImageTarget,
  formData: FormData,
) {
  const authorized = await authorizeAction(target);
  if (!authorized.headerImageId) throw new Error("No header image");
  const meta = HeaderImageMetaSchema.parse({
    photographerCredit: formData.get("photographerCredit"),
    crop: {
      x: Number(formData.get("cropX")),
      y: Number(formData.get("cropY")),
      w: Number(formData.get("cropW")),
      h: Number(formData.get("cropH")),
    },
  });
  await updateHeaderImage(authorized.headerImageId, meta);
  revalidateHeaderImageTargets(target, { alias: authorized.alias });
}

export async function removeHeaderImageFrom(target: HeaderImageTarget) {
  const authorized = await authorizeAction(target);
  await detachHeaderImage(target);
  revalidateHeaderImageTargets(target, { alias: authorized.alias });
}
