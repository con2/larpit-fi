import { MarkdownEditor, SubmitButton } from "@con2/components";
import { MessageCard } from "@/components/MessageCard";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Alert,
  Card,
  CardBody,
  Form,
  FormControl,
  FormLabel,
  FormText,
} from "react-bootstrap";

import { auth } from "@/auth";
import { headerImagesEnabled } from "@/config";
import {
  frontPageSlug,
  pageAdminPath,
  type PageSlugError,
  protectedPageSlugs,
} from "@/models/Page.client";
import {
  canEditPages,
  canManagePages,
  getUserFromSession,
} from "@/models/User";
import { db } from "@/prisma/db";
import { getTranslations } from "@/translations";
import { changePageSlug, putPage } from "./actions";

interface Props {
  params: Promise<{ locale: string; language: string; slug: string[] }>;
  searchParams: Promise<{ error?: string }>;
}

export default async function EditPagePage({ params, searchParams }: Props) {
  const { locale, language, slug: slugSegments } = await params;
  const slug = slugSegments.join("/");
  const { error } = await searchParams;
  const translations = getTranslations(locale);
  const t = translations.Page;

  const page = await db.orm.public.Page.first({ slug, language });
  if (!page) {
    notFound();
  }

  const user = await getUserFromSession(await auth());
  if (!canEditPages(user)) {
    return (
      <MessageCard
        title={translations.ModeratorRequired.title}
        message={translations.ModeratorRequired.message}
        container
      />
    );
  }

  const isFrontPage = slug === frontPageSlug;
  const canRenameOrDelete =
    canManagePages(user) && !protectedPageSlugs.includes(slug);
  const errorMessage =
    error && error in t.errors ? t.errors[error as PageSlugError] : null;

  return (
    <div className="lf-container">
      <header className="lf-page-header mb-4">
        <h1 className="lf-display-l">{t.editTitle}</h1>
        <p className="m-0 d-flex gap-3">
          {headerImagesEnabled && (
            <Link
              className="lf-link-quiet"
              href={pageAdminPath("header-image", slug, language)}
            >
              {t.actions.headerImage.title} →
            </Link>
          )}
          {canRenameOrDelete && (
            <Link
              className="lf-link-quiet"
              href={pageAdminPath("delete", slug, language)}
            >
              {t.actions.delete.title} →
            </Link>
          )}
        </p>
      </header>
      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
      <Card className="mb-4">
        <CardBody>
          {canRenameOrDelete ? (
            <Form action={changePageSlug.bind(null, slug, language)}>
              <FormLabel htmlFor="PageEditorComponent-slug">
                {t.attributes.slug.title}
              </FormLabel>
              <div className="d-flex gap-2">
                <FormControl
                  type="text"
                  id="PageEditorComponent-slug"
                  name="slug"
                  defaultValue={slug}
                  required
                />
                <SubmitButton className="btn btn-outline-primary text-nowrap">
                  {t.actions.rename.title}
                </SubmitButton>
              </div>
              <FormText>{t.attributes.slug.helpText}</FormText>
              <div className="mt-3">
                <FormLabel>{t.attributes.language.title}</FormLabel>
                <div>
                  <code>{language}</code>
                </div>
              </div>
            </Form>
          ) : (
            <div className="row">
              <div className="form-group col-md-6">
                <FormLabel>{t.attributes.slug.title}</FormLabel>
                <div>
                  <code>{slug}</code>
                </div>
              </div>
              <div className="form-group col-md-6">
                <FormLabel>{t.attributes.language.title}</FormLabel>
                <div>
                  <code>{language}</code>
                </div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
      <Card className="mb-5">
        <CardBody>
          <Form action={putPage.bind(null, slug, language)}>
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
              <FormLabel htmlFor="PageEditorComponent-ingress">
                {t.attributes.ingress.title}
              </FormLabel>
              <MarkdownEditor
                id="PageEditorComponent-ingress"
                name="ingress"
                rows={5}
                defaultValue={page.ingress}
                locale={locale}
              />
              <FormText>
                {isFrontPage
                  ? t.attributes.ingress.frontPageHelpText
                  : t.attributes.ingress.helpText}
              </FormText>
            </div>

            {!isFrontPage && (
              <>
                <div className="form-group mb-3">
                  <FormLabel htmlFor="PageEditorComponent-content">
                    {t.attributes.content.title}
                  </FormLabel>
                  <MarkdownEditor
                    id="PageEditorComponent-content"
                    name="content"
                    rows={20}
                    defaultValue={page.content}
                    locale={locale}
                  />
                  <FormText>{t.attributes.content.helpText}</FormText>
                </div>

                <div className="form-group mb-3">
                  <FormLabel htmlFor="PageEditorComponent-menuPosition">
                    {t.attributes.menuPosition.title}
                  </FormLabel>
                  <FormControl
                    type="number"
                    step={1}
                    id="PageEditorComponent-menuPosition"
                    name="menuPosition"
                    defaultValue={page.menuPosition ?? ""}
                    style={{ maxWidth: "10rem" }}
                  />
                  <FormText>{t.attributes.menuPosition.helpText}</FormText>
                </div>
              </>
            )}

            <SubmitButton className="btn btn-primary mt-3">
              {t.actions.submit.title}
            </SubmitButton>
          </Form>
        </CardBody>
      </Card>
    </div>
  );
}
