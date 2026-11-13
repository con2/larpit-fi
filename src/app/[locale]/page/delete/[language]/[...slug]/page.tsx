import { SubmitButton } from "@con2/components";
import { AccessDeniedPage, gateActions } from "@/components/GatePage";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardBody, Form } from "react-bootstrap";

import { auth } from "@/auth";
import { pageAdminPath, protectedPageSlugs } from "@/models/Page.client";
import { canManagePages, getUserFromSession } from "@/models/User";
import { db } from "@/prisma/db";
import { getTranslations } from "@/translations";
import { deletePageAction } from "./actions";

interface Props {
  params: Promise<{ locale: string; language: string; slug: string[] }>;
}

export default async function DeletePagePage({ params }: Props) {
  const { locale, language, slug: slugSegments } = await params;
  const slug = slugSegments.join("/");
  const translations = getTranslations(locale);
  const gate = gateActions(translations);
  const t = translations.Page;

  const page = await db.orm.public.Page.select("title").first({
    slug,
    language,
  });
  if (!page) notFound();

  const user = await getUserFromSession(await auth());
  if (!canManagePages(user)) {
    return (
      <AccessDeniedPage
        messages={translations.AdminRequired}
        actions={[gate.page(slug, language), gate.contact]}
      />
    );
  }
  if (protectedPageSlugs.includes(slug)) {
    return (
      <AccessDeniedPage
        messages={{
          eyebrow: t.deleteTitle,
          title: page.title,
          message: t.errors.protected,
        }}
        actions={[gate.page(slug, language)]}
      />
    );
  }

  return (
    <div className="lf-container">
      <header className="lf-page-header mb-4">
        <h1 className="lf-display-l">{t.deleteTitle}</h1>
      </header>
      <Card className="mb-5">
        <CardBody>
          <p>
            <strong>{page.title}</strong>{" "}
            <code>
              {language}/{slug}
            </code>
          </p>
          <p>{t.deleteConfirmation}</p>
          <Form
            action={deletePageAction.bind(null, slug, language)}
            className="d-flex gap-3 align-items-center"
          >
            <SubmitButton className="btn btn-danger">
              {t.actions.delete.title}
            </SubmitButton>
            <Link
              className="lf-link-quiet"
              href={pageAdminPath("edit", slug, language)}
            >
              {t.actions.cancel.title}
            </Link>
          </Form>
        </CardBody>
      </Card>
    </div>
  );
}
