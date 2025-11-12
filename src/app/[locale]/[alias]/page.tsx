import LarpPage, { getLarpPageData } from "@/components/LarpPage";
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

async function getContent({ params }: Props) {
  const { alias, locale } = await params;
  const [larp, page] = await Promise.all([
    prisma.larp.findUnique({
      where: { alias: alias },
      select: {
        name: true,
        tagline: true,
      },
    }),
    prisma.page.findUnique({
      where: { slug_language: { slug: alias, language: locale } },
      select: {
        title: true,
        content: true,
      },
    }),
  ]);
  if (!larp && !page) {
    notFound();
  }
  return { larp, page };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const translations = getTranslations(locale);
  const { larp, page } = await getContent({ params });

  if (page) {
    return {
      title: page.title,
      description: page.content,
    };
  } else if (larp) {
    return {
      title: `${larp.name} – ${translations.title}`,
      description: larp.tagline,
    };
  } else {
    notFound();
  }
}

export default async function LarpByAliasPage({ params }: Props) {
  const { alias, locale } = await params;
  return <LarpPage larpPromise={getLarpPageData({ alias })} locale={locale} />;
}
