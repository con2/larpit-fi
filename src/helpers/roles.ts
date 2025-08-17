import { User } from "@/generated/prisma";

export function canModerate(user: Pick<User, "role"> | null): boolean {
  return user?.role === "MODERATOR" || user?.role === "ADMIN";
}

export function canManageUsers(user: Pick<User, "role"> | null): boolean {
  return user?.role === "ADMIN";
}
