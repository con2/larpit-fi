"use server";

import { auth } from "@/auth";
import {
  EditAction,
  EditStatus,
  RelatedLarpType,
  RelatedUserRole,
} from "@/generated/prisma/client";
import { approveRequest } from "@/models/ModerationRequest";
import {
  getEditLarpInitialStatusForUserAndLarp,
  getUserFromSession,
} from "@/models/User";
import prisma from "@/prisma";
import fi from "@/translations/fi";
import { redirect } from "next/navigation";
import { validate as validateUuid } from "uuid";

export async function removeRelatedLarp(
  locale: string,
  /// from which perspective we are removing the relation, used for permission checks and redirect after removal
  larpId: string,
  leftId: string,
  rightId: string,
  type: RelatedLarpType,
) {
  const session = await auth();
  const user = await getUserFromSession(session);

  if (!user?.id) {
    throw new Error("You must be logged in to remove a related larp");
  }

  if (!leftId || !rightId || !type) {
    throw new Error("Missing required fields");
  }

  if (
    !validateUuid(larpId) ||
    !validateUuid(leftId) ||
    !validateUuid(rightId)
  ) {
    throw new Error("Invalid larp ID");
  }

  if (larpId !== leftId && larpId !== rightId) {
    throw new Error("Larp ID must be either leftId or rightId");
  }

  if (!Object.values(RelatedLarpType).includes(type as RelatedLarpType)) {
    throw new Error("Invalid relation type");
  }

  const [larp, relatedLarp] = await Promise.all([
    prisma.larp.findUnique({
      where: { id: larpId },
      select: {
        id: true,
        name: true,
        relatedUsers: {
          where: {
            userId: user.id,
            role: {
              in: [RelatedUserRole.EDITOR, RelatedUserRole.GAME_MASTER],
            },
          },
        },
      },
    }),
    prisma.relatedLarp.findUnique({
      where: {
        leftId_rightId: {
          leftId,
          rightId,
        },
        type,
      },
    }),
  ]);

  if (!larp || !relatedLarp) {
    throw new Error("Related larp not found");
  }

  const status = getEditLarpInitialStatusForUserAndLarp(user, larp);

  if (!status) {
    throw new Error("You do not have permission to edit this larp");
  }

  const { name: submitterName, email: submitterEmail } = user;
  if (!submitterName || !submitterEmail) {
    throw new Error("Missing submitter information");
  }

  const request = await prisma.moderationRequest.create({
    data: {
      action: EditAction.UPDATE,
      larpId: larp.id,
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
      ? fi.ModerationRequest.messages.approvedAutomaticallyBecauseUserIs(
          user.role,
        )
      : null;
  await approveRequest(request, user, reason, status);

  return void redirect(`/larp/${larpId}`);
}
