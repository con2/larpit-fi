import {
  RelatedUser,
  RelatedUserRole,
  User,
  UserRole,
} from "@/generated/prisma";

export function canModerate(user: Pick<User, "role"> | null): boolean {
  return user?.role === UserRole.MODERATOR || user?.role === UserRole.ADMIN;
}

export function canManageUsers(user: Pick<User, "role"> | null): boolean {
  return user?.role === UserRole.ADMIN;
}

export function canCreateLarpWithoutPreModeration(
  user: Pick<User, "role"> | null
): boolean {
  switch (user?.role) {
    case UserRole.VERIFIED:
    case UserRole.ADMIN:
    case UserRole.MODERATOR:
      return true;
    default:
      return false;
  }
}

export function canCreateLarpWithoutPostModeration(
  user: Pick<User, "role"> | null
): boolean {
  switch (user?.role) {
    case UserRole.ADMIN:
    case UserRole.MODERATOR:
      return true;
    default:
      return false;
  }
}

enum LarpEditPolicy {
  NOPE_LOGIN_REQUIRED = "NOPE_LOGIN_REQUIRED",
  WITH_MODERATION = "WITH_MODERATION",
  WITHOUT_MODERATION = "WITHOUT_MODERATION",
}

export function getEditPolicyForUserAndLarp(
  user: Pick<User, "id" | "role"> | null,
  larp: {
    relatedUsers: Pick<RelatedUser, "userId" | "role">[];
  }
): LarpEditPolicy {
  // Non-logged in users cannot edit
  if (!user?.id) {
    return LarpEditPolicy.NOPE_LOGIN_REQUIRED;
  }

  // Admins and moderators can edit without moderation
  if (user.role === UserRole.ADMIN || user.role === UserRole.MODERATOR) {
    return LarpEditPolicy.WITHOUT_MODERATION;
  }

  // Editors and game masters can edit without moderation
  if (
    larp.relatedUsers.some(
      (relatedUser) =>
        relatedUser.userId === user.id &&
        (relatedUser.role === RelatedUserRole.EDITOR ||
          relatedUser.role === RelatedUserRole.GAME_MASTER)
    )
  ) {
    return LarpEditPolicy.WITHOUT_MODERATION;
  }

  // Other logged in users can edit with moderation
  return LarpEditPolicy.WITH_MODERATION;
}
