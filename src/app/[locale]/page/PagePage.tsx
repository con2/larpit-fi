import { auth } from "@/auth";
import HeaderImageBackdrop, {
  heroTextClassName,
  heroWithImageClassName,
} from "@/components/header-image/HeaderImageBackdrop";
import AuroraHero from "@/components/ui/AuroraHero";
import { featureFlags, headerImagesEnabled } from "@/config";
import {
  type HeaderImageRow,
  headerImageViewOrNull,
} from "@/models/HeaderImage";
import { getInfoMenuPages } from "@/models/Page";
import { pageAdminPath, pagePathInUiLanguage } from "@/models/Page.client";
import type { Page } from "@/prisma/models";
import { canEditPages, getUserFromSession } from "@/models/User";
import { getReader } from "@/prisma/reader";
import { getTranslations } from "@/translations";
import { Markdown } from "@con2/components";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

interface Props {
  page:
    | (Pick<Page, "title" | "ingress" | "content" | "slug" | "language"> & {
        headerImage: HeaderImageRow | null;
      })
    | null;
  locale: string;
  /**
   * Lists the info menu pages beside the content when this page is one of them. Pages with a
   * purpose of their own, such as contact, leave it out.
   */
  showInfoIndex?: boolean;
  /** Rendered below the content. */
  children?: ReactNode;
}

async function getInfoIndex(language: string) {
  if (!featureFlags.infoMenu) return [];
  const { db: reader } = await getReader();
  return getInfoMenuPages(language, reader);
}

export default async function PagePage({
  page,
  locale,
  showInfoIndex = false,
  children,
}: Props) {
  const translations = getTranslations(locale);
  const t = translations.Page;
  if (!page) {
    notFound();
  }

  const session = await auth();
  const user = await getUserFromSession(session);
  const infoMenuPages = showInfoIndex ? await getInfoIndex(locale) : [];
  const infoIndex = infoMenuPages.some(({ slug }) => slug === page.slug)
    ? infoMenuPages
    : [];
  const headerImage = headerImageViewOrNull(page.headerImage);
  // A page shown in another language than the UI, because the UI language has none.
  const contentLang = page.language === locale ? undefined : page.language;

  const header = (
    <header className="lf-page-header border-0">
      <div
        className={headerImage ? heroTextClassName : undefined}
        lang={contentLang}
      >
        <h1 className="lf-display-l m-0">{page.title}</h1>
        {page.ingress.trim() && (
          <div className="lf-lede mt-3">
            <Markdown input={page.ingress} />
          </div>
        )}
      </div>
      {canEditPages(user) && (
        <p className="m-0 d-flex gap-3">
          <Link
            className="lf-link-quiet"
            href={pageAdminPath("edit", page.slug, page.language)}
          >
            {t.actions.edit.title} →
          </Link>
          {headerImagesEnabled && (
            <Link
              className="lf-link-quiet"
              href={pageAdminPath("header-image", page.slug, page.language)}
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
        <AuroraHero>{header}</AuroraHero>
      )}
      {infoIndex.length > 0 ? (
        <div className="lf-container lf-main-aside">
          <div>
            {page.content.trim() && (
              <div className="lf-prose" lang={contentLang}>
                <Markdown input={page.content} />
              </div>
            )}
          </div>
          <aside>
            <nav aria-labelledby="PagePage-infoIndex">
              <h2
                id="PagePage-infoIndex"
                className="lf-label lf-sidebar-heading"
              >
                {translations.AppBar.infoMenu}
              </h2>
              <div className="lf-compact-list">
                {infoIndex.map(({ slug, title }) => (
                  <Link
                    key={slug}
                    href={pagePathInUiLanguage(slug)}
                    className="lf-compact-row"
                    aria-current={slug === page.slug ? "page" : undefined}
                  >
                    {title}
                  </Link>
                ))}
              </div>
            </nav>
          </aside>
        </div>
      ) : (
        page.content.trim() && (
          <div className="lf-container">
            <div className="lf-prose py-5" lang={contentLang}>
              <Markdown input={page.content} />
            </div>
          </div>
        )
      )}
      {children}
    </>
  );
}
