import { Larp } from "@/generated/prisma";
import { toPlainDate } from "@/helpers/temporal";
import type { Translations } from "@/translations/en";
import { Temporal } from "@js-temporal/polyfill";
import {
  Card,
  CardBody,
  CardTitle,
  FormControl,
  FormLabel,
} from "react-bootstrap";

interface Props {
  translations: Translations;
  locale: string;
  larp: Pick<Larp, "openness" | "startsAt" | "endsAt"> | null;
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
    | undefined
): string {
  if (!date) return "";
  return toPlainDate(date).toString();
}

export function LarpTimeFormComponent({
  translations,
  larp,
  readOnly,
  compact,
}: Props) {
  const newT = translations.NewLarpPage;
  const secTion = newT.sections.time;
  const t = translations.Larp;

  const showHelpText = !compact;

  return (
    <Card className="mb-4">
      <CardBody>
        <CardTitle>{secTion.title}</CardTitle>
        {showHelpText && <div className="mb-4">{secTion.message}</div>}

        <div className="row">
          <div className="form-group col-md-6 mb-3">
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
          </div>

          <div className="form-group col-md-6 mb-3">
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
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
