import { auth } from "@/auth";
import { headerImagesEnabled } from "@/config";
import { canEditPages, getUserFromSession } from "@/models/User";
import { db } from "@/prisma/db";
import { getTranslations } from "@/translations";
import { MarkdownEditor, MessageCard, SubmitButton } from "@con2/components";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardBody, Form, FormControl, FormLabel } from "react-bootstrap";
import { putPage } from "./actions";

interface Props {
  params: Promise<{ locale: string; slug: string; language: string }>;
}

export default async function PageWithLanguagePage({ params }: Props) {
  const { locale, language, slug } = await params;
  const translations = getTranslations(locale);
  const t = translations.Page;

  const page = await db.orm.public.Page.first({ slug, language });
  if (!page) {
    notFound();
  }

  const session = await auth();
  const user = await getUserFromSession(session);

  if (!canEditPages(user)) {
    return (
      <MessageCard
        title={translations.AdminRequired.title}
        message={translations.AdminRequired.message}
        container
      />
    );
  }

  return (
    <div className="lf-container">
      <header className="lf-page-header mb-4">
        <h1 className="lf-display-l">{t.editTitle}</h1>
        {headerImagesEnabled && (
          <p className="m-0">
            <Link
              className="lf-link-quiet"
              href={`/page/${slug}/${language}/header-image`}
            >
              {t.actions.headerImage.title} →
            </Link>
          </p>
        )}
      </header>
      <Card className="mb-5">
        <CardBody>
          <Form action={putPage.bind(null, locale, slug, language)}>
            <div className="row mb-3">
              <div className="form-group col-md-6">
                <FormLabel>{t.attributes.slug.title}</FormLabel>
                <div>
                  <code>{page.slug}</code>
                </div>
              </div>
              <div className="form-group col-md-6">
                <FormLabel>{t.attributes.language.title}</FormLabel>
                <div>
                  <code>{page.language}</code>
                </div>
              </div>
            </div>
            <div className="form-group mb-3">
              <FormLabel htmlFor="PageEditorComponent-title">
                {t.attributes.title.title}*
              </FormLabel>
              <FormControl
                type="text"
                id="PageEditorComponent-title"
                name="title"
                defaultValue={page.title}
                required
              />
            </div>

            <div className="form-group mb-3">
              <FormLabel htmlFor="PageEditorComponent-content">
                {t.attributes.content.title}
              </FormLabel>
              <MarkdownEditor
                id="PageEditorComponent-content"
                name="content"
                rows={15}
                defaultValue={page.content}
                locale={locale}
              />
            </div>

            <SubmitButton className="btn btn-primary mt-3">
              {t.actions.submit.title}
            </SubmitButton>
          </Form>
        </CardBody>
      </Card>
    </div>
  );
}
