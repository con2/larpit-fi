import LarpPage, { getLarpPageData } from "@/components/LarpPage";
import { larpMetadata } from "@/components/larp-page/larpMetadata";
import { publicUrl } from "@/config";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { validate as uuidValidate } from "uuid";
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { larpId, locale } = await params;

  // avoid 500 on invalid UUID
  if (!uuidValidate(larpId)) {
    notFound();
  }

  const { db: reader } = await getReader();
  const larp = await reader.orm.public.Larp.select("id", "name", "tagline")
    .include("headerImage")
    .first({ id: larpId });
  if (!larp) {
    notFound();
  }

  return larpMetadata(larp, locale, {
    types: {
      "application/json": `${publicUrl}/api/larp/${larp.id}`,
    },
  });
}

export default async function LarpByIdPage({ params, searchParams }: Props) {
  const { larpId, locale } = await params;
  const { code, success } = await searchParams;

  // avoid 500 on invalid UUID
  if (!uuidValidate(larpId)) {
    notFound();
  }

  return (
    <LarpPage
      larpPromise={getLarpPageData({ id: larpId })}
      locale={locale}
      code={code}
      signupVerified={success === "signupVerified"}
    />
  );
}
