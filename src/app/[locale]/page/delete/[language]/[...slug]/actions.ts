"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { deletePage } from "@/models/Page";
import { canManagePages, getUserFromSession } from "@/models/User";

export async function deletePageAction(slug: string, language: string) {
  const user = await getUserFromSession(await auth());
  if (!canManagePages(user)) {
    throw new Error("Insufficient privileges");
  }
  if (!(await deletePage(slug, language))) {
    throw new Error("This page cannot be deleted");
  }
  revalidatePath("/", "layout");
  redirect("/page");
}
