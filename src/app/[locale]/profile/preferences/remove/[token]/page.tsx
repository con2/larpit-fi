import { auth } from "@/auth";
import { LoginRequiredPage, gateActions } from "@/components/GatePage";
import { findAccountRemovalToken, getUserFromSession } from "@/models/User";
import { getTranslations } from "@/translations";
import { SubmitButton } from "@con2/components";
import { Card, CardBody, CardText, CardTitle, Form } from "react-bootstrap";
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

  const gate = gateActions(translations);
  const t = translations.AccountRemovalPage;

  const session = await auth();
  const user = await getUserFromSession(session);
  if (!user) {
    return (
      <LoginRequiredPage
        messages={translations.LoginRequired}
        actions={[gate.frontPage]}
      />
    );
  }

  const verificationToken = await findAccountRemovalToken(user.id, token);

  return (
    <div className="lf-container">
      <header className="lf-page-header">
        <h1 className="lf-display-l">{t.title}</h1>
      </header>
      <div className="py-5" style={{ maxWidth: "48rem" }}>
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
                    {t.confirm.submit}…
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
      </div>
    </div>
  );
}
