import { auth } from "@/auth";
import { PrivacyPolicyLink, ProfileLink } from "@/components/ExternalLinks";
import { LogoutLink } from "@/components/LoginLink";
import { contactPageSlug, pickPageLanguage } from "@/models/Page.client";
import { getUserFromSession } from "@/models/User";
import { db } from "@/prisma/db";
import { getReader } from "@/prisma/reader";
import { getTranslations } from "@/translations";
import type { Metadata } from "next";
import { cache } from "react";
import PagePage from "../page/PagePage";
import styles from "./page.module.scss";
import { SubmitButton } from "@con2/components";
import {
  Card,
  CardBody,
  CardTitle,
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

const getContactPage = cache(async (language: string) => {
  const { db: reader } = await getReader();
  const pages = await reader.orm.public.Page.include("headerImage")
    .where({ slug: contactPageSlug })
    .all();
  return pickPageLanguage(pages, language);
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const page = await getContactPage(locale);
  return {
    title: page?.title || getTranslations(locale).ContactPage.title,
    description: page?.ingress || undefined,
  };
}

// TODO implement form handling
const contactFormEnabled = false;

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  const translations = getTranslations(locale);
  const t = translations.ContactPage;
  const userT = translations.User;
  const requesT = translations.ModerationRequest;
  const newT = translations.NewLarpPage;

  const session = await auth();
  const user = await getUserFromSession(session);

  const page = await getContactPage(locale);
  const roles = await db.orm.public.User.where((u) =>
    u.role.in(["ADMIN", "MODERATOR"]),
  )
    .select("id", "name", "role", "titleFi", "titleEn")
    .orderBy([(u) => u.role.desc(), (u) => u.name.asc()])
    .all();

  return (
    <PagePage page={page} locale={locale}>
      <div className="lf-container">
        <section className={styles.team}>
          <ul className={styles.teamList}>
            {roles.map((role) => (
              <li key={role.id} className={styles.member}>
                <span className="lf-title">{role.name}</span>
                <span className={styles.memberTitle}>
                  {getUserTitleInLanguage(role, locale) ||
                    userT.attributes.role.choices[role.role].title}
                </span>
              </li>
            ))}
          </ul>
        </section>
        {contactFormEnabled && (
          <>
            <div className="mb-4">{t.contactForm}</div>
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
                        <PrivacyPolicyLink>
                          tietosuojaselosteessa
                        </PrivacyPolicyLink>{" "}
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
                      Oikean sivun tunnistamista helpottamaan pyydämme
                      syöttämään tähän larppisivun URL-osoitteen, jos
                      mahdollista (selaimen osoiteriviltä tai mobiiliselaimessa{" "}
                      <em>Jaa &rarr; Kopioi osoite</em>). Voit myös kirjoittaa
                      tähän larpin nimen tai muita tietoja, jotka auttavat meitä
                      tunnistamaan oikean sivun. Koko sivustoa koskevissa
                      asioissa voit jättää kentän tyhjäksi.
                    </FormText>
                  </div>

                  <div className="form-group mb-4">
                    <FormLabel htmlFor="ContactForm-message">
                      Viestisi*
                    </FormLabel>
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
          </>
        )}
      </div>
    </PagePage>
  );
}
