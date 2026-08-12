import { auth } from "@/auth";
import LocalSignupSettingsFormComponent from "@/components/LocalSignupSettingsFormComponent";
import { LoginRequiredCard } from "@/components/LoginRequiredCard";
import MainHeading from "@/components/MainHeading";
import {
  LocalSignupStatus,
  RelatedUserVisibility,
} from "@/generated/prisma/client";
import { getUserFromSession, isGmOrModerator } from "@/models/User";
import prisma from "@/prisma";
import { getTranslations, toSupportedLanguage } from "@/translations";
import { SubmitButton } from "@con2/components";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Card,
  CardBody,
  CardTitle,
  FormLabel,
  FormSelect,
} from "react-bootstrap";
import Alert from "react-bootstrap/Alert";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import { validate as validateUuid } from "uuid";
import { saveLocalSignupSettings } from "./actions";

interface Props {
  params: Promise<{ locale: string; larpId: string }>;
  searchParams: Promise<{ saved?: string }>;
}

export default async function SignupSettingsPage({
  params,
  searchParams,
}: Props) {
  const resolvedParams = await params;
  const locale = toSupportedLanguage(resolvedParams.locale);
  const { larpId } = resolvedParams;
  const { saved } = await searchParams;

  if (!validateUuid(larpId)) {
    notFound();
  }

  const translations = getTranslations(locale);
  const t = translations.LocalSignupSettings;

  const session = await auth();
  const user = await getUserFromSession(session);

  const larp = await prisma.larp.findUnique({
    where: { id: larpId },
    select: {
      id: true,
      name: true,
      localSignupStatus: true,
      localSignupCode: true,
      relatedUserVisibility: true,
      relatedUsers: { select: { userId: true, role: true } },
    },
  });

  if (!larp) {
    notFound();
  }

  if (!isGmOrModerator(user, larp)) {
    return (
      <Container>
        <LoginRequiredCard messages={translations.LoginRequired} />
      </Container>
    );
  }

  return (
    <Container>
      <MainHeading>{larp.name}</MainHeading>
      {saved && <Alert variant="success">{t.settingsSaved}</Alert>}
      <Form action={saveLocalSignupSettings.bind(null, locale, larpId)}>
        <Card className="mb-4">
          <CardBody>
            <CardTitle>{t.title}</CardTitle>
            <div className="mb-4">{t.message}</div>

            <LocalSignupSettingsFormComponent
              attributes={t.attributes}
              defaultStatus={
                larp?.localSignupStatus ?? LocalSignupStatus.DISABLED
              }
              defaultCode={larp?.localSignupCode ?? ""}
            />

            <div className="form-group mb-3">
              <FormLabel htmlFor="LarpLocalSignupFormComponent-relatedUserVisibility">
                {t.attributes.relatedUserVisibility.label}
              </FormLabel>
              <FormSelect
                id="LarpLocalSignupFormComponent-relatedUserVisibility"
                name="relatedUserVisibility"
                defaultValue={
                  larp?.relatedUserVisibility ?? RelatedUserVisibility.GM
                }
              >
                {Object.entries(t.attributes.relatedUserVisibility.choices).map(
                  ([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ),
                )}
              </FormSelect>
            </div>

            <SubmitButton>{t.actions.save}</SubmitButton>
            <Link
              href={`/larp/${larp.id}`}
              className="btn btn-outline-secondary ms-2"
            >
              {translations.Common.actions.returnToLarpPage.title}
            </Link>
          </CardBody>
        </Card>
      </Form>
    </Container>
  );
}
