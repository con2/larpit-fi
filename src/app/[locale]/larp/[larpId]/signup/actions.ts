"use server";

import { auth } from "@/auth";
import {
  RelatedUserRole,
  RelatedUserVisibility,
} from "@/generated/prisma/client";
import SignupVerification, {
  signupVerificationSubject,
  signupVerificationText,
} from "@/emails/SignupVerification";
import { sendEmail } from "@/email";
import {
  deleteUnauthenticatedSignupsForUser,
  normalizeEmail,
  submitUnauthenticatedSignup,
  upsertLocalSignup,
} from "@/models/UnauthenticatedSignup";
import {
  DisplayNameSchema,
  getLocalSignupStatusForUser,
  getUserFromSession,
} from "@/models/User";
import prisma from "@/prisma";
import { toSupportedLanguage } from "@/translations";
import { render } from "@react-email/render";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import z from "zod";

const SignupStatusSchema = z.enum([
  RelatedUserRole.LOCAL_SIGNUP_YES,
  RelatedUserRole.LOCAL_SIGNUP_MAYBE,
  RelatedUserRole.LOCAL_SIGNUP_NO,
]);

const VisibilitySchema = z.enum([
  RelatedUserVisibility.PARTICIPANTS,
  RelatedUserVisibility.GM,
]);

async function getLarpForSignup(larpId: string, userId?: string) {
  return prisma.larp.findUnique({
    where: { id: larpId },
    select: {
      id: true,
      name: true,
      cancelledAt: true,
      localSignupStatus: true,
      localSignupCode: true,
      relatedUsers: userId
        ? { where: { userId }, select: { userId: true, role: true } }
        : { select: { userId: true, role: true } },
    },
  });
}

export async function submitSignup(
  locale: string,
  larpId: string,
  data: FormData,
) {
  locale = toSupportedLanguage(locale);
  const session = await auth();
  const user = await getUserFromSession(session);

  const codeParam = data.get("code") as string | null;
  const action = data.get("action") as string | null;

  if (action === "remove") {
    return removeLocalSignup(locale, larpId);
  }

  const larp = await getLarpForSignup(larpId, user?.id);
  if (!larp) throw new Error("Larp not found");

  const status = getLocalSignupStatusForUser(user, larp, codeParam);

  if (
    status === "CANCELLED" ||
    status === "DISABLED" ||
    status === "CODE_REQUIRED"
  ) {
    throw new Error("Sign-up is not available");
  }

  const signupStatus = SignupStatusSchema.parse(data.get("signupStatus"));
  const visibility = VisibilitySchema.parse(data.get("visibility"));

  if (user) {
    // Authenticated path
    await upsertLocalSignup(larpId, user.id, signupStatus, visibility);
    if (user.email) {
      await deleteUnauthenticatedSignupsForUser(larpId, user.email);
    }
    revalidatePath(`/${locale}/larp/${larpId}`);
    redirect(`/${locale}/larp/${larpId}`);
  } else {
    // Unauthenticated path
    const displayName = DisplayNameSchema.parse(data.get("displayName"));
    const rawEmail = z.string().email().parse(data.get("email"));
    const email = normalizeEmail(rawEmail);

    const verificationCode = await submitUnauthenticatedSignup(
      larpId,
      email,
      displayName,
      signupStatus,
      visibility,
    );

    const subject = signupVerificationSubject(locale);
    const text = signupVerificationText(
      locale,
      larp.name,
      larpId,
      verificationCode,
    );
    const html = await render(
      SignupVerification({
        locale,
        larpName: larp.name,
        larpId,
        verificationCode,
      }),
    );
    await sendEmail(email, subject, text, html);

    revalidatePath(`/${locale}/larp/${larpId}/signup`);
    redirect(`/${locale}/larp/${larpId}/signup?emailSent=1`);
  }
}

export async function removeLocalSignup(
  locale: string,
  larpId: string,
  _data?: FormData,
) {
  locale = toSupportedLanguage(locale);
  const session = await auth();
  const user = await getUserFromSession(session);

  if (!user?.id) throw new Error("Not logged in");

  await prisma.relatedUser.deleteMany({
    where: {
      larpId,
      userId: user.id,
      role: {
        in: [
          RelatedUserRole.LOCAL_SIGNUP_YES,
          RelatedUserRole.LOCAL_SIGNUP_MAYBE,
          RelatedUserRole.LOCAL_SIGNUP_NO,
        ],
      },
    },
  });

  revalidatePath(`/${locale}/larp/${larpId}`);
  redirect(`/${locale}/larp/${larpId}`);
}
