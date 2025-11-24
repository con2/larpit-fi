import { Larp } from "@/generated/prisma/client";
import type { Translations } from "@/translations/en";
import {
  Card,
  CardBody,
  CardTitle,
  FormControl,
  FormLabel,
  FormText,
} from "react-bootstrap";

interface Props {
  translations: Translations;
  locale: string;
  larp: Pick<Larp, "fluffText" | "description"> | null;
  readOnly?: boolean;
  compact?: boolean;
}

export function LarpPageContentFormComponent({
  translations,
  larp,
  readOnly,
  compact,
}: Props) {
  const newT = translations.NewLarpPage;
  const secTion = newT.sections.content;
  const t = translations.Larp;

  const showHelpText = !compact;

  return (
    <Card className="mb-4">
      <CardBody>
        <CardTitle>{secTion.title}</CardTitle>
        {showHelpText && <div className="mb-4">{secTion.message}</div>}

        <div className="form-group mb-3">
          <FormLabel htmlFor="LarpPageContentFormComponent-fluffText">
            {t.attributes.fluffText.label}
          </FormLabel>
          <FormControl
            as="textarea"
            id="LarpPageContentFormComponent-fluffText"
            name="fluffText"
            rows={5}
            defaultValue={larp?.fluffText || ""}
            readOnly={readOnly}
          />
          {showHelpText && (
            <FormText>{t.attributes.fluffText.helpText}</FormText>
          )}
        </div>
        <div className="form-group mb-1">
          <FormLabel htmlFor="LarpPageContentFormComponent-description">
            {t.attributes.description.label}
          </FormLabel>
          <FormControl
            as="textarea"
            id="LarpPageContentFormComponent-description"
            name="description"
            rows={5}
            defaultValue={larp?.description || ""}
            readOnly={readOnly}
          />
          {showHelpText && (
            <FormText>{t.attributes.description.helpText}</FormText>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
