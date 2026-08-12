import {
  RelatedUserRole,
  RelatedUserVisibility,
} from "@/generated/prisma/client";
import prisma from "@/prisma";
import { randomUUID } from "crypto";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

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

  const existing = await prisma.unauthenticatedSignup.findFirst({
    where: { larpId, email, verifiedAt: null },
    select: { id: true },
  });

  if (existing) {
    await prisma.unauthenticatedSignup.update({
      where: { id: existing.id },
      data: {
        displayName,
        signupStatus,
        visibility,
        verificationCode,
        verifiedAt: null,
      },
    });
  } else {
    await prisma.unauthenticatedSignup.create({
      data: {
        larpId,
        email,
        displayName,
        signupStatus,
        visibility,
        verificationCode,
      },
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
  const signup = await prisma.unauthenticatedSignup.findUnique({
    where: { verificationCode },
  });

  if (!signup || signup.verifiedAt !== null) return null;

  const { larpId, email, signupStatus, visibility } = signup;

  // Check if a verified user account exists for this email
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, emailVerified: true },
  });

  if (user && user.emailVerified !== null) {
    // Fold path: convert to RelatedUser
    await prisma.$transaction([
      // Remove all unauth signup rows for this (larp, email)
      prisma.unauthenticatedSignup.deleteMany({ where: { larpId, email } }),
      // Replace any existing LOCAL_SIGNUP_* RelatedUser for this user on this larp
      prisma.relatedUser.deleteMany({
        where: {
          larpId,
          userId: user.id,
          role: {
            in: [
              RelatedUserRole.LOCAL_SIGNUP_YES,
              RelatedUserRole.LOCAL_SIGNUP_MAYBE,
              RelatedUserRole.LOCAL_SIGNUP_NO,
            ],
          },
        },
      }),
      prisma.relatedUser.create({
        data: { larpId, userId: user.id, role: signupStatus, visibility },
      }),
    ]);
  } else {
    // Keep path: promote pending row to verified, replacing any old verified row
    const oldVerified = await prisma.unauthenticatedSignup.findFirst({
      where: { larpId, email, verifiedAt: { not: null } },
      select: { id: true },
    });

    await prisma.$transaction([
      ...(oldVerified
        ? [
            prisma.unauthenticatedSignup.delete({
              where: { id: oldVerified.id },
            }),
          ]
        : []),
      prisma.unauthenticatedSignup.update({
        where: { id: signup.id },
        data: { verifiedAt: new Date() },
      }),
    ]);
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
  await prisma.$transaction([
    prisma.relatedUser.deleteMany({
      where: {
        larpId,
        userId,
        role: {
          in: [
            RelatedUserRole.LOCAL_SIGNUP_YES,
            RelatedUserRole.LOCAL_SIGNUP_MAYBE,
            RelatedUserRole.LOCAL_SIGNUP_NO,
          ],
        },
      },
    }),
    prisma.relatedUser.create({
      data: { larpId, userId, role: signupStatus, visibility },
    }),
  ]);
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
  await prisma.unauthenticatedSignup.deleteMany({ where: { larpId, email } });
}
