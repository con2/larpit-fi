import type { Larp } from "@/prisma/models";
import type { Translations } from "@/translations/en";
import { FormCheck } from "react-bootstrap";
import { FormSection } from "./FormSection";
import styles from "./LarpForm.module.scss";

interface Props {
  translations: Translations;
  larp: Pick<Larp, "cancelledAt"> | null;
  readOnly?: boolean;
  compact?: boolean;
}

export default function LarpCancelledFormComponent({
  larp,
  translations,
  readOnly,
  compact,
}: Props) {
  const t = translations.Larp;
  const newT = translations.NewLarpPage;

  return (
    <FormSection
      id="cancelled"
      title={newT.sections.cancelled.title}
      intro={newT.sections.cancelled.message}
      compact={compact}
    >
      <FormCheck
        type="checkbox"
        id="LarpCancelledFormComponent-isCancelled"
        name="isCancelled"
        className={styles.check}
        label={t.attributes.isCancelled.label}
        defaultChecked={larp?.cancelledAt != null}
        readOnly={readOnly}
      />
    </FormSection>
  );
}
