import { Larp, LarpType } from "@/generated/prisma/client";
import type { Translations } from "@/translations/en";
import {
  Card,
  CardBody,
  CardTitle,
  FormControl,
  FormLabel,
  FormSelect,
  FormText,
} from "react-bootstrap";

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

        <div className="form-group mb-3">
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

        <div className="form-group mb-3">
          <FormLabel htmlFor="LarpBasicInfoFormComponent-type">
            {t.attributes.type.label}*
          </FormLabel>
          <FormSelect
            id="LarpBasicInfoFormComponent-type"
            name="type"
            required
            defaultValue={larp?.type ?? LarpType.ONE_SHOT}
            disabled={readOnly}
          >
            <option value=""></option>
            {Object.entries(t.attributes.type.choices).map(
              ([key, { title }]) => (
                <option key={key} value={key}>
                  {title}
                </option>
              )
            )}
          </FormSelect>
          {showHelpText && (
            <FormText>
              {Object.entries(t.attributes.type.choices).map(
                ([key, { title, description }]) => (
                  <div className="mt-1" key={key}>
                    <strong>{title}:</strong> {description}
                  </div>
                )
              )}
            </FormText>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
