import LarpPage from "@/components/LarpPage";
import prisma from "@/prisma";
import { getTranslations } from "@/translations";
import { Metadata } from "next";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{
    locale: string;
    alias: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { alias, locale } = await params;
  const translations = getTranslations(locale);
  const larp = await prisma.larp.findUnique({
    where: { alias: alias },
  });
  if (!larp) {
    notFound();
  }
  return {
    title: `${larp.name} – ${translations.brand}`,
    description: larp.tagline,
  };
}

export default async function LarpByAliasPage({ params }: Props) {
  const { alias, locale } = await params;
  const larp = await prisma.larp.findUnique({
    where: { alias: alias },
  });
  if (!larp) {
    notFound();
  }
  return <LarpPage larpId={larp.id} locale={locale} />;
}
