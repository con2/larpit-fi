import { db } from "@/prisma/db";
import PagePage from "../PagePage";
import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function PageWithoutLanguagePage({ params }: Props) {
  const { locale, slug } = await params;

  if (slug === "front-page") {
    redirect("/");
  }

  const page = await db.orm.public.Page.first({ slug, language: locale });

  return <PagePage page={page} locale={locale} />;
}
