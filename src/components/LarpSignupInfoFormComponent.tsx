import type { Larp } from "@/prisma/models";
import { toPlainDate } from "@con2/components/helpers";
import type { Translations } from "@/translations/en";
import { Temporal } from "@js-temporal/polyfill";
import { FormControl, FormLabel, FormText } from "react-bootstrap";
import { FormSection, RadioGroup } from "./FormSection";
import styles from "./LarpForm.module.scss";

interface Props {
  translations: Translations;
  locale: string;
  larp: Pick<
    Larp,
    | "openness"
    | "signupStartsAt"
    | "signupEndsAt"
    | "numPlayerCharacters"
    | "numTotalParticipants"
  > | null;
  readOnly?: boolean;
  compact?: boolean;
}

function toISODateEmpty(
  date:
    | Temporal.ZonedDateTime
    | Temporal.Instant
    | Temporal.PlainDate
    | Date
    | string
    | null
    | undefined,
): string {
  if (!date) return "";
  return toPlainDate(date).toString();
}

export function LarpSignupInfoFormComponent({
  translations,
  larp,
  readOnly,
  compact,
}: Props) {
  const newT = translations.NewLarpPage;
  const secTion = newT.sections.signup;
  const t = translations.Larp;

  const showHelpText = !compact;

  return (
    <FormSection
      id="signup"
      title={secTion.title}
      intro={secTion.message}
      compact={compact}
    >
      <RadioGroup
        idPrefix="LarpSignupInfoFormComponent-openness"
        name="openness"
        legend={t.attributes.openness.label}
        defaultValue={larp?.openness ?? ""}
        disabled={readOnly}
        choices={[
          ...Object.entries(t.attributes.openness.choices).map(
            ([key, { title, description }]) => ({
              value: key,
              title,
              description,
            }),
          ),
          {
            value: "",
            title: newT.opennessUnspecified.title,
            description: newT.opennessUnspecified.description,
          },
        ]}
        helpText={showHelpText ? t.attributes.openness.helpText : undefined}
      />

      <div className={styles.grid2}>
        <div className={styles.field}>
          <FormLabel htmlFor="LarpSignupInfoFormComponent-signupStartsAt">
            {t.attributes.signupStartsAt.label}
          </FormLabel>
          <FormControl
            type="date"
            id="LarpSignupInfoFormComponent-signupStartsAt"
            name="signupStartsAt"
            defaultValue={toISODateEmpty(larp?.signupStartsAt)}
            readOnly={readOnly}
          />
          {showHelpText && (
            <FormText>{t.attributes.signupStartsAt.helpText}</FormText>
          )}
        </div>

        <div className={styles.field}>
          <FormLabel htmlFor="LarpSignupInfoFormComponent-signupEndsAt">
            {t.attributes.signupEndsAt.label}
          </FormLabel>
          <FormControl
            type="date"
            id="LarpSignupInfoFormComponent-signupEndsAt"
            name="signupEndsAt"
            defaultValue={toISODateEmpty(larp?.signupEndsAt)}
            readOnly={readOnly}
          />
          {showHelpText && (
            <FormText>{t.attributes.signupEndsAt.helpText}</FormText>
          )}
        </div>
      </div>

      <div className={styles.grid2}>
        <div className={styles.field}>
          <FormLabel htmlFor="LarpBasicInfoFormComponent-numPlayerCharacters">
            {t.attributes.numPlayerCharacters.label}
          </FormLabel>
          <FormControl
            type="number"
            id="LarpBasicInfoFormComponent-numPlayerCharacters"
            name="numPlayerCharacters"
            min={0}
            defaultValue={larp?.numPlayerCharacters || ""}
            readOnly={readOnly}
          />
          {showHelpText && (
            <FormText>{t.attributes.numPlayerCharacters.helpText}</FormText>
          )}
        </div>
        <div className={styles.field}>
          <FormLabel htmlFor="LarpBasicInfoFormComponent-numTotalParticipants">
            {t.attributes.numTotalParticipants.label}
          </FormLabel>
          <FormControl
            type="number"
            id="LarpBasicInfoFormComponent-numTotalParticipants"
            name="numTotalParticipants"
            min={0}
            defaultValue={larp?.numTotalParticipants || ""}
            readOnly={readOnly}
          />
          {showHelpText && (
            <FormText>{t.attributes.numTotalParticipants.helpText}</FormText>
          )}
        </div>
      </div>
    </FormSection>
  );
}
