"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { createPage, NewPageForm } from "@/models/Page";
import { pageAdminPath, parseMenuPosition } from "@/models/Page.client";
import { canManagePages, getUserFromSession } from "@/models/User";

export async function createPageAction(formData: FormData) {
  const user = await getUserFromSession(await auth());
  if (!canManagePages(user)) {
    throw new Error("Insufficient privileges");
  }

  const page = NewPageForm.parse({
    slug: String(formData.get("slug") ?? "").trim(),
    language: formData.get("language"),
    title: formData.get("title"),
    menuPosition: parseMenuPosition(formData.get("menuPosition")),
  });

  const result = await createPage(page);
  if (!result.ok) {
    const query = new URLSearchParams({
      error: result.error,
      slug: page.slug,
      language: page.language,
      title: page.title,
      menuPosition: page.menuPosition?.toString() ?? "",
    });
    redirect(`/page/new?${query}`);
  }

  revalidatePath("/", "layout");
  redirect(pageAdminPath("edit", page.slug, page.language));
}
