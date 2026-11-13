"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getLarpHref } from "@/models/Larp";
import { mergeLarps, type MergeLarpsError } from "@/models/LarpMerge";
import { MergeChoices, mergeableFields } from "@/models/LarpMerge.client";
import { getUserFromSession } from "@/models/User";
import fi from "@/translations/fi";

export interface MergeLarpState {
  error: MergeLarpsError | null;
}

/**
 * Merges larp B (the `bId` field) into larp A. The form sends `field.<name>` only for fields
 * with a decision, `customName` when the moderator wrote their own name, one `keepLinkId` per
 * ticked link and the update counts and timestamps the moderator saw.
 */
export async function mergeLarpAction(
  aId: string,
  _previousState: MergeLarpState,
  formData: FormData,
): Promise<MergeLarpState> {
  const user = await getUserFromSession(await auth());
  if (!user) return { error: "forbidden" };

  const fields: Record<string, string> = {};
  for (const field of mergeableFields) {
    const side = formData.get(`field.${field}`);
    if (typeof side === "string") fields[field] = side;
  }
  const choices = MergeChoices.safeParse({
    fields,
    customName: formData.get("customName") || undefined,
    keepLinkIds: formData.getAll("keepLinkId"),
    aUpdateCount: Number(formData.get("aUpdateCount")),
    bUpdateCount: Number(formData.get("bUpdateCount")),
    aUpdatedAt: formData.get("aUpdatedAt"),
    bUpdatedAt: formData.get("bUpdatedAt"),
  });
  const bId = formData.get("bId");
  if (!choices.success || typeof bId !== "string") {
    return { error: "stale" };
  }

  const result = await mergeLarps(user, aId, bId, choices.data, (merged) =>
    fi.ModerationRequest.messages.mergedFrom(merged.name, merged.id),
  );
  if (!result.ok) return { error: result.error };

  revalidatePath("/[locale]/larp/[larpId]", "page");
  revalidatePath("/[locale]/[alias]", "page");
  revalidatePath("/[locale]/moderate", "page");
  redirect(getLarpHref(result.larp));
}
