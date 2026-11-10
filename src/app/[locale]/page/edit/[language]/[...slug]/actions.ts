"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { PageForm, renamePage } from "@/models/Page";
import {
  contentPagePath,
  frontPageSlug,
  pageAdminPath,
  parseMenuPosition,
} from "@/models/Page.client";
import {
  canEditPages,
  canManagePages,
  getUserFromSession,
} from "@/models/User";
import { db } from "@/prisma/db";

export async function putPage(
  slug: string,
  language: string,
  formData: FormData,
) {
  const user = await getUserFromSession(await auth());
  if (!canEditPages(user)) {
    throw new Error("Insufficient privileges");
  }

  const page = PageForm.parse({
    title: formData.get("title"),
    ingress: formData.get("ingress") ?? "",
    content: formData.get("content") ?? "",
    menuPosition: parseMenuPosition(formData.get("menuPosition")),
  });

  // The front page shows only its ingress, so its form has no content or menu position fields.
  const update =
    slug === frontPageSlug
      ? { title: page.title, ingress: page.ingress }
      : page;
  await db.orm.public.Page.where({ slug, language }).update(update);

  // The info menu in the app bar of every page lists page titles.
  revalidatePath("/", "layout");
  redirect(contentPagePath(slug, language));
}

export async function changePageSlug(
  slug: string,
  language: string,
  formData: FormData,
) {
  const user = await getUserFromSession(await auth());
  if (!canManagePages(user)) {
    throw new Error("Insufficient privileges");
  }

  const newSlug = String(formData.get("slug") ?? "").trim();
  if (newSlug === slug) redirect(pageAdminPath("edit", slug, language));

  const result = await renamePage(slug, language, newSlug);
  if (!result.ok) {
    redirect(`${pageAdminPath("edit", slug, language)}?error=${result.error}`);
  }

  revalidatePath("/", "layout");
  redirect(pageAdminPath("edit", newSlug, language));
}
