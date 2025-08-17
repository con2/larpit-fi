import { User, UserRole } from "@/generated/prisma";

export function canModerate(user: Pick<User, "role"> | null): boolean {
  return user?.role === "MODERATOR" || user?.role === "ADMIN";
}

export function canManageUsers(user: Pick<User, "role"> | null): boolean {
  return user?.role === "ADMIN";
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
