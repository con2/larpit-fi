import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { isRootPageSlug, pickPageLanguage } from "@/models/Page.client";
import { getReader } from "@/prisma/reader";
import PagePage from "../page/PagePage";

interface Props {
  params: Promise<{ locale: string; rest: string[] }>;
}

const getRootPage = cache(async (slug: string, language: string) => {
  if (!isRootPageSlug(slug)) return null;
  const { db: reader } = await getReader();
  const pages = await reader.orm.public.Page.include("headerImage")
    .where({ slug })
    .all();
  return pickPageLanguage(pages, language);
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, rest } = await params;
  const page = await getRootPage(rest.join("/"), locale);
  if (!page) notFound();
  return { title: page.title, description: page.ingress || undefined };
}

/**
 * Serves content pages whose slug has a slash, such as `larppaus/aloittaminen`, preferring the UI
 * language. Every other unmatched path goes to `[locale]/not-found.tsx`, inside the site layout.
 */
export default async function RootPagePage({ params }: Props) {
  const { locale, rest } = await params;
  const page = await getRootPage(rest.join("/"), locale);
  return <PagePage page={page} locale={locale} />;
}
