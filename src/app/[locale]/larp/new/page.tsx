import MainHeading from "@/components/MainHeading";
import MaybeExternalLink from "@/components/MaybeExternalLink";
import SubmitButton from "@/components/SubmitButton";
import { privacyPolicyUrl } from "@/config";
import { getTranslations } from "@/translations";
import Link from "next/link";
import { ReactNode } from "react";
import { FormCheck, FormSelect, FormText } from "react-bootstrap";
import Card from "react-bootstrap/Card";
import CardBody from "react-bootstrap/CardBody";
import CardTitle from "react-bootstrap/CardTitle";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import FormControl from "react-bootstrap/FormControl";
import FormLabel from "react-bootstrap/FormLabel";

interface Props {
  params: Promise<{
    locale: string;
  }>;
}

function LoginLink({ children }: { children: ReactNode }) {
  return <Link href="/login">{children}</Link>;
}

function PrivacyPolicyLink({ children }: { children: ReactNode }) {
  return (
    <MaybeExternalLink href={privacyPolicyUrl}>{children}</MaybeExternalLink>
  );
}

export default async function NewLarpPage({ params }: Props) {
  const { locale } = await params;

  const translations = getTranslations(locale);
  const t = translations.NewLarpPage;
  const larpT = translations.Larp;

  return (
    <Container>
      <MainHeading>{t.title}</MainHeading>
      <div className="text-center mb-5">{t.message}</div>
      <Form>
        <Card className="mb-4">
          <CardBody>
            <CardTitle>{t.sections.contact.title}</CardTitle>
            <div className="mb-4">{t.sections.contact.message(LoginLink)}</div>
            <div className="row">
              <div className="form-group col-md-6 mb-3">
                <FormLabel htmlFor="NewLarpPage-submitterName">
                  {t.sections.contact.attributes.submitterName.label}*
                </FormLabel>
                <FormControl
                  type="text"
                  name="submitterName"
                  id="NewLarpPage-submitterName"
                  required
                />
                <FormText>
                  {t.sections.contact.attributes.submitterName.helpText}
                </FormText>
              </div>

              <div className="form-group col-md-6 mb-3">
                <FormLabel htmlFor="NewLarpPage-submitterEmail">
                  {t.sections.contact.attributes.submitterEmail.label}*
                </FormLabel>
                <FormControl
                  type="email"
                  name="submitterEmail"
                  id="NewLarpPage-submitterEmail"
                  required
                />
                <FormText>
                  {t.sections.contact.attributes.submitterEmail.helpText}
                </FormText>
              </div>
            </div>

            <div className="form-group mb-1">
              <FormLabel htmlFor="NewLarpPage-submitterRole">
                {t.sections.contact.attributes.submitterRole.label}*
              </FormLabel>
              <FormSelect
                id="NewLarpPage-submitterRole"
                name="submitterRole"
                required
              >
                <option value=""></option>
                {Object.entries(
                  t.sections.contact.attributes.submitterRole.choices
                ).map(([key, { label }]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </FormSelect>
            </div>
          </CardBody>
        </Card>

        <Card className="mb-4">
          <CardBody>
            <CardTitle>{t.sections.privacy.title}</CardTitle>
            <div className="mb-4">
              {t.sections.privacy.message(PrivacyPolicyLink)}
            </div>
            <FormCheck
              type="checkbox"
              id="NewLarpPage-privacy-consent"
              label={<>{t.sections.privacy.consentCheckbox}*</>}
              required
            />
          </CardBody>
        </Card>

        <Card className="mb-4">
          <CardBody>
            <CardTitle>{t.sections.larp.title}</CardTitle>
            <div className="mb-4">{t.sections.larp.message}</div>

            <div className="form-group mb-3">
              <FormLabel htmlFor="NewLarpPage-name">
                {larpT.attributes.name.label}*
              </FormLabel>
              <FormControl type="text" id="NewLarpPage-name" required />
              <FormText>{larpT.attributes.name.helpText}</FormText>
            </div>

            <div className="form-group mb-3">
              <FormLabel htmlFor="NewLarpPage-tagline">
                {larpT.attributes.tagline.label}
              </FormLabel>
              <FormControl type="text" id="NewLarpPage-tagline" />
              <FormText>{larpT.attributes.tagline.helpText}</FormText>
            </div>

            <div className="row">
              <div className="form-group mb-3 col-md-6">
                <FormLabel htmlFor="NewLarpPage-locationText">
                  {larpT.attributes.locationText.label}
                </FormLabel>
                <FormControl
                  type="text"
                  id="NewLarpPage-locationText"
                  name="locationText"
                />
                <FormText>{larpT.attributes.locationText.helpText}</FormText>
              </div>

              <div className="form-group mb-3 col-md-6">
                <FormLabel htmlFor="NewLarpPage-language">
                  {larpT.attributes.language.label}*
                </FormLabel>
                <FormSelect
                  id="NewLarpPage-language"
                  name="language"
                  required
                  defaultValue={locale}
                >
                  <option value=""></option>
                  {Object.entries(larpT.attributes.language.choices).map(
                    ([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    )
                  )}
                </FormSelect>
                <FormText>{larpT.attributes.language.helpText}</FormText>
              </div>
            </div>

            <div className="row">
              <div className="form-group col-md-6 mb-3">
                <FormLabel htmlFor="NewLarpPage-startsAt">
                  {larpT.attributes.startsAt.label}
                </FormLabel>
                <FormControl
                  type="date"
                  id="NewLarpPage-startsAt"
                  name="startsAt"
                />
                <FormText>{larpT.attributes.startsAt.helpText}</FormText>
              </div>

              <div className="form-group col-md-6 mb-3">
                <FormLabel htmlFor="NewLarpPage-endsAt">
                  {larpT.attributes.endsAt.label}
                </FormLabel>
                <FormControl
                  type="date"
                  id="NewLarpPage-endsAt"
                  name="endsAt"
                />
                <FormText>{larpT.attributes.endsAt.helpText}</FormText>
              </div>
            </div>

            <div className="form-group mb-3">
              <FormLabel htmlFor="NewLarpPage-fluffText">
                {larpT.attributes.fluffText.label}
              </FormLabel>
              <FormControl
                as="textarea"
                id="NewLarpPage-fluffText"
                name="fluffText"
                rows={5}
              />
              <FormText>{larpT.attributes.fluffText.helpText}</FormText>
            </div>
            <div className="form-group mb-1">
              <FormLabel htmlFor="NewLarpPage-description">
                {larpT.attributes.description.label}
              </FormLabel>
              <FormControl
                as="textarea"
                id="NewLarpPage-description"
                name="description"
                rows={5}
              />
              <FormText>{larpT.attributes.description.helpText}</FormText>
            </div>
          </CardBody>
        </Card>

        <Card className="mb-5">
          <CardBody>
            <CardTitle>{t.sections.submit.title}</CardTitle>
            <div className="mb-4">{t.sections.submit.message}</div>

            <div className="form-group mb-3">
              <FormLabel htmlFor="NewLarpPage-submit-message">
                {t.sections.submit.attributes.message.label}
              </FormLabel>
              <FormControl
                as="textarea"
                id="NewLarpPage-submit-message"
                name="message"
                rows={5}
              />
              <FormText>
                {t.sections.submit.attributes.message.helpText}
              </FormText>
            </div>

            <div className="form-group mb-5">
              <FormLabel htmlFor="NewLarpPage-submit-cat">
                {t.sections.submit.attributes.cat.label}*
              </FormLabel>
              <FormControl id="NewLarpPage-submit-cat" name="cat" required />
              <FormText>{t.sections.submit.attributes.cat.helpText}</FormText>
            </div>

            <div className="d-flex mb-2">
              <SubmitButton className="btn btn-primary btn-lg flex-grow-1">
                {t.actions.submit}
              </SubmitButton>
            </div>
          </CardBody>
        </Card>
      </Form>
    </Container>
  );
}
