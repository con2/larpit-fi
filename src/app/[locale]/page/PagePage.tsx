import { auth } from "@/auth";
import MainHeading from "@/components/MainHeading";
import Markdown from "@/components/Markdown";
import { Page } from "@/generated/prisma/client";
import { canEditPages } from "@/models/User";
import prisma from "@/prisma";
import { getTranslations } from "@/translations";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardBody, Container } from "react-bootstrap";

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
  const user = session?.user?.email
    ? await prisma.user.findUnique({
        where: {
          email: session.user.email,
        },
        select: {
          id: true,
          role: true,
        },
      })
    : null;

  return (
    <Container>
      <MainHeading>{page.title}</MainHeading>
      {canEditPages(user) && (
        <p className="text-center mb-3">
          <Link
            className="link-subtle"
            href={`/page/${page.slug}/${page.language}/edit`}
          >
            {t.actions.edit.title}
          </Link>
        </p>
      )}
      <Card className="mb-5">
        <CardBody>
          <Markdown input={page.content} />
        </CardBody>
      </Card>
    </Container>
  );
}
