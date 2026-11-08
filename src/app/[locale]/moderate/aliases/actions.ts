"use server";

import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { type LarpAliasError, setLarpAlias } from "@/models/Larp";
import { getUserFromSession } from "@/models/User";

export interface SaveLarpAliasesState {
  saved: number;
  /** Keyed by larp id. */
  errors: Record<string, LarpAliasError>;
}

/**
 * Sets the alias of every larp whose field is filled in; an empty field skips its larp. The form
 * repeats a `larpId` and an `alias` field per row, in the same order.
 */
export async function saveLarpAliases(
  _previousState: SaveLarpAliasesState,
  formData: FormData,
): Promise<SaveLarpAliasesState> {
  const user = await getUserFromSession(await auth());
  const state: SaveLarpAliasesState = { saved: 0, errors: {} };

  const larpIds = formData.getAll("larpId");
  const aliases = formData.getAll("alias");

  // One larp at a time, so that two rows asking for the same alias fail on the second one.
  for (const [index, larpId] of larpIds.entries()) {
    const alias = aliases[index];
    if (typeof larpId !== "string" || typeof alias !== "string") continue;
    if (!alias.trim()) continue;

    const result = await setLarpAlias(user, larpId, alias);
    if (result.ok) {
      state.saved++;
    } else if (result.error === "forbidden") {
      notFound();
    } else if (result.error !== "notFound") {
      state.errors[larpId] = result.error;
    }
  }

  if (state.saved > 0) {
    revalidatePath("/[locale]/moderate/aliases", "page");
    revalidatePath("/[locale]/larp/[larpId]", "page");
    revalidatePath("/[locale]/[alias]", "page");
  }
  return state;
}
