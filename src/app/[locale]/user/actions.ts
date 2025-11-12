"use server";

import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma";
import { canManageUsers } from "@/models/User";
import prisma from "@/prisma";
import { revalidatePath } from "next/cache";
import z from "zod";

const zUserRole = z.enum<typeof UserRole>(UserRole);

const SetUserRoleRequestSchema = z.object({
  role: zUserRole,
});

export async function setUserRole(
  locale: string,
  userId: string,
  formData: FormData
) {
  const session = await auth();
  const actor = session?.user?.email
    ? await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, role: true },
      })
    : null;
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
    Object.fromEntries(formData.entries())
  );

  console.log("AUDIT", "setUserRole", {
    actorUserId: actor.id,
    targetUserId: userId,
    role,
  });

  await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  revalidatePath(`/${locale}/user`);
}
