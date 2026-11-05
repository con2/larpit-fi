import { FormControl, FormLabel, FormText } from "react-bootstrap";
import type { Translations } from "@/translations/en";
import { SubmitButton } from "@con2/components";
import { RequiredMark } from "./FormSection";
import RequiredFieldsSummary from "./RequiredFieldsSummary";
import styles from "./LarpForm.module.scss";

interface Props {
  user: { email: string } | null;
  translations: Translations;
  compact?: boolean;
}

export default function YoureAlmostReadyFormComponent({
  user,
  translations,
  compact,
}: Props) {
  const t = translations.NewLarpPage;
  const requesT = translations.ModerationRequest;

  return (
    <section
      id="submit"
      className={`lf-surface ${styles.submitCard}`}
      aria-labelledby={compact ? undefined : "submit-heading"}
    >
      {!compact && (
        <>
          <h2 className="lf-surface__title" id="submit-heading">
            {t.sections.submit.title}
          </h2>
          <div className={styles.intro}>
            {t.sections.submit.message}
            {user ? null : t.sections.submit.notLoggedIn}
          </div>
        </>
      )}

      <div className={styles.field}>
        <FormLabel htmlFor="YoureAlmostReadyFormComponent-submit-message">
          {requesT.attributes.message.label}
        </FormLabel>
        <FormControl
          as="textarea"
          id="YoureAlmostReadyFormComponent-submit-message"
          name="message"
          rows={compact ? 3 : 5}
        />
        {!compact && <FormText>{requesT.attributes.message.helpText}</FormText>}
      </div>

      {user ? null : (
        <div className={styles.field}>
          <FormLabel htmlFor="YoureAlmostReadyFormComponent-submit-cat">
            {t.sections.submit.attributes.cat.label}
            <RequiredMark />
          </FormLabel>
          <FormControl
            id="YoureAlmostReadyFormComponent-submit-cat"
            name="cat"
            required
          />
          <FormText>{t.sections.submit.attributes.cat.helpText}</FormText>
        </div>
      )}

      <div className={styles.submitRow}>
        <SubmitButton className="btn-lg">{t.actions.submit}</SubmitButton>
        <RequiredFieldsSummary messages={t.requiredSummary} />
      </div>
    </section>
  );
}
