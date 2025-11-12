"use server";

import { auth } from "@/auth";
import { EditAction, EditStatus, RelatedUserRole } from "@/generated/prisma";
import compactObject from "@/helpers/compactObject";
import { formToLarpLinks, LarpLinksForm } from "@/models/LarpLink";
import {
  approveRequest,
  ModerationRequestForm,
} from "@/models/ModerationRequest";
import {
  getEditLarpInitialStatusForUserAndLarp,
  getUserFromSession,
} from "@/models/User";
import prisma from "@/prisma";
import fi from "@/translations/fi";
import { redirect } from "next/navigation";

export async function editLarp(locale: string, larpId: string, data: FormData) {
  const session = await auth();
  const user = await getUserFromSession(session);

  if (!user?.id) {
    throw new Error("You must be logged in to edit a larp");
  }

  const larp = await prisma.larp.findUnique({
    where: { id: larpId },
    include: {
      relatedUsers: {
        where: {
          userId: user.id,
          role: {
            in: [RelatedUserRole.EDITOR, RelatedUserRole.GAME_MASTER],
          },
        },
      },
      links: { select: { id: true } },
    },
  });

  if (!larp?.id) {
    throw new Error("Larp not found");
  }

  const formDataObject = Object.fromEntries(data.entries());

  const larpForm = ModerationRequestForm.parse(formDataObject);
  const linksForm = LarpLinksForm.parse(formDataObject);

  const { name: submitterName, email: submitterEmail } = user;
  const { submitterRole, message, ...newContent } = larpForm;

  if (!submitterName || !submitterEmail) {
    throw new Error("Missing submitter information");
  }

  const status = getEditLarpInitialStatusForUserAndLarp(user, larp);
  if (status === null) {
    throw new Error("You do not have permission to edit this larp");
  }

  const request = await prisma.moderationRequest.create({
    data: {
      action: EditAction.UPDATE,
      larpId: larp.id,
      status,
      submitterId: user.id,
      submitterName,
      submitterEmail,
      submitterRole,
      message,
      newContent: compactObject(newContent),

      // TODO cheap-ass solution, implement proper handling for multiple links of same type
      addLinks: formToLarpLinks(linksForm),
      removeLinks: larp.links, // [{id}]
    },
  });

  if (status === EditStatus.VERIFIED) {
    // Moderation required
    return void redirect(`/larp/${larp.id}/edit/thanks`);
  }

  // No pre-moderation required
  const reason =
    status === EditStatus.APPROVED
      ? fi.ModerationRequest.messages.approvedAutomaticallyBecauseUserIs(
          user.role
        )
      : null;
  await approveRequest(request, user, reason, status);

  return void redirect(`/larp/${larp.id}`);
}
