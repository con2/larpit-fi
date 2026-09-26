"use server";

import { auth } from "@/auth";
import { EditAction, EditStatus } from "@/prisma/enums";
import { compactObject, normalizeFormData } from "@con2/components/helpers";
import { parseIndexedLinksFromFormData } from "@/models/LarpLink";
import {
  approveRequest,
  ModerationRequestForm,
  sendVerificationEmail,
} from "@/models/ModerationRequest";
import {
  getNewLarpInitialStatusForUser,
  getUserFromSession,
} from "@/models/User";
import { db } from "@/prisma/db";
import { toJson } from "@/prisma/json";
import { redirect } from "next/navigation";
import fi from "@/translations/fi";

const acceptableFelines = ["cat", "kissa", "katt"] as const;

export async function createLarp(
  locale: string,
  data: FormData,
): Promise<void> {
  const session = await auth();
  const user = await getUserFromSession(session);

  const formDataObject = normalizeFormData(data);

  const larpForm = ModerationRequestForm.parse(formDataObject);
  const addLinks = parseIndexedLinksFromFormData(data);

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

  const request = await db.orm.public.ModerationRequest.create({
    action: EditAction.CREATE,
    status,
    submitterId: user?.id ?? null,
    submitterName,
    submitterEmail,
    submitterRole,
    message: message ?? null,
    newContent: toJson(compactObject(newContent)),
    addLinks: toJson(addLinks),
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
          user.role,
        )
      : null;
  const larp = await approveRequest(request, user, reason, status);

  return void redirect(`/larp/${larp.id}`);
}
