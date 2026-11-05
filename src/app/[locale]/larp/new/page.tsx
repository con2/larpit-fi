import { auth } from "@/auth";
import { LarpBasicInfoFormComponent } from "@/components/LarpBasicInfoFormComponent";
import LarpFormSidebar from "@/components/LarpFormSidebar";
import LarpLinksManager from "@/components/LarpLinksManager";
import LarpLocationFormComponent from "@/components/LarpLocationFormComponent";
import { LarpPageContentFormComponent } from "@/components/LarpPageContentFormComponent";
import { LarpSignupInfoFormComponent } from "@/components/LarpSignupInfoFormComponent";
import { LarpTimeFormComponent } from "@/components/LarpTimeFormComponent";
import { FormSection } from "@/components/FormSection";
import PrivacyFormComponent from "@/components/PrivacyFormComponent";
import SubmitterFormComponent from "@/components/SubmitterFormComponent";
import YoureAlmostReadyFormComponent from "@/components/YoureAlmostReadyFormComponent";
import styles from "@/components/LarpForm.module.scss";
import { getUserFromSession } from "@/models/User";
import { getTranslations, toSupportedLanguage } from "@/translations";
import Link from "next/link";
import type { ReactNode } from "react";
import Form from "react-bootstrap/Form";
import { createLarp } from "./actions";

interface Props {
  params: Promise<{
    locale: string;
  }>;
}

const formId = "NewLarpPage-form";

function SearchLink({ children }: { children: ReactNode }) {
  return <Link href="/search">{children}</Link>;
}

export default async function NewLarpPage({ params }: Props) {
  const resolvedParams = await params;
  const locale = toSupportedLanguage(resolvedParams.locale);

  const translations = getTranslations(locale);
  const t = translations.NewLarpPage;

  const session = await auth();
  const user = await getUserFromSession(session);

  return (
    <>
      <header className="lf-page-header lf-container">
        <p className="lf-eyebrow">{t.eyebrow}</p>
        <h1 className="lf-display-l">{t.title}</h1>
        <p className={styles.pageIntro}>{t.message}</p>
      </header>

      <div className={`lf-container ${styles.layout}`}>
        <Form
          id={formId}
          className={styles.form}
          action={createLarp.bind(null, locale)}
        >
          <SubmitterFormComponent
            user={user}
            role={null}
            translations={translations}
          >
            <PrivacyFormComponent translations={translations} />
          </SubmitterFormComponent>

          <LarpBasicInfoFormComponent
            translations={translations}
            locale={locale}
            larp={null}
          />
          <LarpTimeFormComponent
            translations={translations}
            locale={locale}
            larp={null}
          >
            <LarpLocationFormComponent
              translations={translations}
              locale={locale}
              larp={null}
            />
          </LarpTimeFormComponent>
          <LarpSignupInfoFormComponent
            translations={translations}
            locale={locale}
            larp={null}
          />
          <LarpPageContentFormComponent
            translations={translations}
            locale={locale}
            larp={null}
          />
          <FormSection
            id="links"
            title={t.sections.links.title}
            intro={t.sections.links.message}
          >
            <LarpLinksManager
              messages={{ links: translations.Larp.attributes.links }}
            />
          </FormSection>
          <YoureAlmostReadyFormComponent
            translations={translations}
            user={user}
          />
        </Form>

        <LarpFormSidebar
          formId={formId}
          translations={translations}
          locale={locale}
          sections={[
            { id: "who", title: t.sections.contact.title },
            { id: "basics", title: t.sections.larp.title },
            { id: "when", title: t.sections.time.title },
            { id: "signup", title: t.sections.signup.title },
            { id: "content", title: t.sections.content.title },
            { id: "links", title: t.sections.links.title },
          ]}
        >
          <section className={styles.asideBlock}>
            <h2 className="lf-label">{t.alreadyListed.title}</h2>
            <p>{t.alreadyListed.message(SearchLink)}</p>
          </section>
        </LarpFormSidebar>
      </div>
    </>
  );
}
