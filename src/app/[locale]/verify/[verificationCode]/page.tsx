import FormattedDateTime from "@/components/FormattedDateTime";
import MainHeading from "@/components/MainHeading";
import SubmitButton from "@/components/SubmitButton";
import { EditAction, EditStatus } from "@/generated/prisma/client";
import { uuid7ToZonedDateTime } from "@/helpers/temporal";
import { ModerationRequestContent } from "@/models/ModerationRequest";
import prisma from "@/prisma";
import { getTranslations } from "@/translations";
import { notFound } from "next/navigation";
import { Card, CardBody, CardTitle, Form } from "react-bootstrap";
import Container from "react-bootstrap/Container";
import { validate as validateUuid } from "uuid";
import { verifyRequest } from "./actions";

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

  const request = await prisma.moderationRequest.findUnique({
    where: {
      verificationCode,
    },
    select: {
      id: true,
      action: true,
      status: true,
      newContent: true,
    },
  });

  if (!request) {
    console.warn("Request with this verification code not found", {
      verificationCode,
    });
    notFound();
  }

  if (request.status !== EditStatus.PENDING_VERIFICATION) {
    <Container>
      <MainHeading>{translations.NewLarpPage.title}</MainHeading>
      <Card>
        <CardBody>
          <CardTitle>{t.errors.notPendingVerification.title}</CardTitle>
          {t.errors.notPendingVerification.message}
        </CardBody>
      </Card>
    </Container>;
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

    default:
      const exhaustiveCheck: never = request.action;
      throw new Error(`EditAction not implemented: ${exhaustiveCheck}`);
  }

  return (
    <Container>
      <MainHeading>{title}</MainHeading>
      <Card>
        <CardBody>
          <CardTitle>{t.title}</CardTitle>
          {t.message}
          <dl className="mt-3">
            <dt>{translations.ModerationRequest.attributes.name.title}</dt>
            <dd>{newContent.name}</dd>
            <dt>{translations.ModerationRequest.attributes.createdAt.title}</dt>
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
    </Container>
  );
}
