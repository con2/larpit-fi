import {
  EditStatus,
  RelatedUser,
  RelatedUserRole,
  TokenType,
  User,
  UserRole,
} from "@/generated/prisma/client";
import prisma from "@/prisma";
import { validate as validateUuid } from "uuid";
import z from "zod";

/// Display name validation, shared between the HTML form (maxLength) and the
/// saveUserPreferences server action. Trims whitespace, requires 1–80 visible
/// characters and disallows control characters (newlines, tabs, etc.).
export const displayNameMaxLength = 80;
export const DisplayNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(displayNameMaxLength)
  .regex(/^[^\p{Cc}]+$/u);

export function canModerate(user: Pick<User, "role"> | null): boolean {
  return user?.role === UserRole.MODERATOR || user?.role === UserRole.ADMIN;
}

export function canManageUsers(user: Pick<User, "role"> | null): boolean {
  return user?.role === UserRole.ADMIN;
}

export function canEditPages(user: Pick<User, "role"> | null): boolean {
  return user?.role === UserRole.ADMIN;
}

/// When this user makes a request to create a larp,
/// this determines the status of the created moderation request.
export function getNewLarpInitialStatusForUser(
  user: Pick<User, "role"> | null,
) {
  if (!user) {
    return EditStatus.PENDING_VERIFICATION;
  }

  switch (user.role) {
    case UserRole.ADMIN:
    case UserRole.MODERATOR:
      return EditStatus.APPROVED;
    case UserRole.VERIFIED:
      return EditStatus.AUTO_APPROVED;
    case UserRole.NOT_VERIFIED:
    default:
      return EditStatus.PENDING_VERIFICATION;
  }
}

/// When this user makes a request to create a larp,
/// this determines the status of the created moderation request.
/// If the user cannot edit the larp, returns null.
export function getEditLarpInitialStatusForUserAndLarp(
  user: Pick<User, "id" | "role"> | null,
  larp: {
    relatedUsers: Pick<RelatedUser, "userId" | "role">[];
  },
) {
  // Non-logged in users cannot edit
  if (!user?.id) {
    return null;
  }

  // Admins and moderators can edit without moderation
  if (user.role === UserRole.ADMIN || user.role === UserRole.MODERATOR) {
    return EditStatus.APPROVED;
  }

  // Editors and game masters can edit without moderation
  if (
    larp.relatedUsers.some(
      (relatedUser) =>
        relatedUser.userId === user.id &&
        (relatedUser.role === RelatedUserRole.EDITOR ||
          relatedUser.role === RelatedUserRole.GAME_MASTER),
    )
  ) {
    return EditStatus.AUTO_APPROVED;
  }

  // Other logged in users can edit with moderation
  return EditStatus.VERIFIED;
}

/// Only admins can directly delete pages.
export function getDeleteLarpInitialStatusForUser(
  user: Pick<User, "role"> | null,
) {
  if (!user) {
    return null;
  }

  switch (user.role) {
    case UserRole.ADMIN:
      return EditStatus.APPROVED;
    case UserRole.MODERATOR:
    case UserRole.VERIFIED:
    case UserRole.NOT_VERIFIED:
    default:
      return EditStatus.VERIFIED;
  }
}

/// Looks up a non-expired ACCOUNT_REMOVAL token belonging to the given user.
export async function findAccountRemovalToken(userId: string, token: string) {
  if (!validateUuid(token)) {
    return null;
  }

  return prisma.verificationToken.findFirst({
    where: {
      identifier: userId,
      token,
      type: TokenType.ACCOUNT_REMOVAL,
      expires: { gte: new Date() },
    },
  });
}

export async function getUserFromSession(
  session: { user?: { email?: string | null } | null } | null | undefined,
) {
  return session?.user?.email
    ? await prisma.user.findUnique({
        where: {
          email: session.user.email,
        },
        select: {
          id: true,
          role: true,
          name: true,
          email: true,
        },
      })
    : null;
}

const rolesHierarchy = [
  RelatedUserRole.GAME_MASTER,
  RelatedUserRole.TEAM_MEMBER,
  RelatedUserRole.VOLUNTEER,
  RelatedUserRole.PLAYER,
];

export function getHighestUserRoleForLarp(
  user: Pick<User, "id"> | null,
  larp: {
    relatedUsers: Pick<RelatedUser, "userId" | "role">[];
  },
) {
  if (!user?.id) {
    return "NONE";
  }

  for (const role of rolesHierarchy) {
    if (
      larp.relatedUsers.some(
        (relatedUser) =>
          relatedUser.userId === user.id && relatedUser.role === role,
      )
    ) {
      return role;
    }
  }

  return "NONE";
}
