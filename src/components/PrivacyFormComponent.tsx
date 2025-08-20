import { Card, CardBody, CardTitle, FormCheck } from "react-bootstrap";
import { PrivacyPolicyLink } from "./LoginLink";
import type { Translations } from "@/translations/en";

interface Props {
  translations: Translations;
}

export default function PrivacyFormComponent({ translations }: Props) {
  const t = translations.NewLarpPage;

  return (
    <Card className="mb-4">
      <CardBody>
        <CardTitle>{t.sections.privacy.title}</CardTitle>
        <div className="mb-4">
          {t.sections.privacy.message(PrivacyPolicyLink)}
        </div>
        <FormCheck
          type="checkbox"
          id="NewLarpPage-privacy-consent"
          label={<>{t.sections.privacy.consentCheckbox}*</>}
          required
        />
      </CardBody>
    </Card>
  );
}
