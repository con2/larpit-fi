import { SubmitButton } from "@con2/components";
import { MessageCard } from "@/components/MessageCard";
import {
  Alert,
  Card,
  CardBody,
  Form,
  FormControl,
  FormLabel,
  FormSelect,
  FormText,
} from "react-bootstrap";

import { auth } from "@/auth";
import { supportedLanguages, toSupportedLanguage } from "@/i18n/locales";
import type { PageSlugError } from "@/models/Page.client";
import { canManagePages, getUserFromSession } from "@/models/User";
import { getTranslations } from "@/translations";
import { createPageAction } from "./actions";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    error?: string;
    slug?: string;
    language?: string;
    title?: string;
    menuPosition?: string;
  }>;
}

/** Creates the page with a title only; the ingress and content are written on the edit page. */
export default async function NewPagePage({ params, searchParams }: Props) {
  const { locale } = await params;
  const previous = await searchParams;
  const translations = getTranslations(locale);
  const t = translations.Page;

  const user = await getUserFromSession(await auth());
  if (!canManagePages(user)) {
    return (
      <MessageCard
        title={translations.AdminRequired.title}
        message={translations.AdminRequired.message}
        container
      />
    );
  }

  const errorMessage =
    previous.error && previous.error in t.errors
      ? t.errors[previous.error as PageSlugError]
      : null;

  return (
    <div className="lf-container">
      <header className="lf-page-header mb-4">
        <h1 className="lf-display-l">{t.newTitle}</h1>
      </header>
      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
      <Card className="mb-5">
        <CardBody>
          <Form action={createPageAction}>
            <div className="row mb-3">
              <div className="form-group col-md-8">
                <FormLabel htmlFor="NewPage-slug">
                  {t.attributes.slug.title}*
                </FormLabel>
                <FormControl
                  type="text"
                  id="NewPage-slug"
                  name="slug"
                  defaultValue={previous.slug}
                  required
                />
                <FormText>{t.attributes.slug.helpText}</FormText>
              </div>
              <div className="form-group col-md-4">
                <FormLabel htmlFor="NewPage-language">
                  {t.attributes.language.title}*
                </FormLabel>
                <FormSelect
                  id="NewPage-language"
                  name="language"
                  defaultValue={toSupportedLanguage(
                    previous.language ?? locale,
                  )}
                >
                  {supportedLanguages.map((language) => (
                    <option key={language} value={language}>
                      {language}
                    </option>
                  ))}
                </FormSelect>
              </div>
            </div>
            <div className="form-group mb-3">
              <FormLabel htmlFor="NewPage-title">
                {t.attributes.title.title}*
              </FormLabel>
              <FormControl
                type="text"
                id="NewPage-title"
                name="title"
                defaultValue={previous.title}
                required
              />
            </div>
            <div className="form-group mb-3">
              <FormLabel htmlFor="NewPage-menuPosition">
                {t.attributes.menuPosition.title}
              </FormLabel>
              <FormControl
                type="number"
                step={1}
                id="NewPage-menuPosition"
                name="menuPosition"
                defaultValue={previous.menuPosition}
                style={{ maxWidth: "10rem" }}
              />
              <FormText>{t.attributes.menuPosition.helpText}</FormText>
            </div>
            <SubmitButton className="btn btn-primary mt-3">
              {t.actions.create.title}
            </SubmitButton>
          </Form>
        </CardBody>
      </Card>
    </div>
  );
}
