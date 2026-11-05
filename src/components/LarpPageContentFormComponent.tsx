import type { Larp } from "@/prisma/models";
import type { Translations } from "@/translations/en";
import { FormLabel, FormText } from "react-bootstrap";
import { FormSection } from "./FormSection";
import styles from "./LarpForm.module.scss";
import { MarkdownEditor, TextArea } from "@con2/components";

interface Props {
  translations: Translations;
  locale: string;
  larp: Pick<Larp, "fluffText" | "description"> | null;
  readOnly?: boolean;
  compact?: boolean;
}

export function LarpPageContentFormComponent({
  translations,
  locale,
  larp,
  readOnly,
  compact,
}: Props) {
  const newT = translations.NewLarpPage;
  const secTion = newT.sections.content;
  const t = translations.Larp;

  const showHelpText = !compact;

  return (
    <FormSection
      id="content"
      title={secTion.title}
      intro={secTion.message}
      compact={compact}
    >
      <div className={`${styles.field} ${styles.fluff}`}>
        <FormLabel htmlFor="LarpPageContentFormComponent-fluffText">
          {t.attributes.fluffText.label}
        </FormLabel>
        <TextArea
          id="LarpPageContentFormComponent-fluffText"
          name="fluffText"
          rows={6}
          defaultValue={larp?.fluffText || ""}
          readOnly={readOnly}
          maxLength={2000}
          locale={locale}
        />
        {showHelpText && <FormText>{t.attributes.fluffText.helpText}</FormText>}
      </div>
      <div className={styles.field}>
        <FormLabel htmlFor="LarpPageContentFormComponent-description">
          {t.attributes.description.label}
        </FormLabel>
        <MarkdownEditor
          id="LarpPageContentFormComponent-description"
          name="description"
          rows={10}
          defaultValue={larp?.description || ""}
          readOnly={readOnly}
          maxLength={2000}
          locale={locale}
        />
        {showHelpText && (
          <FormText>{t.attributes.description.helpText}</FormText>
        )}
      </div>
    </FormSection>
  );
}
