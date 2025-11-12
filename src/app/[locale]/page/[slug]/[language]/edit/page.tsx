import { auth } from "@/auth";
import InsufficientPrivileges from "@/components/InsufficientPrivileges";
import MainHeading from "@/components/MainHeading";
import Markdown from "@/components/Markdown";
import SubmitButton from "@/components/SubmitButton";
import { canEditPages } from "@/models/User";
import prisma from "@/prisma";
import { getTranslations } from "@/translations";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Card,
  CardBody,
  Container,
  Form,
  FormControl,
  FormLabel,
} from "react-bootstrap";
import { putPage } from "./actions";

interface Props {
  params: Promise<{ locale: string; slug: string; language: string }>;
}

export default async function PageWithLanguagePage({ params }: Props) {
  const { locale, language, slug } = await params;
  const translations = getTranslations(locale);
  const t = translations.Page;

  const page = await prisma.page.findUnique({
    where: { slug_language: { slug, language } },
  });
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

  if (!canEditPages(user)) {
    return <InsufficientPrivileges messages={translations.AdminRequired} />;
  }

  return (
    <Container>
      <MainHeading>{t.editTitle}</MainHeading>
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
                defaultValue={page?.title || ""}
                required
              />
            </div>

            <div className="form-group mb-3">
              <FormLabel htmlFor="PageEditorComponent-content">
                {t.attributes.content.title}
              </FormLabel>
              <FormControl
                id="PageEditorComponent-content"
                name="content"
                as={"textarea"}
                rows={15}
                defaultValue={page?.content || ""}
                style={{ fontFamily: "monospace", fontSize: "0.85em" }}
              />
            </div>

            <SubmitButton className="btn btn-primary mt-3">
              {t.actions.submit.title}
            </SubmitButton>
          </Form>
        </CardBody>
      </Card>
    </Container>
  );
}
