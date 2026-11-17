"use server";

import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { validate as validateUuid } from "uuid";

import { auth } from "@/auth";
import { setLarpTags } from "@/models/Tag";
import { parseLarpTagsFromFormData } from "@/models/Tag.client";
import { getUserFromSession } from "@/models/User";

export interface SaveLarpTagsState {
  saved: number;
}

/** The form repeats a `larpId` field per row and names the tag fields of each row by its larp. */
export async function saveLarpTags(
  _previousState: SaveLarpTagsState,
  formData: FormData,
): Promise<SaveLarpTagsState> {
  const user = await getUserFromSession(await auth());
  const larpIds = new Set(
    formData
      .getAll("larpId")
      .filter(
        (value): value is string =>
          typeof value === "string" && validateUuid(value),
      ),
  );

  const changedLarpIds: string[] = [];
  for (const larpId of larpIds) {
    const { loaded, desired } = parseLarpTagsFromFormData(formData, larpId);
    const result = await setLarpTags(user, larpId, loaded, desired);
    if (!result.ok && result.error === "forbidden") notFound();
    if (result.ok && result.changed) changedLarpIds.push(larpId);
  }

  if (changedLarpIds.length > 0) {
    console.log("AUDIT", "saveLarpTags", {
      actorUserId: user?.id,
      larpIds: changedLarpIds,
    });
    revalidatePath("/[locale]/moderate/tags", "page");
    revalidatePath("/[locale]/tag", "layout");
    revalidatePath("/[locale]/larp", "layout");
    revalidatePath("/[locale]/[alias]", "page");
    revalidatePath("/[locale]", "page");
  }
  return { saved: changedLarpIds.length };
}
