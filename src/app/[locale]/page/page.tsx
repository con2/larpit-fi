import { auth } from "@/auth";
import { Column, DataTable } from "@/components/DataTable";
import InsufficientPrivileges from "@/components/InsufficientPrivileges";
import LoginRequired from "@/components/LoginRequired";
import MainHeading from "@/components/MainHeading";
import { canEditPages, getUserFromSession } from "@/models/User";
import prisma from "@/prisma";
import { getTranslations } from "@/translations";
import Link from "next/link";
import { Container } from "react-bootstrap";

interface Props {
  params: Promise<{ locale: string }>;
}

async function getData() {
  return prisma.page.findMany({
    orderBy: [{ slug: "asc" }, { language: "asc" }],
  });
}

export default async function PagesPage({ params }: Props) {
  const { locale } = await params;
  const translations = getTranslations(locale);
  const t = translations.Page;

  const session = await auth();

  const user = await getUserFromSession(session);
  if (!user) {
    return <LoginRequired messages={translations.LoginRequired} />;
  }
  if (!canEditPages(user)) {
    return <InsufficientPrivileges messages={translations.AdminRequired} />;
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
      slug: "actions",
      title: "",
      className: "text-end",
      getCellContents: (row) => (
        <>
          <Link
            href={`/${locale}/page/${row.slug}/${row.language}`}
            className="link-subtle"
          >
            {t.actions.view.label}
          </Link>{" "}
          <Link
            href={`/${locale}/page/${row.slug}/${row.language}/edit`}
            className="ms-2  link-subtle"
          >
            {t.actions.edit.label}
          </Link>
        </>
      ),
    },
  ];

  return (
    <Container>
      <MainHeading>{t.listTitle}</MainHeading>
      <p className="text-center mb-3">
        <Link className="link-subtle" href={`/page/new`}>
          {t.actions.newPage.title}
        </Link>
      </p>
      <DataTable
        // TODO rounded doesn't work on bootstrap .table?
        className="table table-striped border rounded"
        columns={columns}
        rows={pages}
      />
    </Container>
  );
}
