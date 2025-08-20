"use server";

import { auth } from "@/auth";
import { EditAction, EditStatus } from "@/generated/prisma";
import compactObject from "@/helpers/compactObject";
import { formToLarpLinks, LarpLinksForm } from "@/models/LarpLink";
import {
  CreateLarpForm,
  approveRequest,
  sendVerificationEmail,
} from "@/models/ModerationRequest";
import {
  canCreateLarpWithoutPostModeration,
  canCreateLarpWithoutPreModeration,
} from "@/models/User";
import prisma from "@/prisma";
import fi from "@/translations/fi";
import { redirect } from "next/navigation";

const acceptableFelines = ["cat", "kissa", "katt"] as const;

export async function createLarp(
  locale: string,
  data: FormData
): Promise<void> {
  const session = await auth();
  const user = session?.user?.email
    ? await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, name: true, email: true, role: true },
      })
    : null;

  const formDataObject = Object.fromEntries(data.entries());

  const larpForm = CreateLarpForm.parse(formDataObject);
  const linksForm = LarpLinksForm.parse(formDataObject);

  const {
    submitterName = user?.name,
    submitterEmail = user?.email,
    submitterRole,
    message,
    cat,
    ...newContent
  } = larpForm;

  if (!submitterName || !submitterEmail) {
    throw new Error("Missing submitter information");
  }

  if (
    !user &&
    !(cat && acceptableFelines.some((feline) => cat.includes(feline)))
  ) {
    throw new Error("You might be a robot");
  }

  const status: EditStatus = canCreateLarpWithoutPreModeration(user)
    ? EditStatus.VERIFIED
    : EditStatus.PENDING_VERIFICATION;
  const request = await prisma.moderationRequest.create({
    data: {
      action: EditAction.CREATE,
      status,
      submitterId: user?.id,
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
