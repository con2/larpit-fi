"use server";

import { redirect } from "next/navigation";

import {
  removeHeaderImageFrom,
  saveHeaderImageSettingsFor,
} from "@/models/headerImageActions";
import { contentPagePath } from "@/models/Page.client";

export async function saveHeaderImageSettings(
  slug: string,
  language: string,
  formData: FormData,
) {
  await saveHeaderImageSettingsFor({ kind: "page", slug, language }, formData);
  redirect(contentPagePath(slug, language));
}

export async function removeHeaderImage(slug: string, language: string) {
  await removeHeaderImageFrom({ kind: "page", slug, language });
  redirect(contentPagePath(slug, language));
}
