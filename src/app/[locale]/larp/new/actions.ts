"use server";

import { auth } from "@/auth";
import { EditAction, EditStatus, UserRole } from "@/generated/prisma";
import compactObject from "@/helpers/compactObject";
import { CreateLarpForm, approveRequest } from "@/models/ModerationRequest";
import prisma from "@/prisma";
import { redirect } from "next/navigation";
import fi from "@/translations/fi";

const acceptableFelines = ["cat", "kissa", "katt"] as const;

export async function createLarp(
  _locale: string,
  data: FormData
): Promise<void> {
  const session = await auth();
  const user = session?.user?.email
    ? await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, name: true, email: true, role: true },
      })
    : null;

  const parsed = CreateLarpForm.parse(Object.fromEntries(data.entries()));

  const {
    submitterName = user?.name,
    submitterEmail = user?.email,
    submitterRole,
    message,
    cat,
    ...newContent
  } = parsed;

  if (!submitterName || !submitterEmail) {
    throw new Error("Missing submitter information");
  }

  if (
    !user &&
    !(cat && acceptableFelines.some((feline) => cat.includes(feline)))
  ) {
    throw new Error("You might be a robot");
  }

  let status: EditStatus = EditStatus.PENDING_VERIFICATION;
  if (user) {
    if (user.role === UserRole.ADMIN || user.role === UserRole.MODERATOR) {
      // They have the right to accept their own edits, so take a shortcut
      status = EditStatus.APPROVED;
    } else if (user.role === UserRole.VERIFIED) {
      // Accept but flag for check
      status = EditStatus.AUTO_APPROVED;
    }
  }

  const moderationRequest = await prisma.moderationRequest.create({
    data: {
      action: EditAction.CREATE,
      status,
      submitterId: user?.id,
      submitterName,
      submitterEmail,
      submitterRole,
      message,
      newContent: compactObject(newContent),
    },
  });

  let larpId: string | null = null;
  if (
    moderationRequest.status === EditStatus.APPROVED ||
    moderationRequest.status === EditStatus.AUTO_APPROVED
  ) {
    if (!user) {
      throw new Error("This shouldn't happen (appease typechecker)");
    }
    const larp = await approveRequest(
      moderationRequest,
      user,
      moderationRequest.status === EditStatus.APPROVED
        ? fi.ModerationRequest.messages.autoApproved(user.role)
        : null
    );
    larpId = larp.id;
  }

  switch (moderationRequest.status) {
    case EditStatus.APPROVED:
    case EditStatus.AUTO_APPROVED:
      return void redirect(`/larp/${larpId}`);
    case EditStatus.PENDING_VERIFICATION:
      return void redirect("/larp/new/verify");
    default:
      return void redirect("/larp/new/thanks");
  }
}
