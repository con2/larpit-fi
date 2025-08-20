import { auth } from "@/auth";
import {
  LoginLink,
  LogoutLink,
  PrivacyPolicyLink,
  ProfileLink,
} from "@/components/LoginLink";
import MainHeading from "@/components/MainHeading";
import SubmitButton from "@/components/SubmitButton";
import { getTranslations, toSupportedLanguage } from "@/translations";
import { FormCheck, FormSelect, FormText } from "react-bootstrap";
import Card from "react-bootstrap/Card";
import CardBody from "react-bootstrap/CardBody";
import CardTitle from "react-bootstrap/CardTitle";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import FormControl from "react-bootstrap/FormControl";
import FormLabel from "react-bootstrap/FormLabel";
import { createLarp } from "./actions";
import prisma from "@/prisma";

interface Props {
  params: Promise<{
    locale: string;
  }>;
}

export default async function NewLarpPage({ params }: Props) {
  const resolvedParams = await params;
  const locale = toSupportedLanguage(resolvedParams.locale);

  const translations = getTranslations(locale);
  const t = translations.NewLarpPage;
  const larpT = translations.Larp;
  const requesT = translations.ModerationRequest;

  const session = await auth();
  const user = session?.user?.email
    ? await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { name: true, role: true, email: true },
      })
    : null;

  return (
    <Container>
      <MainHeading>{t.title}</MainHeading>
      <div className="text-center mb-5">{t.message}</div>
      <Form action={createLarp.bind(null, locale)}>
        {/* Who are you? */}
        <Card className="mb-4">
          <CardBody>
            <CardTitle>{t.sections.contact.title}</CardTitle>
            <div className="mb-4">
              {user
                ? t.sections.contact.loggedIn(LogoutLink, ProfileLink)
                : t.sections.contact.notLoggedIn(LoginLink)}
            </div>
            <div className="row">
              <div className="form-group col-md-6 mb-3">
                {user ? (
                  <>
                    <div className="form-label">
                      {requesT.attributes.submitterName.label}
                    </div>
                    <div>{user.name}</div>
                  </>
                ) : (
                  <>
                    <FormLabel htmlFor="NewLarpPage-submitterName">
                      {requesT.attributes.submitterName.label}*
                    </FormLabel>
                    <FormControl
                      type="text"
                      name="submitterName"
                      id="NewLarpPage-submitterName"
                      required
                    />
                    <FormText>
                      {requesT.attributes.submitterName.helpText}
                    </FormText>
                  </>
                )}
              </div>

              <div className="form-group col-md-6 mb-3">
                {user ? (
                  <>
                    <div className="form-label">
                      {requesT.attributes.submitterEmail.label}
                    </div>
                    <div>{user.email}</div>
                  </>
                ) : (
                  <>
                    <FormLabel htmlFor="NewLarpPage-submitterEmail">
                      {requesT.attributes.submitterEmail.label}*
                    </FormLabel>
                    <FormControl
                      type="email"
                      name="submitterEmail"
                      id="NewLarpPage-submitterEmail"
                      required
                    />
                    <FormText>
                      {requesT.attributes.submitterEmail.helpText}
                    </FormText>
                  </>
                )}
              </div>
            </div>

            <div className="form-group mb-1">
              <FormLabel htmlFor="NewLarpPage-submitterRole">
                {requesT.attributes.submitterRole.label}*
              </FormLabel>
              <FormSelect
                id="NewLarpPage-submitterRole"
                name="submitterRole"
                required
              >
                <option value=""></option>
                {Object.entries(requesT.attributes.submitterRole.choices).map(
                  ([key, { label }]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  )
                )}
              </FormSelect>
            </div>
          </CardBody>
        </Card>

        {/* We care about your privacy */}
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

        {/* Details about the larp */}
        <Card className="mb-4">
          <CardBody>
            <CardTitle>{t.sections.larp.title}</CardTitle>
            <div className="mb-4">{t.sections.larp.message}</div>

            <div className="form-group mb-3">
              <FormLabel htmlFor="NewLarpPage-name">
                {larpT.attributes.name.label}*
              </FormLabel>
              <FormControl
                type="text"
                id="NewLarpPage-name"
                name="name"
                required
              />
              <FormText>{larpT.attributes.name.helpText}</FormText>
            </div>

            <div className="form-group mb-3">
              <FormLabel htmlFor="NewLarpPage-tagline">
                {larpT.attributes.tagline.label}
              </FormLabel>
              <FormControl
                type="text"
                id="NewLarpPage-tagline"
                name="tagline"
              />
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

            <div className="row">
              <div className="form-group col-md-6 mb-3">
                <FormLabel htmlFor="NewLarpPage-signupStartsAt">
                  {larpT.attributes.signupStartsAt.label}
                </FormLabel>
                <FormControl
                  type="date"
                  id="NewLarpPage-signupStartsAt"
                  name="signupStartsAt"
                />
                <FormText>{larpT.attributes.signupStartsAt.helpText}</FormText>
              </div>

              <div className="form-group col-md-6 mb-3">
                <FormLabel htmlFor="NewLarpPage-signupEndsAt">
                  {larpT.attributes.signupEndsAt.label}
                </FormLabel>
                <FormControl
                  type="date"
                  id="NewLarpPage-signupEndsAt"
                  name="signupEndsAt"
                />
                <FormText>{larpT.attributes.signupEndsAt.helpText}</FormText>
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

        {/* Links */}
        <Card className="mb-4">
          <CardBody>
            <CardTitle>{t.sections.links.title}</CardTitle>
            {t.sections.links.message}
            {Object.entries(larpT.attributes.links.types).map(
              ([key, { title, helpText }]) => (
                <div key={key} className={`form-group mt-3`}>
                  <FormLabel htmlFor={`NewLarpPage-link-${key}`}>
                    {title}
                  </FormLabel>
                  <FormControl
                    type="url"
                    id={`NewLarpPage-link-${key}`}
                    name={`links_${key}`}
                  />
                  <FormText>{helpText}</FormText>
                </div>
              )
            )}
          </CardBody>
        </Card>

        {/* You're almost ready! */}
        <Card className="mb-5">
          <CardBody>
            <CardTitle>{t.sections.submit.title}</CardTitle>
            <div className="mb-4">
              {t.sections.submit.message}
              {user ? null : t.sections.submit.notLoggedIn}
            </div>

            <div className="form-group mb-3">
              <FormLabel htmlFor="NewLarpPage-submit-message">
                {requesT.attributes.message.label}
              </FormLabel>
              <FormControl
                as="textarea"
                id="NewLarpPage-submit-message"
                name="message"
                rows={5}
              />
              <FormText>{requesT.attributes.message.helpText}</FormText>
            </div>

            {user ? null : (
              <div className="form-group mb-5">
                <FormLabel htmlFor="NewLarpPage-submit-cat">
                  {t.sections.submit.attributes.cat.label}*
                </FormLabel>
                <FormControl id="NewLarpPage-submit-cat" name="cat" required />
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
      </Form>
    </Container>
  );
}
