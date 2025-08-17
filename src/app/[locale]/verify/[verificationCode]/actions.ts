"use server";

import { EditStatus } from "@/generated/prisma";
import prisma from "@/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { validate as validateUuid } from "uuid";

export async function verifyRequest(locale: string, verificationCode: string) {
  if (!validateUuid(verificationCode)) {
    throw new Error("Invalid verification code");
  }

  const request = await prisma.moderationRequest.findUnique({
    where: {
      verificationCode,
    },
    select: {
      id: true,
      status: true,
      action: true,
    },
  });

  if (!request) {
    throw new Error("Request not found");
  }

  if (request.status !== EditStatus.PENDING_VERIFICATION) {
    console.warn("verifyRequest: Request is not pending verification", request);
    revalidatePath(`/${locale}/verify/${verificationCode}`);
    return void redirect(`/verify/${verificationCode}`);
  }

  await prisma.moderationRequest.update({
    where: {
      id: request.id,
    },
    data: {
      // not setting verificationCode to null in case they click the link in email again
      status: EditStatus.VERIFIED,
      verifiedAt: new Date(),
    },
  });

  revalidatePath(`/${locale}/verify/${verificationCode}`);
  return void redirect(`/larp/new/thanks`);
}
