import { db } from "@/prisma/db";
import PagePage from "../../PagePage";

interface Props {
  params: Promise<{ locale: string; slug: string; language: string }>;
}

export default async function PageWithLanguagePage({ params }: Props) {
  const { locale, language, slug } = await params;
  const page = await db.orm.public.Page.first({ slug, language });

  return <PagePage page={page} locale={locale} />;
}
