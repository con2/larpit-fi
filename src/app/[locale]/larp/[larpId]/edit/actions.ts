"use server";

import { LarpLinksForm } from "@/models/LarpLink";
import { ModerationRequestForm } from "@/models/ModerationRequest";

export async function editLarp(
  locale: string,
  larpId: string,
  formData: FormData
) {
  const formDataObject = Object.fromEntries(formData.entries());
  const newContent = ModerationRequestForm.parse(formDataObject);
  const links = LarpLinksForm.parse(formDataObject);
  console.log("editLarp", { locale, larpId, newContent, links });
}
