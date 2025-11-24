"use server";

import { auth } from "@/auth";
import { EditStatus } from "@/generated/prisma/client";
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

const MarkCheckedRequest = z.object({
  reason: z.string().max(2000).optional(),
});
const ResolveRequest = MarkCheckedRequest.extend({
  resolution: zResolution,
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

  const [request, actor] = await Promise.all([
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

  if (!actor) {
    throw new Error("User not found");
  }

  if (!canModerate(actor)) {
    throw new Error("Insufficient privileges");
  }

  const resolveRequest = ResolveRequest.parse(
    Object.fromEntries(formData.entries())
  );

  console.log("AUDIT", "resolveRequest", {
    actorUserId: actor.id,
    requestId: request.id,
    resolution: resolveRequest.resolution,
  });

  switch (resolveRequest.resolution) {
    case Resolution.APPROVED:
      const larp = await approveRequest(
        request,
        actor,
        resolveRequest.reason || null,
        EditStatus.APPROVED
      );
      return void redirect(`/larp/${larp.id}`);

    case Resolution.REJECTED:
      await rejectRequest(request, actor, resolveRequest.reason || null);
      revalidatePath(`/${locale}/moderation/${request.id}`);
      revalidatePath(`/${locale}/moderation`);
      return void redirect(`/moderate`);
  }
}

export async function markChecked(
  locale: string,
  requestId: string,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error("Login required");
  }

  const [request, actor] = await Promise.all([
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

  if (!actor) {
    throw new Error("User not found");
  }

  if (!canModerate(actor)) {
    throw new Error("Insufficient privileges");
  }

  const markChecked = MarkCheckedRequest.parse(
    Object.fromEntries(formData.entries())
  );

  console.log("AUDIT", "markChecked", {
    actorUserId: actor.id,
    requestId: request.id,
  });

  await prisma.moderationRequest.update({
    where: {
      id: request.id,
    },
    data: {
      status: EditStatus.APPROVED,
      resolvedAt: new Date(),
      resolvedBy: {
        connect: {
          id: actor.id,
        },
      },
      resolvedMessage: markChecked.reason || null,
    },
  });

  return void redirect(`/larp/${request.larpId}`);
}
