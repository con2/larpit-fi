"use server";

import { auth } from "@/auth";
import { EditStatus } from "@/generated/prisma";
import { canModerate } from "@/models/User";
import {
  approveRequest,
  rejectRequest,
  Resolution,
  zResolution,
} from "@/models/ModerationRequest";
import prisma from "@/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import z from "zod";

const ResolveRequest = z.object({
  resolution: zResolution,
  reason: z.string().max(2000).optional(),
});

export async function resolveRequest(
  locale: string,
  requestId: string,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error("Login required");
  }

  const [request, user] = await Promise.all([
    prisma.moderationRequest.findUnique({
      where: {
        id: requestId,
      },
    }),
    session?.user?.email
      ? prisma.user.findUnique({
          where: {
            email: session.user.email,
          },
        })
      : null,
  ]);

  if (!request) {
    throw new Error("Request not found");
  }

  if (!user) {
    throw new Error("User not found");
  }

  if (!canModerate(user)) {
    throw new Error("Insufficient privileges");
  }

  const resolveRequest = ResolveRequest.parse(
    Object.fromEntries(formData.entries())
  );
  console.log({ resolveRequest });

  switch (resolveRequest.resolution) {
    case Resolution.APPROVED:
      const larp = await approveRequest(
        request,
        user,
        resolveRequest.reason || null,
        EditStatus.APPROVED
      );
      return void redirect(`/larp/${larp.id}`);

    case Resolution.REJECTED:
      await rejectRequest(request, user, resolveRequest.reason || null);
      revalidatePath(`/${locale}/moderation/${request.id}`);
      revalidatePath(`/${locale}/moderation`);
      return void redirect(`/moderate`);
  }
}
