import LarpPage, { getLarpPageData } from "@/components/LarpPage";
import { db } from "@/prisma/db";
import { getTranslations } from "@/translations";
import { Metadata } from "next";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{
    locale: string;
    alias: string;
  }>;
  searchParams?: Promise<{ code?: string }>;
}

async function getContent({ params }: Props) {
  const { alias, locale } = await params;
  const [larp, page] = await Promise.all([
    db.orm.public.Larp.select("name", "tagline").first({ alias }),
    db.orm.public.Page.select("title", "content").first({
      slug: alias,
      language: locale,
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

export default async function LarpByAliasPage({ params, searchParams }: Props) {
  const { alias, locale } = await params;
  const code = (await searchParams)?.code;
  return (
    <LarpPage
      larpPromise={getLarpPageData({ alias })}
      locale={locale}
      code={code}
    />
  );
}
