import { Larp, LarpType } from "@/generated/prisma/client";
import { toPlainDate } from "@/helpers/temporal";
import prisma from "@/prisma";
import { toSupportedLanguage } from "@/translations";
import type { Translations } from "@/translations/en";
import { Temporal } from "@js-temporal/polyfill";
import {
  Card,
  CardBody,
  FormCheck,
  FormControl,
  FormLabel,
  FormSelect,
} from "react-bootstrap";
import TextArea from "./TextArea";

interface Props {
  translations: Translations;
  locale: string;
  larp: Pick<
    Larp,
    | "name"
    | "tagline"
    | "type"
    | "language"
    | "startsAt"
    | "endsAt"
    | "locationText"
    | "municipalityId"
    | "openness"
    | "signupStartsAt"
    | "signupEndsAt"
    | "numPlayerCharacters"
    | "numTotalParticipants"
    | "fluffText"
    | "description"
    | "isCancelled"
  > | null;
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

export default async function CompactLarpFormComponent({
  translations,
  locale,
  larp,
}: Props) {
  const t = translations.Larp;

  const municipalities = await prisma.municipality.findMany({
    orderBy: { nameFi: "asc" },
  });
  locale = toSupportedLanguage(locale);

  return (
    <>
      <Card className="mb-4">
        <CardBody>
          <div className="row mb-3">
            <div className="form-group col-lg-4">
              <FormLabel
                htmlFor="CompactLarpFormComponent-name"
                className="form-text"
              >
                {t.attributes.name.title}*
              </FormLabel>
              <FormControl
                type="text"
                id="CompactLarpFormComponent-name"
                name="name"
                defaultValue={larp?.name || ""}
                required
              />
            </div>
            <div className="form-group col-lg-8">
              <FormLabel
                htmlFor="CompactLarpFormComponent-tagline"
                className="form-text"
              >
                {t.attributes.tagline.title}
              </FormLabel>
              <FormControl
                type="text"
                id="CompactLarpFormComponent-tagline"
                name="tagline"
                defaultValue={larp?.tagline || ""}
              />
            </div>
          </div>

          <div className="row mb-4">
            <div className="form-group col-lg-6">
              <FormLabel
                htmlFor="CompactLarpFormComponent-type"
                className="form-text"
              >
                {t.attributes.type.title}*
              </FormLabel>
              <FormSelect
                id="CompactLarpFormComponent-type"
                name="type"
                required
                defaultValue={larp?.type ?? LarpType.ONE_SHOT}
              >
                <option value=""></option>
                {Object.entries(t.attributes.type.choices).map(
                  ([key, { title }]) => (
                    <option key={key} value={key}>
                      {title}
                    </option>
                  ),
                )}
              </FormSelect>
            </div>
            <div className="form-group col-lg-6">
              <FormLabel
                htmlFor="CompactLarpFormComponent-language"
                className="form-text"
              >
                {t.attributes.language.title}*
              </FormLabel>
              <FormSelect
                id="CompactLarpFormComponent-language"
                name="language"
                required
                defaultValue={larp?.language ?? locale}
              >
                <option value=""></option>
                {Object.entries(t.attributes.language.choices).map(
                  ([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ),
                )}
              </FormSelect>
            </div>
          </div>

          <div className="row mb-3">
            <div className="form-group col-lg-6">
              <FormLabel
                htmlFor="CompactLarpFormComponent-locationText"
                className="form-text"
              >
                {t.attributes.locationText.title}
              </FormLabel>
              <FormControl
                type="text"
                id="CompactLarpFormComponent-locationText"
                name="locationText"
                defaultValue={larp?.locationText || ""}
              />
            </div>
            <div className="form-group col-lg-6">
              <FormLabel
                htmlFor="CompactLarpFormComponent-municipality"
                className="form-text"
              >
                {t.attributes.municipality.title}
              </FormLabel>
              <FormSelect
                id="CompactLarpFormComponent-municipality"
                name="municipality"
                defaultValue={larp?.municipalityId ?? ""}
              >
                <option value=""></option>
                {municipalities.map((municipality) => (
                  <option key={municipality.id} value={municipality.id}>
                    {municipality.nameFi ??
                      municipality.nameSv ??
                      municipality.nameOther}
                  </option>
                ))}
              </FormSelect>
            </div>
          </div>

          <div className="row mb-3">
            <div className="form-group col-lg-6">
              <FormLabel
                htmlFor="CompactLarpFormComponent-startsAt"
                className="form-text"
              >
                {t.attributes.startsAt.title}
              </FormLabel>
              <FormControl
                type="date"
                id="CompactLarpFormComponent-startsAt"
                name="startsAt"
                defaultValue={toISODateEmpty(larp?.startsAt)}
              />
            </div>
            <div className="form-group col-lg-6">
              <FormLabel
                htmlFor="CompactLarpFormComponent-endsAt"
                className="form-text"
              >
                {t.attributes.endsAt.title}
              </FormLabel>
              <FormControl
                type="date"
                id="CompactLarpFormComponent-endsAt"
                name="endsAt"
                defaultValue={toISODateEmpty(larp?.endsAt)}
              />
            </div>
          </div>

          <div className="row mb-3">
            <div className="form-group col-lg-4">
              <FormLabel
                htmlFor="CompactLarpFormComponent-openness"
                className="form-text"
              >
                {t.attributes.openness.title}
              </FormLabel>
              <FormSelect
                id="CompactLarpFormComponent-openness"
                name="openness"
                defaultValue={larp?.openness ?? ""}
              >
                <option value=""></option>
                {Object.entries(t.attributes.openness.choices).map(
                  ([key, { title, description }]) => (
                    <option key={key} value={key}>
                      {title}: {description}
                    </option>
                  ),
                )}
              </FormSelect>
            </div>
            <div className="form-group col-lg-4">
              <FormLabel
                htmlFor="CompactLarpFormComponent-signupStartsAt"
                className="form-text"
              >
                {t.attributes.signupStartsAt.title}
              </FormLabel>
              <FormControl
                type="date"
                id="CompactLarpFormComponent-signupStartsAt"
                name="signupStartsAt"
                defaultValue={toISODateEmpty(larp?.signupStartsAt)}
              />
            </div>
            <div className="form-group col-lg-4">
              <FormLabel
                htmlFor="CompactLarpFormComponent-signupEndsAt"
                className="form-text"
              >
                {t.attributes.signupEndsAt.title}
              </FormLabel>
              <FormControl
                type="date"
                id="CompactLarpFormComponent-signupEndsAt"
                name="signupEndsAt"
                defaultValue={toISODateEmpty(larp?.signupEndsAt)}
              />
            </div>
          </div>

          <div className="row mb-5">
            <div className="form-group col-lg-6">
              <FormLabel
                htmlFor="CompactLarpFormComponent-numPlayerCharacters"
                className="form-text"
              >
                {t.attributes.numPlayerCharacters.title}
              </FormLabel>
              <FormControl
                type="number"
                id="CompactLarpFormComponent-numPlayerCharacters"
                name="numPlayerCharacters"
                min={0}
                defaultValue={larp?.numPlayerCharacters || ""}
              />
            </div>
            <div className="form-group col-lg-6">
              <FormLabel
                htmlFor="CompactLarpFormComponent-numTotalParticipants"
                className="form-text"
              >
                {t.attributes.numTotalParticipants.title}
              </FormLabel>
              <FormControl
                type="number"
                id="CompactLarpFormComponent-numTotalParticipants"
                name="numTotalParticipants"
                min={0}
                defaultValue={larp?.numTotalParticipants || ""}
              />
            </div>
          </div>

          <div className="form-group">
            <FormCheck
              type="checkbox"
              id="LarpCancelledFormComponent-isCancelled"
              name="isCancelled"
              label={<>{t.attributes.isCancelled.label}</>}
              defaultChecked={larp?.isCancelled ?? false}
            />
          </div>
        </CardBody>
      </Card>

      <Card className="mb-4">
        <CardBody>
          <div className="form-group mb-3">
            <FormLabel
              htmlFor="CompactLarpFormComponent-fluffText"
              className="form-text"
            >
              {t.attributes.fluffText.title}
            </FormLabel>
            <TextArea
              id="CompactLarpFormComponent-fluffText"
              name="fluffText"
              rows={5}
              defaultValue={larp?.fluffText || ""}
              maxLength={2000}
            />
          </div>

          <div className="form-group mb-1">
            <FormLabel
              htmlFor="CompactLarpFormComponent-description"
              className="form-text"
            >
              {t.attributes.description.title}
            </FormLabel>
            <TextArea
              id="CompactLarpFormComponent-description"
              name="description"
              rows={5}
              defaultValue={larp?.description || ""}
              maxLength={2000}
            />
          </div>
        </CardBody>
      </Card>
    </>
  );
}
