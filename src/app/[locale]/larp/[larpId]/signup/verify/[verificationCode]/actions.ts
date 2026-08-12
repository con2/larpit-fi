"use server";

import { verifyUnauthenticatedSignup } from "@/models/UnauthenticatedSignup";
import prisma from "@/prisma";
import { toSupportedLanguage } from "@/translations";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function verifySignup(
  locale: string,
  larpId: string,
  verificationCode: string,
  _formData: FormData,
) {
  locale = toSupportedLanguage(locale);

  const signup = await prisma.unauthenticatedSignup.findUnique({
    where: { verificationCode },
    select: { id: true, larpId: true, verifiedAt: true },
  });

  if (!signup || signup.larpId !== larpId) {
    redirect(`/${locale}/larp/${larpId}`);
  }

  if (signup.verifiedAt) {
    redirect(`/${locale}/larp/${larpId}?success=signupVerified`);
  }

  await verifyUnauthenticatedSignup(verificationCode);

  revalidatePath(`/${locale}/larp/${larpId}`);
  redirect(`/${locale}/larp/${larpId}?success=signupVerified`);
}
