"use server";

import { auth } from "@/auth";
import {
  EditAction,
  EditFormPreference,
  EditStatus,
  RelatedUserRole,
} from "@/prisma/enums";
import { normalizeFormData } from "@con2/components/helpers";
import {
  diffLarpLinks,
  parseIndexedLinksFromFormData,
} from "@/models/LarpLink";
import {
  approveRequest,
  diffLarpContent,
  larpToContent,
  ModerationRequestForm,
} from "@/models/ModerationRequest";
import {
  getEditLarpInitialStatusForUserAndLarp,
  getUserFromSession,
} from "@/models/User";
import { parseDates } from "@/prisma/dates";
import { db } from "@/prisma/db";
import { toJson } from "@/prisma/json";
import fi from "@/translations/fi";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function editLarp(locale: string, larpId: string, data: FormData) {
  const session = await auth();
  const user = await getUserFromSession(session);

  if (!user?.id) {
    throw new Error("You must be logged in to edit a larp");
  }

  const larpRow = await db.orm.public.Larp.include("relatedUsers", (r) =>
    r
      .where({ userId: user.id })
      .where((ru) =>
        ru.role.in([RelatedUserRole.EDITOR, RelatedUserRole.GAME_MASTER]),
      ),
  )
    .include("links", (l) => l.select("href", "type", "title"))
    .first({ id: larpId });
  const larp = larpRow && parseDates(larpRow);

  if (!larp?.id) {
    throw new Error("Larp not found");
  }

  const formDataObject = normalizeFormData(data);

  const larpForm = ModerationRequestForm.parse(formDataObject);
  const desiredLinks = parseIndexedLinksFromFormData(data);

  const { name: submitterName, email: submitterEmail } = user;
  // Destructure out all form-specific fields; remainder is already-transformed ModerationRequestContent
  const {
    submitterRole,
    message,
    cat: _cat,
    submitterName: _sn,
    submitterEmail: _se,
    ...newContent
  } = larpForm;

  if (!submitterName || !submitterEmail) {
    throw new Error("Missing submitter information");
  }

  const status = getEditLarpInitialStatusForUserAndLarp(user, larp);
  if (status === null) {
    throw new Error("You do not have permission to edit this larp");
  }

  const currentContent = larpToContent(larp);
  const diff = diffLarpContent(currentContent, newContent);

  const { addLinks, removeLinks } = diffLarpLinks(
    larp.links.map((l) => ({ ...l, title: l.title ?? undefined })),
    desiredLinks,
  );
  const request = await db.orm.public.ModerationRequest.create({
    action: EditAction.UPDATE,
    larpId: larp.id,
    status,
    submitterId: user.id,
    submitterName,
    submitterEmail,
    submitterRole,
    message: message ?? null,
    newContent: toJson(diff),
    addLinks: toJson(addLinks),
    removeLinks: toJson(removeLinks),
  });

  if (status === EditStatus.VERIFIED) {
    // Moderation required
    return void redirect(`/larp/${larp.id}/edit/thanks`);
  }

  // No pre-moderation required
  const reason =
    status === EditStatus.APPROVED
      ? fi.ModerationRequest.messages.approvedAutomaticallyBecauseUserIs(
          user.role,
        )
      : null;
  await approveRequest(request, user, reason, status);

  return void redirect(`/larp/${larp.id}`);
}

export async function setEditFormPreference(
  locale: string,
  larpId: string,
  preference: EditFormPreference,
  _formData: FormData,
) {
  const session = await auth();
  const user = await getUserFromSession(session);
  if (!user) throw new Error("Not logged in");

  await db.orm.public.User.where({ id: user.id }).update({
    editFormPreference: preference,
  });

  revalidatePath(`/${locale}/larp/${larpId}/edit`);
}
