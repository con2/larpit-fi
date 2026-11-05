import { auth } from "@/auth";
import type { Page } from "@/prisma/models";
import { canEditPages, getUserFromSession } from "@/models/User";
import { getTranslations } from "@/translations";
import { Markdown } from "@con2/components";
import Link from "next/link";
import { notFound } from "next/navigation";

interface Props {
  page: Pick<Page, "title" | "content" | "slug" | "language"> | null;
  locale: string;
}

export default async function PagePage({ page, locale }: Props) {
  const translations = getTranslations(locale);
  const t = translations.Page;
  if (!page) {
    notFound();
  }

  const session = await auth();
  const user = await getUserFromSession(session);

  return (
    <div className="lf-container">
      <header className="lf-page-header">
        <h1 className="lf-display-l">{page.title}</h1>
        {canEditPages(user) && (
          <p className="m-0">
            <Link
              className="lf-link-quiet"
              href={`/page/${page.slug}/${page.language}/edit`}
            >
              {t.actions.edit.title} →
            </Link>
          </p>
        )}
      </header>
      <div className="lf-prose py-5">
        <Markdown input={page.content} />
      </div>
    </div>
  );
}
