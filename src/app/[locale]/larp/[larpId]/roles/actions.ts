"use server";

import { auth } from "@/auth";
import { RelatedUserRole } from "@/generated/prisma/client";
import { isGmOrModerator, getUserFromSession } from "@/models/User";
import prisma from "@/prisma";
import { toSupportedLanguage } from "@/translations";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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

  const larp = await prisma.larp.findUnique({
    where: { id: larpId },
    select: {
      id: true,
      relatedUsers: { select: { userId: true, role: true } },
    },
  });
  if (!larp) throw new Error("Larp not found");

  const isOwnRole = user.id === targetUserId;
  if (!isOwnRole && !isGmOrModerator(user, larp)) {
    throw new Error("Insufficient permissions");
  }

  await prisma.relatedUser.delete({
    where: { larpId_userId_role: { larpId, userId: targetUserId, role } },
  });

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

  const larp = await prisma.larp.findUnique({
    where: { id: larpId },
    select: {
      id: true,
      relatedUsers: { select: { userId: true, role: true } },
    },
  });
  if (!larp) throw new Error("Larp not found");

  if (!isGmOrModerator(user, larp)) {
    throw new Error("Insufficient permissions");
  }

  await prisma.unauthenticatedSignup.delete({ where: { id: signupId } });

  revalidatePath(`/${locale}/larp/${larpId}/roles`);
  redirect(`/${locale}/larp/${larpId}/roles`);
}
