import LarpPage, { getLarpPageData } from "@/components/LarpPage";
import { getTranslations } from "@/translations";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { validate as uuidValidate } from "uuid";
import prisma from "@/prisma";
import { publicUrl } from "@/config";

interface Props {
  params: Promise<{
    locale: string;
    larpId: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { larpId, locale } = await params;

  // avoid 500 on invalid UUID
  if (!uuidValidate(larpId)) {
    notFound();
  }

  const larp = await prisma.larp.findUnique({
    where: { id: larpId },
  });
  if (!larp) {
    notFound();
  }

  const translations = getTranslations(locale);

  return {
    title: `${larp.name} – ${translations.title}`,
    description: larp.tagline,
    alternates: {
      types: {
        "application/json": `${publicUrl}/api/larp/${larp.id}`,
      },
    },
  };
}

export default async function LarpByIdPage({ params }: Props) {
  const { larpId, locale } = await params;

  // avoid 500 on invalid UUID
  if (!uuidValidate(larpId)) {
    notFound();
  }

  return (
    <LarpPage larpPromise={getLarpPageData({ id: larpId })} locale={locale} />
  );
}
