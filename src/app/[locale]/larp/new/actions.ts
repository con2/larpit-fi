"use server";

import { auth } from "@/auth";
import { EditAction, EditStatus } from "@/generated/prisma/client";
import compactObject from "@/helpers/compactObject";
import { formToLarpLinks, LarpLinksForm } from "@/models/LarpLink";
import {
  approveRequest,
  ModerationRequestForm,
  sendVerificationEmail,
} from "@/models/ModerationRequest";
import { getNewLarpInitialStatusForUser } from "@/models/User";
import prisma from "@/prisma";
import { redirect } from "next/navigation";
import fi from "@/translations/fi";

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

  const larpForm = ModerationRequestForm.parse(formDataObject);
  const linksForm = LarpLinksForm.parse(formDataObject);

  const {
    submitterName = user?.name,
    submitterEmail = user?.email,
    submitterRole,
    message,
    ...newContent
  } = larpForm;

  if (!submitterName || !submitterEmail) {
    throw new Error("Missing submitter information");
  }

  const cat = larpForm.cat?.toLowerCase() ?? "";
  if (
    !user &&
    !(cat && acceptableFelines.some((feline) => cat.includes(feline)))
  ) {
    throw new Error("You might be a robot");
  }

  const status = getNewLarpInitialStatusForUser(user);

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

  if (status === EditStatus.PENDING_VERIFICATION) {
    await sendVerificationEmail(locale, request);
    return void redirect("/larp/new/verify");
  }

  if (!user) {
    throw new Error("This shouldn't happen (appease typechecker)");
  }

  const reason =
    status === EditStatus.APPROVED
      ? fi.ModerationRequest.messages.approvedAutomaticallyBecauseUserIs(
          user.role
        )
      : null;
  const larp = await approveRequest(request, user, reason, status);

  return void redirect(`/larp/${larp.id}`);
}
