"use server";

import { auth } from "@/auth";
import { EditAction, EditStatus } from "@/generated/prisma/client";
import { approveRequest } from "@/models/ModerationRequest";
import {
  getDeleteLarpInitialStatusForUser,
  getUserFromSession,
} from "@/models/User";
import prisma from "@/prisma";
import fi from "@/translations/fi";
import { redirect } from "next/navigation";

export async function deleteLarp(
  locale: string,
  larpId: string,
  data: FormData,
) {
  const session = await auth();
  const user = await getUserFromSession(session);

  if (!user?.id) {
    throw new Error("You must be logged in to delete a larp");
  }

  const status = await getDeleteLarpInitialStatusForUser(user);
  if (status === null) {
    throw new Error(
      "You do not have permission to make a deletion request for this larp",
    );
  }

  const larp = await prisma.larp.findUnique({
    where: { id: larpId },
    select: { id: true, name: true },
  });

  if (!larp?.id) {
    throw new Error("Larp not found");
  }

  const { name: submitterName, email: submitterEmail } = user;
  if (!submitterName || !submitterEmail) {
    throw new Error("Missing submitter information");
  }

  const reason = data.get("reason")?.toString() || null;

  const request = await prisma.moderationRequest.create({
    data: {
      action: EditAction.DELETE,
      larpId: larp.id,
      status,
      submitterId: user.id,
      submitterName,
      submitterEmail,
      message: reason,
      newContent: {},
    },
  });

  if (status === EditStatus.APPROVED) {
    // Admin: delete immediately
    const autoReason =
      fi.ModerationRequest.messages.approvedAutomaticallyBecauseUserIs(
        user.role,
      );
    await approveRequest(request, user, autoReason, EditStatus.APPROVED);
    return void redirect(`/`);
  }

  // Moderation required
  return void redirect(`/larp/${larp.id}/edit/thanks`);
}
