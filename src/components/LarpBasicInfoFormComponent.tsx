import { LarpType } from "@/prisma/enums";
import type { Larp } from "@/prisma/models";
import type { Translations } from "@/translations/en";
import { FormControl, FormLabel, FormText } from "react-bootstrap";
import { FormSection, RadioGroup, RequiredMark } from "./FormSection";
import styles from "./LarpForm.module.scss";

interface Props {
  translations: Translations;
  locale: string;
  larp: Pick<Larp, "name" | "tagline" | "type" | "language"> | null;
  readOnly?: boolean;
  compact?: boolean;
}

export function LarpBasicInfoFormComponent({
  translations,
  locale,
  larp,
  readOnly,
  compact,
}: Props) {
  const newT = translations.NewLarpPage;
  const t = translations.Larp;

  const showHelpText = !compact;

  return (
    <FormSection
      id="basics"
      title={newT.sections.larp.title}
      intro={newT.sections.larp.message}
      compact={compact}
    >
      <div className={styles.field}>
        <FormLabel htmlFor="LarpBasicInfoFormComponent-name">
          {t.attributes.name.label}
          <RequiredMark />
        </FormLabel>
        <FormControl
          type="text"
          id="LarpBasicInfoFormComponent-name"
          name="name"
          className={styles.nameInput}
          defaultValue={larp?.name || ""}
          required
          readOnly={readOnly}
        />
        {showHelpText && <FormText>{t.attributes.name.helpText}</FormText>}
      </div>

      <div className={styles.field}>
        <FormLabel htmlFor="LarpBasicInfoFormComponent-tagline">
          {t.attributes.tagline.label}
        </FormLabel>
        <FormControl
          type="text"
          id="LarpBasicInfoFormComponent-tagline"
          name="tagline"
          defaultValue={larp?.tagline || ""}
          readOnly={readOnly}
        />
        {showHelpText && <FormText>{t.attributes.tagline.helpText}</FormText>}
      </div>

      <RadioGroup
        idPrefix="LarpBasicInfoFormComponent-type"
        name="type"
        legend={t.attributes.type.label}
        defaultValue={larp?.type ?? LarpType.ONE_SHOT}
        required
        disabled={readOnly}
        columns={2}
        choices={Object.entries(t.attributes.type.choices).map(
          ([key, { title, description }]) => ({
            value: key,
            title,
            description: showHelpText ? description : undefined,
          }),
        )}
      />

      <RadioGroup
        idPrefix="LarpBasicInfoFormComponent-language"
        name="language"
        legend={t.attributes.language.label}
        defaultValue={larp?.language ?? locale}
        required
        disabled={readOnly}
        variant="pill"
        choices={Object.entries(t.attributes.language.choices).map(
          ([key, label]) => ({ value: key, title: label }),
        )}
        helpText={showHelpText ? t.attributes.language.helpText : undefined}
      />
    </FormSection>
  );
}
