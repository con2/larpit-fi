"use server";

import { auth } from "@/auth";
import { EditAction, EditStatus, RelatedLarpType, RelatedUserRole } from "@/generated/prisma/client";
import { approveRequest } from "@/models/ModerationRequest";
import { getEditLarpInitialStatusForUserAndLarp, getUserFromSession } from "@/models/User";
import prisma from "@/prisma";
import fi from "@/translations/fi";
import { redirect } from "next/navigation";

export async function removeRelatedLarp(locale: string, larpId: string, data: FormData) {
  const session = await auth();
  const user = await getUserFromSession(session);

  if (!user?.id) {
    throw new Error("You must be logged in to remove a related larp");
  }

  const leftId = data.get("leftId") as string | null;
  const rightId = data.get("rightId") as string | null;
  const type = data.get("type") as string | null;

  if (!leftId || !rightId || !type) {
    throw new Error("Missing required fields");
  }

  if (!Object.values(RelatedLarpType).includes(type as RelatedLarpType)) {
    throw new Error("Invalid relation type");
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
      addRelatedLarps: [],
      removeRelatedLarps: [{ leftId, rightId, type }],
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
