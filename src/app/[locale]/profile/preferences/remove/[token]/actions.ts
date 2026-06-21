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
    // VerificationTokens have no FK to the user, so they don't cascade; remove
    // the user's removal tokens explicitly.
    prisma.verificationToken.deleteMany({
      where: { identifier: user.id, type: TokenType.ACCOUNT_REMOVAL },
    }),
    // Deleting the user cascades RelatedUser, Session, Account and Authenticator
    // rows. ModerationRequest.submitter/resolvedBy are onDelete: SetNull, so the
    // user's moderation history is preserved (submitterName/submitterEmail are
    // denormalized). Larps created by the user are NOT deleted (no FK from Larp
    // to User; ownership is only via the now-removed RelatedUser CREATED_BY rows).
    prisma.user.delete({ where: { id: user.id } }),
  ]);

  revalidatePath(`/${locale}`);
  return void redirect(`/?accountRemoved=1`);
}
