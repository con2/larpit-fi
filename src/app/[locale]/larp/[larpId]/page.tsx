import LarpPage, { getLarpPageData } from "@/components/LarpPage";
import { larpMetadata } from "@/components/larp-page/larpMetadata";
import { publicUrl } from "@/config";
import { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { cache } from "react";
import { validate as uuidValidate } from "uuid";

import { findLarpRedirect, getLarpHref } from "@/models/Larp";
import { getReader } from "@/prisma/reader";

interface Props {
  params: Promise<{
    locale: string;
    larpId: string;
  }>;
  searchParams: Promise<{
    code?: string;
    success?: string;
  }>;
}

/** Redirects the id of a larp merged into another one to the surviving larp. */
const getMetadataLarp = cache(async (larpId: string) => {
  // avoid 500 on invalid UUID
  if (!uuidValidate(larpId)) {
    notFound();
  }

  const { db: reader } = await getReader();
  const larp = await reader.orm.public.Larp.select("id", "name", "tagline")
    .include("headerImage")
    .first({ id: larpId });
  if (!larp) {
    const redirectTarget = await findLarpRedirect(larpId, reader);
    if (redirectTarget) permanentRedirect(getLarpHref(redirectTarget));
    notFound();
  }
  return larp;
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { larpId, locale } = await params;
  const larp = await getMetadataLarp(larpId);

  return larpMetadata(larp, locale, {
    types: {
      "application/json": `${publicUrl}/api/larp/${larp.id}`,
    },
  });
}

export default async function LarpByIdPage({ params, searchParams }: Props) {
  const { larpId, locale } = await params;
  const { code, success } = await searchParams;
  // generateMetadata is streamed to browsers, so its redirect would only happen client-side.
  await getMetadataLarp(larpId);

  return (
    <LarpPage
      larpPromise={getLarpPageData({ id: larpId })}
      locale={locale}
      code={code}
      signupVerified={success === "signupVerified"}
    />
  );
}
