import {
  Card,
  CardBody,
  CardTitle,
  FormControl,
  FormLabel,
  FormText,
} from "react-bootstrap";
import SubmitButton from "./SubmitButton";
import type { Translations } from "@/translations/en";

interface Props {
  user: { email: string } | null;
  translations: Translations;
}

export default function YoureAlmostReadyFormComponent({
  user,
  translations,
}: Props) {
  const t = translations.NewLarpPage;
  const requesT = translations.ModerationRequest;

  return (
    <Card className="mb-5">
      <CardBody>
        <CardTitle>{t.sections.submit.title}</CardTitle>
        <div className="mb-4">
          {t.sections.submit.message}
          {user ? null : t.sections.submit.notLoggedIn}
        </div>

        <div className="form-group mb-3">
          <FormLabel htmlFor="YoureAlmostReadyFormComponent-submit-message">
            {requesT.attributes.message.label}
          </FormLabel>
          <FormControl
            as="textarea"
            id="YoureAlmostReadyFormComponent-submit-message"
            name="message"
            rows={5}
          />
          <FormText>{requesT.attributes.message.helpText}</FormText>
        </div>

        {user ? null : (
          <div className="form-group mb-5">
            <FormLabel htmlFor="YoureAlmostReadyFormComponent-submit-cat">
              {t.sections.submit.attributes.cat.label}*
            </FormLabel>
            <FormControl
              id="YoureAlmostReadyFormComponent-submit-cat"
              name="cat"
              required
            />
            <FormText>{t.sections.submit.attributes.cat.helpText}</FormText>
          </div>
        )}

        <div className="d-flex mb-2">
          <SubmitButton className="btn btn-primary btn-lg flex-grow-1">
            {t.actions.submit}
          </SubmitButton>
        </div>
      </CardBody>
    </Card>
  );
}
