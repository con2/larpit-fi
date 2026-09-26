"use server";

import { auth } from "@/auth";
import { UserRole } from "@/prisma/enums";
import { canManageUsers, getUserFromSession } from "@/models/User";
import { db } from "@/prisma/db";
import { revalidatePath } from "next/cache";
import z from "zod";

const zUserRole = z.enum(UserRole);

const SetUserRoleRequestSchema = z.object({
  role: zUserRole,
});

export async function setUserRole(
  locale: string,
  userId: string,
  formData: FormData,
) {
  const session = await auth();
  const actor = await getUserFromSession(session);
  if (!actor) {
    throw new Error("User not found");
  }
  if (!canManageUsers(actor)) {
    throw new Error("Unauthorized");
  }
  if (actor.id === userId) {
    throw new Error("Cannot change own role");
  }

  const { role } = SetUserRoleRequestSchema.parse(
    Object.fromEntries(formData.entries()),
  );

  console.log("AUDIT", "setUserRole", {
    actorUserId: actor.id,
    targetUserId: userId,
    role,
  });

  await db.orm.public.User.where({ id: userId }).update({ role });

  revalidatePath(`/${locale}/user`);
}
