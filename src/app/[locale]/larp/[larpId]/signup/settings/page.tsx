import { auth } from "@/auth";
import LocalSignupSettingsFormComponent from "@/components/LocalSignupSettingsFormComponent";
import {
  AccessDeniedPage,
  gateActions,
  LoginRequiredPage,
} from "@/components/GatePage";
import LarpSubpage from "@/components/larp-page/LarpSubpage";
import { LocalSignupStatus, RelatedUserVisibility } from "@/prisma/enums";
import { getUserFromSession, isGmOrModerator } from "@/models/User";
import { db } from "@/prisma/db";
import { getTranslations, toSupportedLanguage } from "@/translations";
import { SubmitButton } from "@con2/components";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardBody, FormLabel, FormSelect } from "react-bootstrap";
import Alert from "react-bootstrap/Alert";
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

  const larp = await db.orm.public.Larp.select(
    "id",
    "name",
    "localSignupStatus",
    "localSignupCode",
    "relatedUserVisibility",
  )
    .include("relatedUsers", (r) => r.select("userId", "role"))
    .first({ id: larpId });

  if (!larp) {
    notFound();
  }

  const gate = gateActions(translations);
  if (!user) {
    return (
      <LoginRequiredPage
        messages={translations.LoginRequired}
        actions={[gate.larp(larp.id)]}
      />
    );
  }
  if (!isGmOrModerator(user, larp)) {
    return (
      <AccessDeniedPage
        messages={translations.GmRequired}
        actions={[gate.larp(larp.id), gate.claimLarp(larp.id)]}
      />
    );
  }

  return (
    <LarpSubpage title={t.title} larp={larp}>
      {saved && <Alert variant="success">{t.settingsSaved}</Alert>}
      <Form action={saveLocalSignupSettings.bind(null, locale, larpId)}>
        <Card className="mb-4">
          <CardBody>
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
    </LarpSubpage>
  );
}
