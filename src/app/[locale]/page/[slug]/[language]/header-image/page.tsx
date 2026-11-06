import { MessageCard } from "@con2/components";
import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import HeaderImageEditor from "@/components/header-image/HeaderImageEditor";
import { headerImagesEnabled } from "@/config";
import { headerImageViewOrNull } from "@/models/HeaderImage";
import { contentPagePath } from "@/models/Page";
import { canEditPages, getUserFromSession } from "@/models/User";
import { db } from "@/prisma/db";
import { getTranslations, toSupportedLanguage } from "@/translations";

import { removeHeaderImage, saveHeaderImageSettings } from "./actions";

interface Props {
  params: Promise<{ locale: string; slug: string; language: string }>;
}

export default async function PageHeaderImagePage({ params }: Props) {
  const resolvedParams = await params;
  const locale = toSupportedLanguage(resolvedParams.locale);
  const { slug, language } = resolvedParams;
  if (!headerImagesEnabled) notFound();

  const translations = getTranslations(locale);
  const t = translations.HeaderImage;

  const page = await db.orm.public.Page.select("slug", "language", "title")
    .include("headerImage")
    .first({ slug, language });
  if (!page) notFound();

  const user = await getUserFromSession(await auth());
  if (!canEditPages(user)) {
    return (
      <MessageCard
        title={translations.AdminRequired.title}
        message={translations.AdminRequired.message}
        container
      />
    );
  }

  const returnHref = contentPagePath(slug, language);

  return (
    <div className="lf-container">
      <header className="lf-page-header mb-4">
        <Link href={returnHref} className="lf-link-quiet">
          ← {page.title}
        </Link>
        <h1 className="lf-display-l">{t.title}</h1>
        <div className="lf-lede">{t.ledePage}</div>
      </header>
      <div className="mb-5">
        <HeaderImageEditor
          target={{ kind: "page", slug, language }}
          existing={headerImageViewOrNull(page.headerImage)}
          returnHref={returnHref}
          saveAction={saveHeaderImageSettings.bind(null, slug, language)}
          removeAction={removeHeaderImage.bind(null, slug, language)}
          previewTitle={page.title}
          messages={t}
        />
      </div>
    </div>
  );
}
