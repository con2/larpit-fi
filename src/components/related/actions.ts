"use server";

import { auth } from "@/auth";
import {
  EditAction,
  EditStatus,
  RelatedLarpType,
  RelatedUserRole,
} from "@/prisma/enums";
import { approveRequest } from "@/models/ModerationRequest";
import {
  getEditLarpInitialStatusForUserAndLarp,
  getUserFromSession,
} from "@/models/User";
import { db } from "@/prisma/db";
import { toJson } from "@/prisma/json";
import fi from "@/translations/fi";
import { redirect } from "next/navigation";
import { validate as validateUuid } from "uuid";

/** The larp with only the roles that let the user edit it. */
function larpWithEditorRoles(larpId: string, userId: string) {
  return db.orm.public.Larp.select("id", "name")
    .include("relatedUsers", (r) =>
      r
        .where({ userId })
        .where((ru) =>
          ru.role.in([RelatedUserRole.EDITOR, RelatedUserRole.GAME_MASTER]),
        ),
    )
    .first({ id: larpId });
}

export async function addRelatedLarp(
  locale: string,
  larpId: string,
  data: FormData,
) {
  const session = await auth();
  const user = await getUserFromSession(session);

  if (!user?.id) {
    throw new Error("You must be logged in to add a related larp");
  }

  const rightId = data.get("rightId") as string | null;
  const type = data.get("type") as string | null;
  const action = data.get("action") as string | null;

  if (!rightId || !type) {
    throw new Error("Missing required fields");
  }

  if (action === "swap") {
    return void redirect(
      `/larp/${rightId}/related?rightId=${larpId}&type=${type}`,
    );
  }

  // action === "create"
  if (!Object.values(RelatedLarpType).includes(type as RelatedLarpType)) {
    throw new Error("Invalid relation type");
  }

  if (larpId === rightId) {
    throw new Error("A larp cannot be related to itself");
  }

  const larp = await larpWithEditorRoles(larpId, user.id);

  if (!larp) {
    throw new Error("Larp not found");
  }

  const status = getEditLarpInitialStatusForUserAndLarp(user, larp);
  if (status === null) {
    throw new Error("You do not have permission to edit this larp");
  }

  // Check for duplicate: (leftId, rightId) must be unique
  const existing = await db.orm.public.RelatedLarp.first({
    leftId: larpId,
    rightId,
  });
  if (existing) {
    return void redirect(
      `/larp/${larpId}/related?rightId=${rightId}&type=${type}&error=already_related`,
    );
  }

  const { name: submitterName, email: submitterEmail } = user;
  if (!submitterName || !submitterEmail) {
    throw new Error("Missing submitter information");
  }

  const request = await db.orm.public.ModerationRequest.create({
    action: EditAction.UPDATE,
    larpId,
    status,
    submitterId: user.id,
    submitterName,
    submitterEmail,
    newContent: {},
    addRelatedLarps: toJson([{ leftId: larpId, rightId, type }]),
    removeRelatedLarps: [],
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

  return void redirect(`/larp/${larpId}/related`);
}

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
    larpWithEditorRoles(larpId, user.id),
    db.orm.public.RelatedLarp.first({ leftId, rightId, type }),
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

  const request = await db.orm.public.ModerationRequest.create({
    action: EditAction.UPDATE,
    larpId: larp.id,
    status,
    submitterId: user.id,
    submitterName,
    submitterEmail,
    newContent: {},
    addRelatedLarps: [],
    removeRelatedLarps: toJson([{ leftId, rightId, type }]),
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
