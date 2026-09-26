"use server";

import { EditStatus } from "@/prisma/enums";
import { iso } from "@/prisma/dates";
import { db } from "@/prisma/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { validate as validateUuid } from "uuid";

export async function verifyRequest(locale: string, verificationCode: string) {
  if (!validateUuid(verificationCode)) {
    throw new Error("Invalid verification code");
  }

  const request = await db.orm.public.ModerationRequest.include(
    "submitter",
    (u) => u.select("id", "email", "emailVerified"),
  ).first({ verificationCode });

  if (!request) {
    throw new Error("Request not found");
  }

  if (request.status !== EditStatus.PENDING_VERIFICATION) {
    console.warn("verifyRequest: Request is not pending verification", request);
    revalidatePath(`/${locale}/verify/${verificationCode}`);
    return void redirect(`/verify/${verificationCode}`);
  }

  await db.orm.public.ModerationRequest.where({ id: request.id }).update({
    // not setting verificationCode to null in case they click the link in email again
    status: EditStatus.VERIFIED,
    verifiedAt: iso(new Date()),
  });

  if (
    request.submitter &&
    request.submitter.email === request.submitterEmail &&
    !request.submitter.emailVerified
  ) {
    await db.orm.public.User.where({ id: request.submitter.id }).update({
      emailVerified: iso(new Date()),
    });
  }

  revalidatePath(`/${locale}/verify/${verificationCode}`);
  return void redirect(`/larp/new/thanks`);
}
