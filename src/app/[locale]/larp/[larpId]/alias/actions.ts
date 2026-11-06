"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { setLarpAlias } from "@/models/Larp";
import { getLarpHref } from "@/models/Larp.client";
import { getUserFromSession } from "@/models/User";

export async function saveLarpAlias(larpId: string, formData: FormData) {
  const user = await getUserFromSession(await auth());
  const alias = formData.get("alias");
  const result = await setLarpAlias(
    user,
    larpId,
    typeof alias === "string" ? alias : null,
  );

  if (!result.ok) {
    if (result.error === "forbidden" || result.error === "notFound") {
      notFound();
    }
    const params = new URLSearchParams({
      error: result.error,
      alias: typeof alias === "string" ? alias : "",
    });
    redirect(`/larp/${larpId}/alias?${params}`);
  }

  revalidatePath("/[locale]/larp/[larpId]", "page");
  revalidatePath("/[locale]/[alias]", "page");
  redirect(getLarpHref({ id: larpId, alias: result.alias }));
}
