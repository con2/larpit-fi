import { EditAction, EditStatus } from "@/prisma/enums";
import { SubmitButton } from "@con2/components";
import { FormattedDateTime } from "@/components/FormattedDates";
import { uuid7ToZonedDateTime } from "@con2/components/helpers";
import { ModerationRequestContent } from "@/models/ModerationRequest";
import { db } from "@/prisma/db";
import { getTranslations } from "@/translations";
import { notFound } from "next/navigation";
import { Card, CardBody, CardTitle, Form } from "react-bootstrap";
import { validate as validateUuid } from "uuid";
import { verifyRequest } from "./actions";
import { typesetDashes } from "@/helpers/larpName";

interface Props {
  params: Promise<{
    locale: string;
    verificationCode: string;
  }>;
}

export default async function VerificationCodePage({ params }: Props) {
  const { locale, verificationCode } = await params;

  const translations = getTranslations(locale);
  const t = translations.VerificationCodePage;

  if (!validateUuid(verificationCode)) {
    console.warn("Invalid UUID", { verificationCode });
    notFound();
  }

  const request = await db.orm.public.ModerationRequest.select(
    "id",
    "action",
    "status",
    "newContent",
  ).first({ verificationCode });

  if (!request) {
    console.warn("Request with this verification code not found", {
      verificationCode,
    });
    notFound();
  }

  if (request.status !== EditStatus.PENDING_VERIFICATION) {
    return (
      <div className="lf-container">
        <header className="lf-page-header">
          <h1 className="lf-display-l">{translations.NewLarpPage.title}</h1>
        </header>
        <div className="py-5" style={{ maxWidth: "48rem" }}>
          <Card>
            <CardBody>
              <CardTitle>{t.errors.notPendingVerification.title}</CardTitle>
              {t.errors.notPendingVerification.message}
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  const newContent = ModerationRequestContent.parse(request.newContent);

  let title: string;
  switch (request.action) {
    case EditAction.CREATE:
      title = translations.NewLarpPage.title;
      break;

    case EditAction.UPDATE:
      title = translations.EditLarpPage.title;
      break;

    case EditAction.CLAIM:
      title = translations.ClaimLarpPage.title;
      break;

    case EditAction.DELETE:
      title = translations.DeleteLarpPage.title;
      break;

    default:
      const exhaustiveCheck: never = request.action;
      throw new Error(`EditAction not implemented: ${exhaustiveCheck}`);
  }

  return (
    <div className="lf-container">
      <header className="lf-page-header">
        <h1 className="lf-display-l">{title}</h1>
      </header>
      <div className="py-5" style={{ maxWidth: "48rem" }}>
        <Card>
          <CardBody>
            <CardTitle>{t.title}</CardTitle>
            {t.message}
            <dl className="mt-3">
              <dt>{translations.ModerationRequest.attributes.name.title}</dt>
              <dd>{typesetDashes(newContent.name)}</dd>
              <dt>
                {translations.ModerationRequest.attributes.createdAt.title}
              </dt>
              <dd>
                <FormattedDateTime
                  value={uuid7ToZonedDateTime(request.id)}
                  locale={locale}
                />
              </dd>
            </dl>
            <Form action={verifyRequest.bind(null, locale, verificationCode)}>
              <SubmitButton className="d-block btn btn-primary btn-lg w-100 mt-4">
                {t.actions.verify}
              </SubmitButton>
            </Form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
