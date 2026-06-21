import { auth } from "@/auth";
import MainHeading from "@/components/MainHeading";
import SubmitButton from "@/components/SubmitButton";
import { displayNameMaxLength } from "@/models/User";
import prisma from "@/prisma";
import { getTranslations } from "@/translations";
import {
  Alert,
  Card,
  CardBody,
  CardText,
  CardTitle,
  Container,
  Form,
  FormControl,
  FormLabel,
  FormSelect,
  FormText,
} from "react-bootstrap";
import LoginRequired from "@/components/LoginRequired";
import {
  logOutAllSessions,
  requestAccountRemoval,
  saveUserPreferences,
} from "./actions";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ accountRemovalRequested?: string }>;
}

export default async function PreferencesPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { accountRemovalRequested } = await searchParams;
  const translations = getTranslations(locale);
  const t = translations.Preferences;

  const session = await auth();
  const user = session?.user?.email
    ? await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, name: true, email: true, editFormPreference: true },
      })
    : null;
  if (!user) {
    return (
      <Container>
        <LoginRequired messages={translations.LoginRequired} />
      </Container>
    );
  }

  return (
    <Container>
      <MainHeading>{t.title}</MainHeading>

      {accountRemovalRequested ? (
        <Alert variant="info">{t.accountRemoval.emailSent}</Alert>
      ) : null}

      <Card className="mb-4">
        <CardBody>
          <Form action={saveUserPreferences.bind(null, locale)}>
            <div className="form-group mb-3">
              <FormLabel htmlFor="Preferences-name">
                {t.attributes.name.label}
              </FormLabel>
              <FormControl
                type="text"
                id="Preferences-name"
                name="name"
                defaultValue={user.name ?? ""}
                required
                maxLength={displayNameMaxLength}
              />
              <FormText>{t.attributes.name.helpText}</FormText>
            </div>

            <div className="form-group mb-3">
              <FormLabel htmlFor="Preferences-editFormPreference">
                {t.attributes.editFormPreference.label}
              </FormLabel>
              <FormSelect
                id="Preferences-editFormPreference"
                name="editFormPreference"
                defaultValue={user.editFormPreference}
              >
                {Object.entries(t.attributes.editFormPreference.choices).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
              </FormSelect>
              <FormText>{t.attributes.editFormPreference.helpText}</FormText>
            </div>

            {/* TODO(#9): Update email from Kompassi on login. Help text for email field is inaccurate: in fact, Larpit.fi account is still tied to the same Kompassi account via numeric Kompassi user ID, but the email shown here is not updated. */}
            {false && (
              <div className="form-group mb-3">
                <FormLabel htmlFor="Preferences-email">
                  {t.attributes.email.label} 🔒
                </FormLabel>
                <FormControl
                  type="email"
                  id="Preferences-email"
                  defaultValue={user!.email}
                  readOnly
                />
                <FormText>{t.attributes.email.helpText}</FormText>
              </div>
            )}

            <div className="d-flex">
              <SubmitButton className="btn btn-primary">{t.save}</SubmitButton>
            </div>
          </Form>
        </CardBody>
      </Card>

      <Card className="mb-4 border-danger">
        <CardBody>
          <CardTitle className="text-danger mb-3">
            {t.dangerZone.title}
          </CardTitle>

          <div className="mb-4">
            <CardTitle>{t.logOutAllSessions.title}</CardTitle>
            <CardText>{t.logOutAllSessions.description}</CardText>
            <Form action={logOutAllSessions.bind(null, locale)}>
              <SubmitButton
                variant="outline-danger"
                className="btn btn-outline-danger"
                confirmationMessage={t.logOutAllSessions.confirmationMessage}
              >
                {t.logOutAllSessions.title}
              </SubmitButton>
            </Form>
          </div>

          <div>
            <CardTitle>{t.accountRemoval.title}</CardTitle>
            <CardText>{t.accountRemoval.description}</CardText>
            <Form action={requestAccountRemoval.bind(null, locale)}>
              <SubmitButton
                variant="danger"
                className="btn btn-danger"
                confirmationMessage={t.accountRemoval.confirmationMessage}
              >
                {t.accountRemoval.title}…
              </SubmitButton>
            </Form>
          </div>
        </CardBody>
      </Card>
    </Container>
  );
}
