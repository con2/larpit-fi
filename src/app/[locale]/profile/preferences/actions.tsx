"use server";

import { auth } from "@/auth";
import { sendEmail } from "@/email";
import ConfirmAccountRemoval, {
  confirmAccountRemovalSubject,
  confirmAccountRemovalText,
} from "@/emails/ConfirmAccountRemoval";
import { EditFormPreference, TokenType } from "@/generated/prisma/client";
import { DisplayNameSchema, getUserFromSession } from "@/models/User";
import prisma from "@/prisma";
import { toSupportedLanguage } from "@/translations";
import { pretty, render } from "@react-email/render";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import z from "zod";

const accountRemovalTokenValidityMs = 24 * 60 * 60 * 1000;

const SaveUserPreferencesSchema = z.object({
  name: DisplayNameSchema,
  editFormPreference: z.enum(EditFormPreference),
});

export async function saveUserPreferences(locale: string, formData: FormData) {
  const session = await auth();
  const user = await getUserFromSession(session);
  if (!user) {
    throw new Error("Not logged in");
  }

  const { name, editFormPreference } = SaveUserPreferencesSchema.parse(
    Object.fromEntries(formData.entries()),
  );

  await prisma.user.update({
    where: { id: user.id },
    data: { name, editFormPreference },
  });

  revalidatePath(`/${locale}/profile/preferences`);
}

export async function logOutAllSessions(locale: string, _formData: FormData) {
  const session = await auth();
  const user = await getUserFromSession(session);
  if (!user) {
    throw new Error("Not logged in");
  }

  // Database session strategy: a session with `expires` in the past is treated
  // as invalid, so this logs the user out everywhere including the current
  // session. We expire rather than delete to keep the rows.
  await prisma.session.updateMany({
    where: { userId: user.id },
    data: { expires: new Date() },
  });

  revalidatePath(`/${locale}`);
  return void redirect(`/`);
}

export async function requestAccountRemoval(
  locale: string,
  _formData: FormData,
) {
  const session = await auth();
  const user = await getUserFromSession(session);
  if (!user) {
    throw new Error("Not logged in");
  }

  const token = randomUUID();
  await prisma.verificationToken.create({
    data: {
      identifier: user.id,
      token,
      type: TokenType.ACCOUNT_REMOVAL,
      expires: new Date(Date.now() + accountRemovalTokenValidityMs),
    },
  });

  const language = toSupportedLanguage(locale);
  const subject = confirmAccountRemovalSubject(language);
  const html = await pretty(
    await render(<ConfirmAccountRemoval locale={language} token={token} />),
  );
  const text = confirmAccountRemovalText(language, token);
  await sendEmail(user.email, subject, text, html);

  revalidatePath(`/${locale}/profile/preferences`);
  return void redirect(`/profile/preferences?accountRemovalRequested=1`);
}
