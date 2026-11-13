import { auth } from "@/auth";
import { LoginRequiredCard } from "@/components/LoginRequiredCard";
import { Column, DataTable } from "@con2/components";
import { MessageCard } from "@/components/MessageCard";
import {
  contentPagePath,
  pageAdminPath,
  protectedPageSlugs,
} from "@/models/Page.client";
import {
  canEditPages,
  canManagePages,
  getUserFromSession,
} from "@/models/User";
import { db } from "@/prisma/db";
import { getTranslations } from "@/translations";
import Link from "next/link";

interface Props {
  params: Promise<{ locale: string }>;
}

async function getData() {
  return db.orm.public.Page.orderBy([
    (p) => p.slug.asc(),
    (p) => p.language.asc(),
  ]).all();
}

export default async function PagesPage({ params }: Props) {
  const { locale } = await params;
  const translations = getTranslations(locale);
  const t = translations.Page;

  const session = await auth();

  const user = await getUserFromSession(session);
  if (!user) {
    return (
      <LoginRequiredCard messages={translations.LoginRequired} container />
    );
  }
  if (!canEditPages(user)) {
    return (
      <MessageCard
        title={translations.ModeratorRequired.title}
        message={translations.ModeratorRequired.message}
        container
      />
    );
  }

  const pages = await getData();

  const columns: Column<(typeof pages)[number]>[] = [
    {
      slug: "slug",
      title: t.attributes.slug.title,
      getCellContents: (row) => <code>{row.slug}</code>,
    },
    {
      slug: "language",
      title: t.attributes.language.title,
      getCellContents: (row) => <code>{row.language}</code>,
    },
    {
      slug: "title",
      title: t.attributes.title.title,
    },
    {
      slug: "menuPosition",
      title: t.attributes.menuPosition.title,
      className: "text-end",
      getCellContents: (row) => row.menuPosition ?? "",
    },
    {
      slug: "actions",
      title: "",
      className: "text-end",
      getCellContents: (row) => (
        <>
          <Link
            href={contentPagePath(row.slug, row.language)}
            className="link-subtle"
          >
            {t.actions.view.label}
          </Link>{" "}
          <Link
            href={pageAdminPath("edit", row.slug, row.language)}
            className="ms-2 link-subtle"
          >
            {t.actions.edit.label}
          </Link>
          {canManagePages(user) && !protectedPageSlugs.includes(row.slug) && (
            <Link
              href={pageAdminPath("delete", row.slug, row.language)}
              className="ms-2 link-subtle"
            >
              {t.actions.delete.label}
            </Link>
          )}
        </>
      ),
    },
  ];

  return (
    <div className="lf-container">
      <header className="lf-page-header mb-4">
        <h1 className="lf-display-l">{t.listTitle}</h1>
        {canManagePages(user) && (
          <p className="m-0">
            <Link className="lf-link-quiet" href="/page/new">
              {t.actions.newPage.title} →
            </Link>
          </p>
        )}
      </header>
      <div className="table-responsive mb-5">
        <DataTable className="table" columns={columns} rows={pages} />
      </div>
    </div>
  );
}
