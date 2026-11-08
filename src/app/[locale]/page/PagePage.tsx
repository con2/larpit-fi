import { auth } from "@/auth";
import HeaderImageBackdrop, {
  heroTextClassName,
  heroWithImageClassName,
} from "@/components/header-image/HeaderImageBackdrop";
import { headerImagesEnabled } from "@/config";
import {
  type HeaderImageRow,
  headerImageViewOrNull,
} from "@/models/HeaderImage";
import type { Page } from "@/prisma/models";
import { canEditPages, getUserFromSession } from "@/models/User";
import { getTranslations } from "@/translations";
import { Markdown } from "@con2/components";
import Link from "next/link";
import { notFound } from "next/navigation";

interface Props {
  page:
    | (Pick<Page, "title" | "content" | "slug" | "language"> & {
        headerImage: HeaderImageRow | null;
      })
    | null;
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
  const headerImage = headerImageViewOrNull(page.headerImage);

  const header = (
    <header className={`lf-page-header${headerImage ? " border-0" : ""}`}>
      <div className={headerImage ? heroTextClassName : undefined}>
        <h1 className="lf-display-l m-0">{page.title}</h1>
      </div>
      {canEditPages(user) && (
        <p className="m-0 d-flex gap-3">
          <Link
            className="lf-link-quiet"
            href={`/page/${page.slug}/${page.language}/edit`}
          >
            {t.actions.edit.title} →
          </Link>
          {headerImagesEnabled && (
            <Link
              className="lf-link-quiet"
              href={`/page/${page.slug}/${page.language}/header-image`}
            >
              {t.actions.headerImage.title} →
            </Link>
          )}
        </p>
      )}
    </header>
  );

  return (
    <>
      {headerImage ? (
        <section className={heroWithImageClassName}>
          <HeaderImageBackdrop
            view={headerImage}
            messages={translations.HeaderImage}
          />
          <div className="lf-container">{header}</div>
        </section>
      ) : (
        <div className="lf-container">{header}</div>
      )}
      <div className="lf-container">
        <div className="lf-prose py-5">
          <Markdown input={page.content} />
        </div>
      </div>
    </>
  );
}
