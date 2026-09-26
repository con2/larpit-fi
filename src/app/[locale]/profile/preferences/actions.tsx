"use server";

import { auth } from "@/auth";
import { sendEmail } from "@/email";
import ConfirmAccountRemoval, {
  confirmAccountRemovalSubject,
  confirmAccountRemovalText,
} from "@/emails/ConfirmAccountRemoval";
import { EditFormPreference, TokenType } from "@/prisma/enums";
import { DisplayNameSchema, getUserFromSession } from "@/models/User";
import { iso } from "@/prisma/dates";
import { db } from "@/prisma/db";
import { toSupportedLanguage } from "@/translations";
import { pretty, render } from "react-email";
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

  await db.orm.public.User.where({ id: user.id }).update({
    name,
    editFormPreference,
  });

  revalidatePath(`/${locale}/profile/preferences`);
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
  await db.orm.public.VerificationToken.create({
    identifier: user.id,
    token,
    type: TokenType.ACCOUNT_REMOVAL,
    expires: iso(new Date(Date.now() + accountRemovalTokenValidityMs)),
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
