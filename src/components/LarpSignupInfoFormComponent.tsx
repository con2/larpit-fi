import { Larp } from "@/generated/prisma/client";
import { toPlainDate } from "@/helpers/temporal";
import type { Translations } from "@/translations/en";
import { Temporal } from "@js-temporal/polyfill";
import {
  Card,
  CardBody,
  CardTitle,
  FormControl,
  FormLabel,
  FormSelect,
  FormText,
  Row,
} from "react-bootstrap";

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
    | undefined
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
    <Card className="mb-4">
      <CardBody>
        <CardTitle>{secTion.title}</CardTitle>
        {showHelpText && <div className="mb-4">{secTion.message}</div>}

        <div className="form-group mb-3">
          <FormLabel htmlFor="LarpSignupInfoFormComponent-openness">
            {t.attributes.openness.label}
          </FormLabel>
          <FormSelect
            id="LarpSignupInfoFormComponent-openness"
            name="openness"
            defaultValue={larp?.openness ?? ""}
            disabled={readOnly}
          >
            <option value=""></option>
            {Object.entries(t.attributes.openness.choices).map(
              ([key, { title, description }]) => (
                <option key={key} value={key}>
                  {title}: {description}
                </option>
              )
            )}
          </FormSelect>
          {showHelpText && (
            <FormText>{t.attributes.openness.helpText}</FormText>
          )}
        </div>

        <Row>
          <div className="form-group col-md-6 mb-3">
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

          <div className="form-group col-md-6 mb-3">
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
        </Row>

        <Row>
          <div className="form-group mb-3 col-md-6">
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
          <div className="form-group mb-3 col-md-6">
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
        </Row>
      </CardBody>
    </Card>
  );
}
