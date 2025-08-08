import { FormattedDateRange } from "@/components/FormattedDateRange";
import LarpPage from "@/components/LarpPage";
import { LarpLink, PrismaClient } from "@/generated/prisma";
import { getTranslations } from "@/translations";
import { Translations } from "@/translations/en";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardBody, CardTitle } from "react-bootstrap";

const prisma = new PrismaClient();

interface Props {
  params: Promise<{
    locale: string;
    larpId: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { larpId, locale } = await params;
  const translations = getTranslations(locale);
  const larp = await prisma.larp.findUnique({
    where: { id: larpId },
  });
  if (!larp) {
    notFound();
  }
  return {
    title: `${larp.name} – ${translations.brand}`,
    description: larp.tagline,
  };
}

export default async function LarpByIdPage({ params }: Props) {
  const { larpId, locale } = await params;
  return <LarpPage larpId={larpId} locale={locale} />;
}
