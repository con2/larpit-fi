import { randomUUID } from "crypto";

import { iso } from "@/prisma/dates";
import { db } from "@/prisma/db";
import { RelatedUserRole, RelatedUserVisibility } from "@/prisma/enums";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

const localSignupRoles = [
  RelatedUserRole.LOCAL_SIGNUP_YES,
  RelatedUserRole.LOCAL_SIGNUP_MAYBE,
  RelatedUserRole.LOCAL_SIGNUP_NO,
];

/**
 * Create or update the pending (unverified) signup row for an unauthenticated user.
 * Returns the verificationCode to include in the verification email.
 */
export async function submitUnauthenticatedSignup(
  larpId: string,
  rawEmail: string,
  displayName: string,
  signupStatus: RelatedUserRole,
  visibility: RelatedUserVisibility,
): Promise<string> {
  const email = normalizeEmail(rawEmail);
  const verificationCode = randomUUID();

  const existing = await db.orm.public.UnauthenticatedSignup.where({
    larpId,
    email,
  })
    .where((s) => s.verifiedAt.isNull())
    .select("id")
    .first();

  if (existing) {
    await db.orm.public.UnauthenticatedSignup.where({ id: existing.id }).update(
      {
        displayName,
        signupStatus,
        visibility,
        verificationCode,
        verifiedAt: null,
      },
    );
  } else {
    await db.orm.public.UnauthenticatedSignup.create({
      larpId,
      email,
      displayName,
      signupStatus,
      visibility,
      verificationCode,
    });
  }

  return verificationCode;
}

/**
 * Verify an unauthenticated signup by its verificationCode.
 * - If the email matches a verified user account, fold: delete all UnauthenticatedSignup rows
 *   for (larpId, email) and create/replace a RelatedUser.
 * - Otherwise: delete any existing verified row and promote the pending row to verified.
 *
 * Returns the larpId of the affected signup, or null if the code was not found or already verified.
 */
export async function verifyUnauthenticatedSignup(
  verificationCode: string,
): Promise<string | null> {
  const signup = await db.orm.public.UnauthenticatedSignup.first({
    verificationCode,
  });

  if (!signup || signup.verifiedAt !== null) return null;

  const { larpId, email, signupStatus, visibility } = signup;

  // Check if a verified user account exists for this email
  const user = await db.orm.public.User.select("id", "emailVerified").first({
    email,
  });

  if (user && user.emailVerified !== null) {
    // Fold path: convert to RelatedUser
    await db.transaction(async (tx) => {
      await tx.orm.public.UnauthenticatedSignup.where({
        larpId,
        email,
      }).deleteAndCount();
      // Replace any existing LOCAL_SIGNUP_* RelatedUser for this user on this larp
      await tx.orm.public.RelatedUser.where({ larpId, userId: user.id })
        .where((r) => r.role.in(localSignupRoles))
        .deleteAndCount();
      await tx.orm.public.RelatedUser.create({
        larpId,
        userId: user.id,
        role: signupStatus,
        visibility,
      });
    });
  } else {
    // Keep path: promote pending row to verified, replacing any old verified row
    await db.transaction(async (tx) => {
      await tx.orm.public.UnauthenticatedSignup.where({ larpId, email })
        .where((s) => s.verifiedAt.isNotNull())
        .deleteAndCount();
      await tx.orm.public.UnauthenticatedSignup.where({ id: signup.id }).update(
        { verifiedAt: iso(new Date()) },
      );
    });
  }

  return larpId;
}

/**
 * Create or replace the LOCAL_SIGNUP_* RelatedUser for an authenticated user on a larp.
 * Uses a transaction to delete-then-create (composite PK includes role).
 */
export async function upsertLocalSignup(
  larpId: string,
  userId: string,
  signupStatus: RelatedUserRole,
  visibility: RelatedUserVisibility,
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.orm.public.RelatedUser.where({ larpId, userId })
      .where((r) => r.role.in(localSignupRoles))
      .deleteAndCount();
    await tx.orm.public.RelatedUser.create({
      larpId,
      userId,
      role: signupStatus,
      visibility,
    });
  });
}

/**
 * Delete all UnauthenticatedSignup rows (verified and pending) for a given (larpId, email).
 * Called when an authenticated user signs up, superseding any unauth rows.
 */
export async function deleteUnauthenticatedSignupsForUser(
  larpId: string,
  rawEmail: string,
): Promise<void> {
  const email = normalizeEmail(rawEmail);
  await db.orm.public.UnauthenticatedSignup.where({
    larpId,
    email,
  }).deleteAndCount();
}
