"use server";

import { auth } from "@/auth";
import { PageForm } from "@/models/Page";
import { canEditPages, getUserFromSession } from "@/models/User";
import prisma from "@/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function putPage(
  locale: string,
  slug: string,
  language: string,
  formData: FormData
) {
  const session = await auth();
  const user = await getUserFromSession(session);
  if (!user || !canEditPages(user)) {
    throw new Error("Insufficient privileges");
  }

  const title = formData.get("title");
  const content = formData.get("content");

  const page = PageForm.parse({
    slug,
    language,
    title,
    content,
  });

  await prisma.page.upsert({
    where: { slug_language: { slug: page.slug, language: page.language } },
    update: {
      title: page.title,
      content: page.content,
    },
    create: page,
  });

  revalidatePath(`/${locale}/page/${slug}/${language}`);
  revalidatePath(`/${language}/page/${slug}`);
  return redirect(`/page/${slug}/${language}`);
}
