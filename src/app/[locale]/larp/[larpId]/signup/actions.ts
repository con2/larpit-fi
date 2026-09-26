"use server";

import { auth } from "@/auth";
import { RelatedUserRole, RelatedUserVisibility } from "@/prisma/enums";
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
import { parseDates } from "@/prisma/dates";
import { db } from "@/prisma/db";
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
  const larp = await db.orm.public.Larp.select(
    "id",
    "name",
    "cancelledAt",
    "localSignupStatus",
    "localSignupCode",
  )
    .include("relatedUsers", (r) =>
      (userId ? r.where({ userId }) : r).select("userId", "role"),
    )
    .first({ id: larpId });
  return larp && parseDates(larp);
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

  await db.orm.public.RelatedUser.where({ larpId, userId: user.id })
    .where((r) =>
      r.role.in([
        RelatedUserRole.LOCAL_SIGNUP_YES,
        RelatedUserRole.LOCAL_SIGNUP_MAYBE,
        RelatedUserRole.LOCAL_SIGNUP_NO,
      ]),
    )
    .deleteAndCount();

  revalidatePath(`/${locale}/larp/${larpId}`);
  redirect(`/${locale}/larp/${larpId}`);
}
