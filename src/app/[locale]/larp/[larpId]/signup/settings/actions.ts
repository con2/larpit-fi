"use server";

import { auth } from "@/auth";
import { LocalSignupStatus, RelatedUserVisibility } from "@/prisma/enums";
import { isGmOrModerator, getUserFromSession } from "@/models/User";
import { normalizeFormData } from "@con2/components/helpers";
import { db } from "@/prisma/db";
import { toSupportedLanguage } from "@/translations";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import z from "zod";

const LocalSignupSettingsSchema = z.object({
  localSignupStatus: z.enum(LocalSignupStatus),
  localSignupCode: z.string().max(100).optional(),
  relatedUserVisibility: z.enum([
    RelatedUserVisibility.PARTICIPANTS,
    RelatedUserVisibility.GM,
  ]),
});

export async function saveLocalSignupSettings(
  locale: string,
  larpId: string,
  data: FormData,
) {
  locale = toSupportedLanguage(locale);
  const session = await auth();
  const user = await getUserFromSession(session);

  if (!user?.id) throw new Error("Not logged in");

  const larp = await db.orm.public.Larp.select("id")
    .include("relatedUsers", (r) => r.select("userId", "role"))
    .first({ id: larpId });

  if (!larp) throw new Error("Larp not found");
  if (!isGmOrModerator(user, larp)) throw new Error("Insufficient permissions");

  const formData = normalizeFormData(data);
  const parsed = LocalSignupSettingsSchema.parse(formData);

  await db.orm.public.Larp.where({ id: larpId }).update({
    localSignupStatus: parsed.localSignupStatus,
    localSignupCode:
      parsed.localSignupStatus === LocalSignupStatus.CODE_REQUIRED
        ? (parsed.localSignupCode ?? null)
        : null,
    relatedUserVisibility: parsed.relatedUserVisibility,
  });

  revalidatePath(`/${locale}/larp/${larpId}`);
  revalidatePath(`/${locale}/larp/${larpId}/signup/settings`);
  redirect(`/${locale}/larp/${larpId}/signup/settings?saved=1`);
}
