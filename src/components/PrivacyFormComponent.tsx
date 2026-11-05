import { FormCheck } from "react-bootstrap";
import { PrivacyPolicyLink } from "./ExternalLinks";
import { RequiredMark } from "./FormSection";
import type { Translations } from "@/translations/en";
import styles from "./LarpForm.module.scss";

interface Props {
  translations: Translations;
}

export default function PrivacyFormComponent({ translations }: Props) {
  const t = translations.NewLarpPage.sections.privacy;

  return (
    <div className={styles.subsection}>
      <div className={styles.intro}>
        <h3 className="lf-label mb-2">{t.title}</h3>
        {t.message(PrivacyPolicyLink)}
      </div>
      <FormCheck
        type="checkbox"
        id="NewLarpPage-privacy-consent"
        className={styles.check}
        data-required-label={t.consentShort}
        label={
          <>
            {t.consentCheckbox}
            <RequiredMark />
          </>
        }
        required
      />
    </div>
  );
}
