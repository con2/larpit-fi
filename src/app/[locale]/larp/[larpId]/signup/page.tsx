import { auth } from "@/auth";
import { LoginRequiredCard } from "@/components/LoginRequiredCard";
import MainHeading from "@/components/MainHeading";
import {
  RelatedUserRole,
  RelatedUserVisibility,
} from "@/generated/prisma/client";
import { getLocalSignupStatusForUser, getUserFromSession } from "@/models/User";
import prisma from "@/prisma";
import { getTranslations, toSupportedLanguage } from "@/translations";
import { SubmitButton } from "@con2/components";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CardText, CardTitle } from "react-bootstrap";
import Card from "react-bootstrap/Card";
import CardBody from "react-bootstrap/CardBody";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import { validate as validateUuid } from "uuid";
import { submitSignup } from "./actions";

interface Props {
  params: Promise<{ locale: string; larpId: string }>;
  searchParams: Promise<{ code?: string; emailSent?: string }>;
}

const localSignupStatusRoles = [
  RelatedUserRole.LOCAL_SIGNUP_YES,
  RelatedUserRole.LOCAL_SIGNUP_MAYBE,
  RelatedUserRole.LOCAL_SIGNUP_NO,
] as const;

const visibilityOptions = [
  RelatedUserVisibility.PARTICIPANTS,
  RelatedUserVisibility.GM,
] as const;

export default async function SignupPage({ params, searchParams }: Props) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const locale = toSupportedLanguage(resolvedParams.locale);
  const { larpId } = resolvedParams;

  if (!validateUuid(larpId)) {
    notFound();
  }

  const translations = getTranslations(locale);
  const t = translations.LocalSignupPage;
  const signupStatusChoices = t.attributes.signupStatus.choices;
  const visibilityChoices = t.attributes.visibility.choices;

  const session = await auth();
  const user = await getUserFromSession(session);

  if (!user) {
    return (
      <LoginRequiredCard messages={translations.LoginRequired} container />
    );
  }

  const larp = await prisma.larp.findUnique({
    where: { id: larpId },
    select: {
      id: true,
      name: true,
      cancelledAt: true,
      localSignupStatus: true,
      localSignupCode: true,
      relatedUsers: user
        ? { where: { userId: user.id }, select: { userId: true, role: true } }
        : { select: { userId: true, role: true }, take: 0 },
    },
  });

  if (!larp) {
    notFound();
  }

  const codeParam = resolvedSearchParams.code ?? null;
  const _emailSent = !!resolvedSearchParams.emailSent;
  const signupStatus = getLocalSignupStatusForUser(user, larp, codeParam);

  switch (signupStatus) {
    case "CAN_SIGN_UP":
    case "LOCAL_SIGNUP_YES":
    case "LOCAL_SIGNUP_MAYBE":
    case "LOCAL_SIGNUP_NO":
      break;

    case "CANCELLED":
    case "DISABLED":
    case "CODE_REQUIRED":
    default:
      redirect(`/larp/${larpId}?error=signupUnavailable`);
  }

  // find instead of .includes to appease typechecker :)
  // set if already signed up, undefined if not signed up
  const currentRole = localSignupStatusRoles.find((role) =>
    larp.relatedUsers.some((r) => r.role === role),
  );

  const codeField = codeParam ? (
    <input type="hidden" name="code" value={codeParam} />
  ) : null;

  const statusRadios = (defaultStatus?: RelatedUserRole) =>
    localSignupStatusRoles.map((role) => (
      <Form.Check
        key={role}
        type="radio"
        id={`signup-status-${role}`}
        name="signupStatus"
        value={role}
        label={signupStatusChoices[role].label}
        defaultChecked={defaultStatus === role}
        required
      />
    ));

  const visibilityRadios = (defaultVisibility?: RelatedUserVisibility) =>
    visibilityOptions.map((vis) => (
      <Form.Check
        key={vis}
        type="radio"
        id={`signup-visibility-${vis}`}
        name="visibility"
        value={vis}
        label={visibilityChoices[vis].label}
        defaultChecked={
          defaultVisibility
            ? defaultVisibility === vis
            : vis === RelatedUserVisibility.PARTICIPANTS
        }
        required
      />
    ));

  const statusMessage = t.userSignupStatus.choices[signupStatus];

  return (
    <Container>
      <MainHeading>{larp.name}</MainHeading>
      <Card className="mb-4">
        <CardBody>
          <CardTitle>{t.title}</CardTitle>
          {statusMessage && (
            <CardText className="mb-3">{statusMessage}</CardText>
          )}
          <Form
            action={submitSignup.bind(null, locale, larpId)}
            className="mb-3"
          >
            {codeField}
            <div className="mb-3">
              <Form.Label>{t.attributes.signupStatus.label}</Form.Label>
              {statusRadios(currentRole)}
            </div>
            <div className="mb-3">
              <Form.Label>{t.attributes.visibility.label}</Form.Label>
              {visibilityRadios()}
              <Form.Text>{t.attributes.visibility.helpText}</Form.Text>
            </div>
            <SubmitButton>{t.actions.submit}</SubmitButton>
            {signupStatus !== "CAN_SIGN_UP" && (
              <SubmitButton
                variant="outline-danger"
                confirmationMessage={
                  translations.RolesPage.actions.confirmRemoveSignup
                }
                name="action"
                value="remove"
                className="ms-2"
              >
                {t.actions.remove}
              </SubmitButton>
            )}
            <Link
              href={`/larp/${larp.id}`}
              className="btn btn-outline-secondary ms-2"
            >
              {translations.Common.actions.returnToLarpPage.title}
            </Link>
          </Form>
        </CardBody>
      </Card>
    </Container>
  );
}
