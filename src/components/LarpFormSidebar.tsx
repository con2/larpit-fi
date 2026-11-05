import type { Translations } from "@/translations/en";
import type { ReactNode } from "react";
import LarpFormPreview from "./LarpFormPreview";
import LarpFormSectionIndex, {
  type LarpFormSectionLink,
} from "./LarpFormSectionIndex";
import styles from "./LarpForm.module.scss";

interface Props {
  formId: string;
  sections: LarpFormSectionLink[];
  translations: Translations;
  locale: string;
  children?: ReactNode;
}

export default function LarpFormSidebar({
  formId,
  sections,
  translations,
  locale,
  children,
}: Props) {
  const t = translations.NewLarpPage;
  const larpT = translations.Larp.attributes;

  return (
    <aside className={styles.aside}>
      <LarpFormSectionIndex
        formId={formId}
        sections={sections}
        messages={t.sectionIndex}
      />
      <LarpFormPreview
        formId={formId}
        locale={locale}
        messages={{
          ...t.preview,
          languages: larpT.language.choices,
          types: Object.fromEntries(
            Object.entries(larpT.type.choices).map(([type, { title }]) => [
              type,
              title,
            ]),
          ),
        }}
      />
      {children}
    </aside>
  );
}
