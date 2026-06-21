"use server";

import { auth } from "@/auth";
import { TokenType } from "@/generated/prisma/client";
import { findAccountRemovalToken, getUserFromSession } from "@/models/User";
import prisma from "@/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function confirmAccountRemoval(locale: string, token: string) {
  const session = await auth();
  const user = await getUserFromSession(session);
  if (!user) {
    throw new Error("Not logged in");
  }

  const verificationToken = await findAccountRemovalToken(user.id, token);
  if (!verificationToken) {
    throw new Error("Invalid or expired account removal token");
  }

  await prisma.$transaction([
    // Preserve moderation history that would otherwise cascade-delete with the
    // user. The denormalized submitterName/submitterEmail keep requests readable.
    prisma.moderationRequest.updateMany({
      where: { submitterId: user.id },
      data: { submitterId: null },
    }),
    prisma.moderationRequest.updateMany({
      where: { resolvedById: user.id },
      data: { resolvedById: null },
    }),
    // Deleting the user cascades RelatedUser, Session, Account and Authenticator
    // rows. Larps created by the user are NOT deleted (no FK from Larp to User;
    // ownership is only via the now-removed RelatedUser CREATED_BY rows).
    prisma.verificationToken.deleteMany({
      where: { identifier: user.id, type: TokenType.ACCOUNT_REMOVAL },
    }),
    prisma.user.delete({ where: { id: user.id } }),
  ]);

  revalidatePath(`/${locale}`);
  return void redirect(`/?accountRemoved=1`);
}
