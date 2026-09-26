"use server";

import { verifyUnauthenticatedSignup } from "@/models/UnauthenticatedSignup";
import { db } from "@/prisma/db";
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

  const signup = await db.orm.public.UnauthenticatedSignup.select(
    "id",
    "larpId",
    "verifiedAt",
  ).first({ verificationCode });

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
