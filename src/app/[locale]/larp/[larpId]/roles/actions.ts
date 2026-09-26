"use server";

import { auth } from "@/auth";
import { RelatedUserRole } from "@/prisma/enums";
import { isGmOrModerator, getUserFromSession } from "@/models/User";
import { db } from "@/prisma/db";
import { toSupportedLanguage } from "@/translations";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function larpWithRoles(larpId: string) {
  return db.orm.public.Larp.select("id")
    .include("relatedUsers", (r) => r.select("userId", "role"))
    .first({ id: larpId });
}

export async function removeRole(
  locale: string,
  larpId: string,
  targetUserId: string,
  role: RelatedUserRole,
  _formData: FormData,
) {
  locale = toSupportedLanguage(locale);
  const session = await auth();
  const user = await getUserFromSession(session);

  if (!user) throw new Error("Not logged in");

  const larp = await larpWithRoles(larpId);
  if (!larp) throw new Error("Larp not found");

  const isOwnRole = user.id === targetUserId;
  if (!isOwnRole && !isGmOrModerator(user, larp)) {
    throw new Error("Insufficient permissions");
  }

  await db.orm.public.RelatedUser.where({
    larpId,
    userId: targetUserId,
    role,
  }).delete();

  revalidatePath(`/${locale}/larp/${larpId}/roles`);
  redirect(`/${locale}/larp/${larpId}/roles`);
}

export async function removeUnauthenticatedSignup(
  locale: string,
  larpId: string,
  signupId: string,
  _formData: FormData,
) {
  locale = toSupportedLanguage(locale);
  const session = await auth();
  const user = await getUserFromSession(session);

  if (!user) throw new Error("Not logged in");

  const larp = await larpWithRoles(larpId);
  if (!larp) throw new Error("Larp not found");

  if (!isGmOrModerator(user, larp)) {
    throw new Error("Insufficient permissions");
  }

  await db.orm.public.UnauthenticatedSignup.where({ id: signupId }).delete();

  revalidatePath(`/${locale}/larp/${larpId}/roles`);
  redirect(`/${locale}/larp/${larpId}/roles`);
}
