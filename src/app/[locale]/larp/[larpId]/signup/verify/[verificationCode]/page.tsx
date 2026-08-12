import MainHeading from "@/components/MainHeading";
import { SubmitButton } from "@con2/components";
import prisma from "@/prisma";
import { getTranslations, toSupportedLanguage } from "@/translations";
import { notFound } from "next/navigation";
import Alert from "react-bootstrap/Alert";
import Card from "react-bootstrap/Card";
import CardBody from "react-bootstrap/CardBody";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import { validate as validateUuid } from "uuid";
import { verifySignup } from "./actions";

interface Props {
  params: Promise<{
    locale: string;
    larpId: string;
    verificationCode: string;
  }>;
}

export default async function VerifySignupPage({ params }: Props) {
  const resolvedParams = await params;
  const locale = toSupportedLanguage(resolvedParams.locale);
  const { larpId, verificationCode } = resolvedParams;

  if (!validateUuid(larpId)) {
    notFound();
  }

  const translations = getTranslations(locale);
  const t = translations.LocalSignupPage.verifyPage;
  const signupStatusChoices =
    translations.LocalSignupPage.attributes.signupStatus.choices;

  const signup = await prisma.unauthenticatedSignup.findUnique({
    where: { verificationCode },
    select: {
      larpId: true,
      displayName: true,
      email: true,
      signupStatus: true,
      verifiedAt: true,
      larp: { select: { name: true } },
    },
  });

  if (!signup || signup.larpId !== larpId) {
    notFound();
  }

  return (
    <Container>
      <MainHeading>{t.title}</MainHeading>
      <p className="mb-4">
        <strong>{signup.larp.name}</strong>
      </p>

      {signup.verifiedAt ? (
        <Alert variant="success">{t.alreadyVerified}</Alert>
      ) : (
        <Card className="mb-4">
          <CardBody>
            <p>{t.message}</p>
            <dl>
              <dt>
                {translations.LocalSignupPage.attributes.displayName.label}
              </dt>
              <dd>{signup.displayName}</dd>
              <dt>{translations.LocalSignupPage.attributes.email.label}</dt>
              <dd>{signup.email}</dd>
              <dt>
                {translations.LocalSignupPage.attributes.signupStatus.label}
              </dt>
              <dd>
                {
                  signupStatusChoices[
                    signup.signupStatus as
                      | "LOCAL_SIGNUP_YES"
                      | "LOCAL_SIGNUP_MAYBE"
                      | "LOCAL_SIGNUP_NO"
                  ].title
                }
              </dd>
            </dl>
            <Form
              action={verifySignup.bind(null, locale, larpId, verificationCode)}
            >
              <SubmitButton>{t.actions.verify}</SubmitButton>
            </Form>
          </CardBody>
        </Card>
      )}
    </Container>
  );
}
