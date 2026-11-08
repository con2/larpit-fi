import LarpPage, { getLarpPageData } from "@/components/LarpPage";
import { larpMetadata } from "@/components/larp-page/larpMetadata";
import { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { cache } from "react";

import { findLarpByAliasRedirect, getLarpHref } from "@/models/Larp";
import { getReader } from "@/prisma/reader";

interface Props {
  params: Promise<{
    locale: string;
    alias: string;
  }>;
  searchParams?: Promise<{ code?: string }>;
}

const getContent = cache(async (alias: string, locale: string) => {
  const { db: reader } = await getReader();
  const [larp, page] = await Promise.all([
    reader.orm.public.Larp.select("name", "tagline")
      .include("headerImage")
      .first({ alias }),
    reader.orm.public.Page.select("title", "content").first({
      slug: alias,
      language: locale,
    }),
  ]);
  if (!larp && !page) {
    const redirectTarget = await findLarpByAliasRedirect(alias, reader);
    if (redirectTarget) permanentRedirect(getLarpHref(redirectTarget));
    notFound();
  }
  return { larp, page };
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { alias, locale } = await params;
  const { larp, page } = await getContent(alias, locale);

  if (page) {
    return {
      title: page.title,
      description: page.content,
    };
  } else if (larp) {
    return larpMetadata(larp, locale);
  } else {
    notFound();
  }
}

export default async function LarpByAliasPage({ params, searchParams }: Props) {
  const { alias, locale } = await params;
  const code = (await searchParams)?.code;
  // generateMetadata is streamed to browsers, so its redirect would only happen client-side.
  await getContent(alias, locale);
  return (
    <LarpPage
      larpPromise={getLarpPageData({ alias })}
      locale={locale}
      code={code}
    />
  );
}
