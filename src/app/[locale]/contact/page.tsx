import { auth } from "@/auth";
import {
  LogoutLink,
  PrivacyPolicyLink,
  ProfileLink,
} from "@/components/LoginLink";
import MainHeading from "@/components/MainHeading";
import SubmitButton from "@/components/SubmitButton";
import { getUserFromSession } from "@/models/User";
import prisma from "@/prisma";
import { getTranslations } from "@/translations";
import {
  Card,
  CardBody,
  CardText,
  CardTitle,
  Container,
  Form,
  FormCheck,
  FormControl,
  FormLabel,
  FormSelect,
  FormText,
  Row,
} from "react-bootstrap";

interface Props {
  params: Promise<{ locale: string }>;
}

function getUserTitleInLanguage(user: any, locale: string) {
  switch (locale) {
    case "fi":
      return user.titleFi;
    default:
      return user.titleEn;
  }
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  const translations = getTranslations(locale);
  const t = translations.ContactPage;
  const userT = translations.User;
  const requesT = translations.ModerationRequest;
  const newT = translations.NewLarpPage;

  const session = await auth();
  const user = await getUserFromSession(session);

  const roles = await prisma.user.findMany({
    where: {
      role: {
        in: ["ADMIN", "MODERATOR"],
      },
    },
    select: {
      id: true,
      name: true,
      role: true,
      titleFi: true,
      titleEn: true,
    },
    orderBy: [{ role: "desc" }, { name: "asc" }],
  });

  return (
    <Container>
      <MainHeading>{t.title}</MainHeading>
      <p className="text-center">{t.teamConsistsOf}</p>
      <Row className="mb-5">
        {roles.map((role) => (
          <div key={role.id} className="col-md-4">
            <Card className="mb-4">
              <CardBody>
                <CardTitle>{role.name}</CardTitle>
                <CardText>
                  {getUserTitleInLanguage(role, locale) ||
                    userT.attributes.role.choices[role.role].title}
                </CardText>
              </CardBody>
            </Card>
          </div>
        ))}
      </Row>
      <div className="text-center mb-4">{t.contactForm}</div>
      <Card className="mb-5">
        <CardBody>
          <CardTitle>{t.title}</CardTitle>

          {user ? (
            <div className="mb-4">
              {newT.sections.contact.loggedIn(LogoutLink, ProfileLink)}
            </div>
          ) : null}

          <Form>
            <Row>
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
                    <FormLabel htmlFor="SubmitterFormComponent-submitterName">
                      {requesT.attributes.submitterName.label}*
                    </FormLabel>
                    <FormControl
                      type="text"
                      name="submitterName"
                      id="SubmitterFormComponent-submitterName"
                      required
                    />
                  </>
                )}
              </div>

              <div className="form-group col-md-6 mb-3">
                {user ? (
                  <>
                    <div className="form-label">
                      {requesT.attributes.submitterEmail.label}
                    </div>
                    <div>
                      <em>{user.email}</em>
                    </div>
                  </>
                ) : (
                  <>
                    <FormLabel htmlFor="SubmitterFormComponent-submitterEmail">
                      {requesT.attributes.submitterEmail.label}*
                    </FormLabel>
                    <FormControl
                      type="email"
                      name="submitterEmail"
                      id="SubmitterFormComponent-submitterEmail"
                      required
                    />
                  </>
                )}
              </div>
            </Row>

            <FormCheck
              type="checkbox"
              className="mb-4"
              id="ContactForm-consent"
              label={
                <>
                  Annan suostumukseni henkilötietojeni käyttöön{" "}
                  <PrivacyPolicyLink>tietosuojaselosteessa</PrivacyPolicyLink>{" "}
                  kuvatulla tavalla.*
                </>
              }
              required
            />

            <div className="form-group mb-3">
              <FormLabel htmlFor="ContactForm-reason">
                Syy yhteydenottoon*
              </FormLabel>
              <FormSelect id="ContactForm-reason" name="reason" required>
                <option value=""></option>
                <option value="SUPPORT">
                  Tarvitsen apua sivuston käytössä
                </option>
                <option value="FEEDBACK">
                  Haluan antaa palautetta sivustosta
                </option>
                <option value="CONTENT_ISSUE">
                  Haluan ilmoittaa virheestä tai puutteesta sisällössä
                </option>
                <option value="REMOVAL">
                  Haluan, että sivustolla oleva larppisivu poistetaan
                </option>
                <option value="EXPERT">
                  Olen toimittaja, tutkija tmv. ja haluan keskustella
                  larppaamisesta asiantuntijan kanssa
                </option>
                <option value="OTHER">Muu syy</option>
              </FormSelect>
            </div>

            <div className="form-group mb-4">
              <FormLabel htmlFor="ContactForm-context">
                Larppi tai sivu, jota asia koskee
              </FormLabel>
              <FormControl
                type="text"
                name="context"
                id="ContactForm-context"
                required
              />
              <FormText>
                Oikean sivun tunnistamista helpottamaan pyydämme syöttämään
                tähän larppisivun URL-osoitteen, jos mahdollista (selaimen
                osoiteriviltä tai mobiiliselaimessa{" "}
                <em>Jaa &rarr; Kopioi osoite</em>). Voit myös kirjoittaa tähän
                larpin nimen tai muita tietoja, jotka auttavat meitä
                tunnistamaan oikean sivun. Koko sivustoa koskevissa asioissa
                voit jättää kentän tyhjäksi.
              </FormText>
            </div>

            <div className="form-group mb-4">
              <FormLabel htmlFor="ContactForm-message">Viestisi*</FormLabel>
              <FormControl
                id="ContactForm-message"
                name="content"
                as={"textarea"}
                rows={5}
                required
              />
            </div>

            {user ? null : (
              <div className="form-group mb-4">
                <FormLabel htmlFor="ContactForm-cat">
                  {newT.sections.submit.attributes.cat.label}*
                </FormLabel>
                <FormControl id="ContactForm-cat" name="cat" required />
                <FormText>{newT.sections.submit.notLoggedIn}</FormText>
              </div>
            )}

            <div className="d-flex mb-2">
              <SubmitButton className="btn btn-primary btn-lg flex-grow-1">
                {newT.actions.submit}
              </SubmitButton>
            </div>
          </Form>
        </CardBody>
      </Card>
      <div className="text-center mb-4">{t.administrative}</div>
    </Container>
  );
}
