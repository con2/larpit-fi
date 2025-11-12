import prisma from "@/prisma";
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

  const page = await prisma.page.findUnique({
    where: { slug_language: { slug, language: locale } },
  });

  return <PagePage page={page} locale={locale} />;
}
