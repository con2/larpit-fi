import { Larp, Municipality } from "@/generated/prisma/client";
import prisma from "@/prisma";
import { toSupportedLanguage } from "@/translations";
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
  larp: Pick<Larp, "locationText" | "municipalityId" | "language"> | null;
  readOnly?: boolean;
  compact?: boolean;
}

function getMunicipalityName(municipality: Municipality, _locale: string) {
  // TODO how should we take into account the locale and language of the larp?
  // A unilingually Swedish municipality under English locale should probably be returned in Swedish?
  if (municipality.nameFi) {
    return { language: "fi", name: municipality.nameFi };
  } else if (municipality.nameSv) {
    return { language: "sv", name: municipality.nameSv };
  } else if (municipality.nameOther && municipality.nameOtherLanguageCode) {
    return {
      language: municipality.nameOtherLanguageCode,
      name: municipality.nameOther,
    };
  } else {
    return { language: null, name: null };
  }
}

export default async function LarpLocationFormComponent({
  larp,
  locale,
  translations,
  readOnly,
  compact,
}: Props) {
  const t = translations.Larp;
  const newT = translations.NewLarpPage;
  const showHelpText = !compact;

  const municipalities = await prisma.municipality.findMany({
    orderBy: { nameFi: "asc" }, // TODO handle other languages
  });
  locale = toSupportedLanguage(locale);

  return (
    <Card className="mb-4">
      <CardBody>
        <CardTitle>{newT.sections.location.title}</CardTitle>
        {showHelpText && (
          <div className="mb-4">{newT.sections.location.message}</div>
        )}

        <div className="row">
          <div className="form-group mb-3 col-md-6">
            <FormLabel htmlFor="LarpLocationFormComponent-locationText">
              {t.attributes.locationText.label}
            </FormLabel>
            <FormControl
              type="text"
              id="LarpLocationFormComponent-locationText"
              name="locationText"
              defaultValue={larp?.locationText || ""}
              readOnly={readOnly}
            />
            {showHelpText && (
              <FormText>{t.attributes.locationText.helpText}</FormText>
            )}
          </div>
          <div className="form-group mb-3 col-md-6">
            <FormLabel htmlFor="LarpLocationFormComponent-municipality">
              {t.attributes.municipality.label}
            </FormLabel>
            <FormSelect
              id="LarpLocationFormComponent-municipality"
              name="municipality"
              defaultValue={larp?.municipalityId ?? ""}
              disabled={readOnly}
            >
              <option value=""></option>
              {municipalities.map((municipality) => {
                const { language, name } = getMunicipalityName(
                  municipality,
                  locale
                );
                return (
                  <option
                    key={municipality.id}
                    value={municipality.id}
                    lang={language ?? undefined}
                  >
                    {name}
                  </option>
                );
              })}
            </FormSelect>
            {showHelpText && (
              <FormText>{t.attributes.municipality.helpText}</FormText>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
