import { Larp } from "@/generated/prisma/client";
import type { Translations } from "@/translations/en";
import { Card, CardBody, CardTitle, FormCheck } from "react-bootstrap";

interface Props {
  translations: Translations;
  larp: Pick<Larp, "isCancelled"> | null;
  readOnly?: boolean;
  compact?: boolean;
}

export default async function LarpCancelledFormComponent({
  larp,
  translations,
  readOnly,
  compact,
}: Props) {
  const t = translations.Larp;
  const newT = translations.NewLarpPage;
  const showHelpText = !compact;

  return (
    <Card className="mb-4">
      <CardBody>
        <CardTitle>{newT.sections.cancelled.title}</CardTitle>
        {showHelpText && (
          <div className="mb-4">{newT.sections.cancelled.message}</div>
        )}

        <FormCheck
          type="checkbox"
          id="LarpCancelledFormComponent-isCancelled"
          name="isCancelled"
          label={<>{t.attributes.isCancelled.label}</>}
          defaultChecked={larp?.isCancelled ?? false}
          readOnly={readOnly}
        />
      </CardBody>
    </Card>
  );
}
