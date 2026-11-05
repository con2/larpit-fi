"use server";

import { auth } from "@/auth";
import { getUserFromSession } from "@/models/User";
import { RelatedUserRole, RelatedUserVisibility } from "@/prisma/enums";
import { db } from "@/prisma/db";
import { revalidatePath } from "next/cache";
import { validate as validateUuid } from "uuid";

export type OwnLarpRole =
  typeof RelatedUserRole.PLAYER | typeof RelatedUserRole.FAVORITE;

const ownLarpRoles: readonly string[] = [
  RelatedUserRole.PLAYER,
  RelatedUserRole.FAVORITE,
];

/** Sets rather than toggles, so that a double submit cannot undo itself. */
export async function setOwnLarpRole(
  larpId: string,
  role: OwnLarpRole,
  active: boolean,
  _formData: FormData,
) {
  if (!validateUuid(larpId) || !ownLarpRoles.includes(role)) {
    throw new Error("Invalid request");
  }

  const user = await getUserFromSession(await auth());
  if (!user) throw new Error("Not logged in");

  const larp = await db.orm.public.Larp.select("id").first({ id: larpId });
  if (!larp) throw new Error("Larp not found");

  if (active) {
    await db.orm.public.RelatedUser.upsert({
      create: {
        larpId,
        userId: user.id,
        role,
        visibility: RelatedUserVisibility.ONLY_ME,
      },
      update: {},
    });
  } else {
    await db.orm.public.RelatedUser.where({
      larpId,
      userId: user.id,
      role,
    }).delete();
  }

  revalidatePath("/[locale]/larp/[larpId]", "page");
  revalidatePath("/[locale]/[alias]", "page");
  revalidatePath("/[locale]/profile/larps", "page");
}
