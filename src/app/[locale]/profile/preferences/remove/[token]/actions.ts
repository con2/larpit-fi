"use server";

import { auth } from "@/auth";
import { TokenType } from "@/prisma/enums";
import { findAccountRemovalToken, getUserFromSession } from "@/models/User";
import { db } from "@/prisma/db";
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

  await db.transaction(async (tx) => {
    // VerificationTokens have no FK to the user, so they don't cascade; remove
    // the user's removal tokens explicitly.
    await tx.orm.public.VerificationToken.where({
      identifier: user.id,
      type: TokenType.ACCOUNT_REMOVAL,
    }).deleteAndCount();
    // Deleting the user cascades RelatedUser and Account rows.
    // ModerationRequest.submitter/resolvedBy are onDelete: SetNull, so the
    // user's moderation history is preserved (submitterName/submitterEmail are
    // denormalized). Larps created by the user are NOT deleted (no FK from Larp
    // to User; ownership is only via the now-removed RelatedUser CREATED_BY rows).
    await tx.orm.public.User.where({ id: user.id }).delete();
  });

  revalidatePath(`/${locale}`);
  return void redirect(`/?accountRemoved=1`);
}
