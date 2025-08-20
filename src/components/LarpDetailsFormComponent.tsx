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
}

export function LarpDetailsFormComponent({ translations, locale }: Props) {
  const newT = translations.NewLarpPage;
  const t = translations.Larp;

  return (
    <Card className="mb-4">
      <CardBody>
        <CardTitle>{newT.sections.larp.title}</CardTitle>
        <div className="mb-4">{newT.sections.larp.message}</div>

        <div className="form-group mb-3">
          <FormLabel htmlFor="LarpDetailsFormComponent-name">
            {t.attributes.name.label}*
          </FormLabel>
          <FormControl
            type="text"
            id="LarpDetailsFormComponent-name"
            name="name"
            required
          />
          <FormText>{t.attributes.name.helpText}</FormText>
        </div>

        <div className="form-group mb-3">
          <FormLabel htmlFor="LarpDetailsFormComponent-tagline">
            {t.attributes.tagline.label}
          </FormLabel>
          <FormControl
            type="text"
            id="LarpDetailsFormComponent-tagline"
            name="tagline"
          />
          <FormText>{t.attributes.tagline.helpText}</FormText>
        </div>

        <div className="row">
          <div className="form-group mb-3 col-md-6">
            <FormLabel htmlFor="LarpDetailsFormComponent-locationText">
              {t.attributes.locationText.label}
            </FormLabel>
            <FormControl
              type="text"
              id="LarpDetailsFormComponent-locationText"
              name="locationText"
            />
            <FormText>{t.attributes.locationText.helpText}</FormText>
          </div>

          <div className="form-group mb-3 col-md-6">
            <FormLabel htmlFor="LarpDetailsFormComponent-language">
              {t.attributes.language.label}*
            </FormLabel>
            <FormSelect
              id="LarpDetailsFormComponent-language"
              name="language"
              required
              defaultValue={locale}
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
            <FormText>{t.attributes.language.helpText}</FormText>
          </div>
        </div>

        <div className="row">
          <div className="form-group col-md-6 mb-3">
            <FormLabel htmlFor="LarpDetailsFormComponent-startsAt">
              {t.attributes.startsAt.label}
            </FormLabel>
            <FormControl
              type="date"
              id="LarpDetailsFormComponent-startsAt"
              name="startsAt"
            />
            <FormText>{t.attributes.startsAt.helpText}</FormText>
          </div>

          <div className="form-group col-md-6 mb-3">
            <FormLabel htmlFor="LarpDetailsFormComponent-endsAt">
              {t.attributes.endsAt.label}
            </FormLabel>
            <FormControl
              type="date"
              id="LarpDetailsFormComponent-endsAt"
              name="endsAt"
            />
            <FormText>{t.attributes.endsAt.helpText}</FormText>
          </div>
        </div>

        <div className="row">
          <div className="form-group col-md-6 mb-3">
            <FormLabel htmlFor="LarpDetailsFormComponent-signupStartsAt">
              {t.attributes.signupStartsAt.label}
            </FormLabel>
            <FormControl
              type="date"
              id="LarpDetailsFormComponent-signupStartsAt"
              name="signupStartsAt"
            />
            <FormText>{t.attributes.signupStartsAt.helpText}</FormText>
          </div>

          <div className="form-group col-md-6 mb-3">
            <FormLabel htmlFor="LarpDetailsFormComponent-signupEndsAt">
              {t.attributes.signupEndsAt.label}
            </FormLabel>
            <FormControl
              type="date"
              id="LarpDetailsFormComponent-signupEndsAt"
              name="signupEndsAt"
            />
            <FormText>{t.attributes.signupEndsAt.helpText}</FormText>
          </div>
        </div>

        <div className="form-group mb-3">
          <FormLabel htmlFor="LarpDetailsFormComponent-fluffText">
            {t.attributes.fluffText.label}
          </FormLabel>
          <FormControl
            as="textarea"
            id="LarpDetailsFormComponent-fluffText"
            name="fluffText"
            rows={5}
          />
          <FormText>{t.attributes.fluffText.helpText}</FormText>
        </div>
        <div className="form-group mb-1">
          <FormLabel htmlFor="LarpDetailsFormComponent-description">
            {t.attributes.description.label}
          </FormLabel>
          <FormControl
            as="textarea"
            id="LarpDetailsFormComponent-description"
            name="description"
            rows={5}
          />
          <FormText>{t.attributes.description.helpText}</FormText>
        </div>
      </CardBody>
    </Card>
  );
}
