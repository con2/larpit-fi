import type { Larp } from "@/prisma/models";
import { toPlainDate } from "@con2/components/helpers";
import type { Translations } from "@/translations/en";
import { Temporal } from "@js-temporal/polyfill";
import type { ReactNode } from "react";
import { FormControl, FormLabel, FormText } from "react-bootstrap";
import { FormSection } from "./FormSection";
import styles from "./LarpForm.module.scss";

interface Props {
  translations: Translations;
  locale: string;
  larp: Pick<Larp, "openness" | "startsAt" | "endsAt"> | null;
  readOnly?: boolean;
  compact?: boolean;
  /** Rendered at the end of the section, such as the location fields. */
  children?: ReactNode;
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

export function LarpTimeFormComponent({
  translations,
  larp,
  readOnly,
  compact,
  children,
}: Props) {
  const newT = translations.NewLarpPage;
  const secTion = newT.sections.time;
  const t = translations.Larp;

  const showHelpText = !compact;

  return (
    <FormSection
      id="when"
      title={secTion.title}
      intro={secTion.message}
      compact={compact}
    >
      <div className={styles.grid2}>
        <div className={styles.field}>
          <FormLabel htmlFor="LarpTimeFormComponent-startsAt">
            {t.attributes.startsAt.title}
          </FormLabel>
          <FormControl
            type="date"
            id="LarpTimeFormComponent-startsAt"
            name="startsAt"
            defaultValue={toISODateEmpty(larp?.startsAt)}
            readOnly={readOnly}
          />
          {showHelpText && (
            <FormText>{t.attributes.startsAt.helpText}</FormText>
          )}
        </div>

        <div className={styles.field}>
          <FormLabel htmlFor="LarpTimeFormComponent-endsAt">
            {t.attributes.endsAt.title}
          </FormLabel>
          <FormControl
            type="date"
            id="LarpTimeFormComponent-endsAt"
            name="endsAt"
            defaultValue={toISODateEmpty(larp?.endsAt)}
            readOnly={readOnly}
          />
          {showHelpText && <FormText>{t.attributes.endsAt.helpText}</FormText>}
        </div>
      </div>
      {children}
    </FormSection>
  );
}
