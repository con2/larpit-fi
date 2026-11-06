"use server";

import { redirect } from "next/navigation";

import {
  removeHeaderImageFrom,
  saveHeaderImageSettingsFor,
} from "@/models/headerImageActions";

export async function saveHeaderImageSettings(
  larpId: string,
  formData: FormData,
) {
  await saveHeaderImageSettingsFor({ kind: "larp", id: larpId }, formData);
  redirect(`/larp/${larpId}`);
}

export async function removeHeaderImage(larpId: string) {
  await removeHeaderImageFrom({ kind: "larp", id: larpId });
  redirect(`/larp/${larpId}`);
}
