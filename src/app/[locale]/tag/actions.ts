"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { createTag, deleteTag, TagForm, updateTag } from "@/models/Tag";
import { suggestTagSlug } from "@/models/Tag.client";
import { canModerate, getUserFromSession } from "@/models/User";

async function requireModerator() {
  const user = await getUserFromSession(await auth());
  if (!user || !canModerate(user)) {
    throw new Error("Unauthorized");
  }
  return user;
}

function revalidateTagPaths() {
  revalidatePath("/[locale]/tag", "layout");
  revalidatePath("/[locale]/larp", "layout");
  revalidatePath("/[locale]", "page");
}

/** Creates a tag when `tagId` is null, otherwise updates it. */
export async function saveTag(tagId: string | null, formData: FormData) {
  const user = await requireModerator();

  const field = (name: string) => {
    const value = formData.get(name);
    return typeof value === "string" ? value : "";
  };
  const form = TagForm.parse({
    slug: field("slug"),
    nameFi: field("nameFi"),
    nameEn: field("nameEn"),
    descriptionFi: field("descriptionFi"),
    descriptionEn: field("descriptionEn"),
  });
  if (!form.slug) form.slug = suggestTagSlug(form.nameEn);

  const result = tagId ? await updateTag(tagId, form) : await createTag(form);

  console.log("AUDIT", tagId ? "updateTag" : "createTag", {
    actorUserId: user.id,
    tagId: result.ok ? result.tag.id : tagId,
    slug: form.slug,
    error: result.ok ? undefined : result.error,
  });

  if (!result.ok) {
    const params = new URLSearchParams({ error: result.error, ...form });
    params.set(tagId ? "edit" : "new", tagId ? field("currentSlug") : "1");
    redirect(`/tag?${params}`);
  }

  revalidateTagPaths();
  redirect(`/tag#tag-${result.tag.slug}`);
}

export async function removeTag(tagId: string, _formData: FormData) {
  const user = await requireModerator();
  const larpCount = await deleteTag(tagId);

  console.log("AUDIT", "deleteTag", { actorUserId: user.id, tagId, larpCount });

  revalidateTagPaths();
  redirect("/tag");
}
