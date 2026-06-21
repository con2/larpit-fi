import { auth } from "@/auth";
import LoginRequired from "@/components/LoginRequired";
import MainHeading from "@/components/MainHeading";
import SubmitButton from "@/components/SubmitButton";
import { findAccountRemovalToken, getUserFromSession } from "@/models/User";
import { getTranslations } from "@/translations";
import { Card, CardBody, CardText, CardTitle, Container, Form } from "react-bootstrap";
import { confirmAccountRemoval } from "./actions";

interface Props {
  params: Promise<{
    locale: string;
    token: string;
  }>;
}

export default async function ConfirmAccountRemovalPage({ params }: Props) {
  const { locale, token } = await params;

  const translations = getTranslations(locale);
  const t = translations.AccountRemovalPage;

  const session = await auth();
  const user = await getUserFromSession(session);
  if (!user) {
    return (
      <Container>
        <LoginRequired messages={translations.LoginRequired} />
      </Container>
    );
  }

  const verificationToken = await findAccountRemovalToken(user.id, token);

  return (
    <Container>
      <MainHeading>{t.title}</MainHeading>
      <Card>
        <CardBody>
          {verificationToken ? (
            <>
              <CardTitle>{t.confirm.title}</CardTitle>
              <CardText>{t.confirm.message}</CardText>
              <Form action={confirmAccountRemoval.bind(null, locale, token)}>
                <SubmitButton
                  variant="danger"
                  className="d-block btn btn-danger btn-lg w-100 mt-3"
                  confirmationMessage={t.confirm.confirmationMessage}
                >
                  {t.confirm.submit}
                </SubmitButton>
              </Form>
            </>
          ) : (
            <>
              <CardTitle>{t.invalidToken.title}</CardTitle>
              <CardText>{t.invalidToken.message}</CardText>
            </>
          )}
        </CardBody>
      </Card>
    </Container>
  );
}
