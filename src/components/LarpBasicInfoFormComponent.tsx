import { Larp } from "@/generated/prisma";
import type { Translations } from "@/translations/en";
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
    | "name"
    | "tagline"
    | "type"
    | "language"
    | "numPlayerCharacters"
    | "numTotalParticipants"
  > | null;
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
    <Card className="mb-4">
      <CardBody>
        <CardTitle>{newT.sections.larp.title}</CardTitle>
        {showHelpText && (
          <div className="mb-4">{newT.sections.larp.message}</div>
        )}

        <div className="form-group mb-3">
          <FormLabel htmlFor="LarpBasicInfoFormComponent-name">
            {t.attributes.name.label}*
          </FormLabel>
          <FormControl
            type="text"
            id="LarpBasicInfoFormComponent-name"
            name="name"
            defaultValue={larp?.name || ""}
            required
            readOnly={readOnly}
          />
          {showHelpText && <FormText>{t.attributes.name.helpText}</FormText>}
        </div>

        <div className="form-group mb-3">
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

        <Row>
          <div className="form-group mb-3 col-md-6">
            <FormLabel htmlFor="LarpBasicInfoFormComponent-type">
              {t.attributes.type.label}*
            </FormLabel>
            <FormSelect
              id="LarpBasicInfoFormComponent-type"
              name="type"
              required
              defaultValue={larp?.type ?? locale}
              disabled={readOnly}
            >
              <option value=""></option>
              {Object.entries(t.attributes.type.choices).map(
                ([key, { label }]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                )
              )}
            </FormSelect>
            {/* {showHelpText && <FormText>{t.attributes.type.helpText}</FormText>} */}
          </div>
          <div className="form-group mb-3 col-md-6">
            <FormLabel htmlFor="LarpBasicInfoFormComponent-language">
              {t.attributes.language.label}*
            </FormLabel>
            <FormSelect
              id="LarpBasicInfoFormComponent-language"
              name="language"
              required
              defaultValue={larp?.language ?? locale}
              disabled={readOnly}
            >
              <option value=""></option>
              {Object.entries(t.attributes.language.choices).map(
                ([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                )
              )}
            </FormSelect>
            {showHelpText && (
              <FormText>{t.attributes.language.helpText}</FormText>
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
