"use server";

import { auth } from "@/auth";
import { EditAction, EditStatus, RelatedLarpType, RelatedUserRole } from "@/generated/prisma/client";
import { approveRequest } from "@/models/ModerationRequest";
import { getEditLarpInitialStatusForUserAndLarp, getUserFromSession } from "@/models/User";
import prisma from "@/prisma";
import fi from "@/translations/fi";
import { redirect } from "next/navigation";

export async function addRelatedLarp(locale: string, larpId: string, data: FormData) {
  const session = await auth();
  const user = await getUserFromSession(session);

  if (!user?.id) {
    throw new Error("You must be logged in to add a related larp");
  }

  const rightId = data.get("rightId") as string | null;
  const type = data.get("type") as string | null;
  const action = data.get("action") as string | null;

  if (!rightId || !type) {
    throw new Error("Missing required fields");
  }

  if (action === "swap") {
    return void redirect(`/larp/${rightId}/relations/new?rightId=${larpId}&type=${type}`);
  }

  // action === "create"
  if (!Object.values(RelatedLarpType).includes(type as RelatedLarpType)) {
    throw new Error("Invalid relation type");
  }

  if (larpId === rightId) {
    throw new Error("A larp cannot be related to itself");
  }

  const larp = await prisma.larp.findUnique({
    where: { id: larpId },
    include: {
      relatedUsers: {
        where: {
          userId: user.id,
          role: { in: [RelatedUserRole.EDITOR, RelatedUserRole.GAME_MASTER] },
        },
      },
    },
  });

  if (!larp) {
    throw new Error("Larp not found");
  }

  const status = getEditLarpInitialStatusForUserAndLarp(user, larp);
  if (status === null) {
    throw new Error("You do not have permission to edit this larp");
  }

  // Check for duplicate: (leftId, rightId) must be unique
  const existing = await prisma.relatedLarp.findUnique({
    where: { leftId_rightId: { leftId: larpId, rightId } },
  });
  if (existing) {
    return void redirect(
      `/larp/${larpId}/relations/new?rightId=${rightId}&type=${type}&error=already_related`
    );
  }

  const { name: submitterName, email: submitterEmail } = user;
  if (!submitterName || !submitterEmail) {
    throw new Error("Missing submitter information");
  }

  const request = await prisma.moderationRequest.create({
    data: {
      action: EditAction.UPDATE,
      larpId,
      status,
      submitterId: user.id,
      submitterName,
      submitterEmail,
      newContent: {},
      addRelatedLarps: [{ leftId: larpId, rightId, type }],
      removeRelatedLarps: [],
    },
  });

  if (status === EditStatus.VERIFIED) {
    return void redirect(`/larp/${larpId}/edit/thanks`);
  }

  const reason =
    status === EditStatus.APPROVED
      ? fi.ModerationRequest.messages.approvedAutomaticallyBecauseUserIs(user.role)
      : null;
  await approveRequest(request, user, reason, status);

  return void redirect(`/larp/${larpId}`);
}
