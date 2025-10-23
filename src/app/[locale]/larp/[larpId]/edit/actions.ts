"use server";

import { auth } from "@/auth";
import { EditAction, EditStatus, RelatedUserRole } from "@/generated/prisma";
import compactObject from "@/helpers/compactObject";
import { formToLarpLinks, LarpLinksForm } from "@/models/LarpLink";
import {
  ModerationRequestForm,
  approveRequest,
  sendVerificationEmail,
} from "@/models/ModerationRequest";
import {
  canCreateLarpWithoutPostModeration,
  canCreateLarpWithoutPreModeration,
  getEditPolicyForUserAndLarp,
} from "@/models/User";
import prisma from "@/prisma";
import fi from "@/translations/fi";
import { redirect } from "next/navigation";
import { use } from "react";

const acceptableFelines = ["cat", "kissa", "katt"] as const;

export async function editLarp(locale: string, larpId: string, data: FormData) {
  const session = await auth();
  const user = session?.user?.email
    ? await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, name: true, email: true, role: true },
      })
    : null;

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

  const status: EditStatus = getEditPolicyForUserAndLarp(user, larp)
    ? EditStatus.AUTO_APPROVED
    : EditStatus.VERIFIED;
  const request = await prisma.moderationRequest.create({
    data: {
      action: EditAction.UPDATE,
      status,
      submitterId: user.id,
      submitterName,
      submitterEmail,
      submitterRole,
      message,
      newContent: compactObject(newContent),
      addLinks: formToLarpLinks(linksForm),
    },
  });

  if (request.status === EditStatus.VERIFIED) {
    // We can create a larp without pre-moderation. Cool beans!

    if (!user) {
      throw new Error("This shouldn't happen (appease typechecker)");
    }

    // If it was a moderator or admin, no need to flag it for post-moderation either.
    const newStatus = canCreateLarpWithoutPostModeration(user)
      ? EditStatus.APPROVED
      : EditStatus.AUTO_APPROVED;
    const reason =
      newStatus === EditStatus.APPROVED
        ? fi.ModerationRequest.messages.autoApproved(user.role)
        : null;
    const larp = await approveRequest(request, user, reason, newStatus);

    return void redirect(`/larp/${larp.id}`);
  } else {
    await sendVerificationEmail(locale, request);
    return void redirect("/larp/new/verify");
  }
}
