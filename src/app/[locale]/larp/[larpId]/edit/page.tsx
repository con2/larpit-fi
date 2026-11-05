import { auth } from "@/auth";
import CompactLarpFormComponent from "@/components/CompactLarpFormComponent";
import { LarpBasicInfoFormComponent } from "@/components/LarpBasicInfoFormComponent";
import LarpCancelledFormComponent from "@/components/LarpCancelledFormComponent";
import LarpLinksManager from "@/components/LarpLinksManager";
import LarpLocationFormComponent from "@/components/LarpLocationFormComponent";
import { LarpPageContentFormComponent } from "@/components/LarpPageContentFormComponent";
import { LarpSignupInfoFormComponent } from "@/components/LarpSignupInfoFormComponent";
import { LarpTimeFormComponent } from "@/components/LarpTimeFormComponent";
import { LoginRequiredCard } from "@/components/LoginRequiredCard";
import SubmitterFormComponent from "@/components/SubmitterFormComponent";
import { FormSection } from "@/components/FormSection";
import LarpFormSidebar from "@/components/LarpFormSidebar";
import styles from "@/components/LarpForm.module.scss";
import { getLarpHref } from "@/models/Larp.client";
import YoureAlmostReadyFormComponent from "@/components/YoureAlmostReadyFormComponent";
import { EditFormPreference, SubmitterRole } from "@/prisma/enums";
import {
  getEditLarpInitialStatusForUserAndLarp,
  getHighestUserRoleForLarp,
  localSignupRoles,
} from "@/models/User";
import { parseDates } from "@/prisma/dates";
import { db } from "@/prisma/db";
import { getTranslations, toSupportedLanguage } from "@/translations";
import { notFound } from "next/navigation";
import Link from "next/link";
import Form from "react-bootstrap/Form";
import { validate as validateUuid } from "uuid";
import { editLarp, setEditFormPreference } from "./actions";

const formId = "EditLarpPage-form";

interface Props {
  params: Promise<{
    locale: string;
    larpId: string;
  }>;
  searchParams: Promise<{
    role?: string;
  }>;
}

export default async function EditLarpPage({ params, searchParams }: Props) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const locale = toSupportedLanguage(resolvedParams.locale);

  const translations = getTranslations(locale);
  const t = translations.EditLarpPage;

  if (!validateUuid(resolvedParams.larpId)) {
    notFound();
  }

  const session = await auth();
  const [user, larpRow] = await Promise.all([
    session?.user?.id
      ? db.orm.public.User.select(
          "id",
          "name",
          "role",
          "email",
          "editFormPreference",
        ).first({ id: session.user.id })
      : null,
    db.orm.public.Larp.include("links")
      .include("relatedUsers", (r) =>
        r.include("user", (u) => u.select("id", "email")),
      )
      .first({ id: resolvedParams.larpId }),
  ]);
  const larp = larpRow && parseDates(larpRow);
  if (!larp) {
    notFound();
  }

  const highestRole = getHighestUserRoleForLarp(user, larp);
  // LOCAL_SIGNUP_* roles are not valid SubmitterRoles; treat them as NONE for the edit form.
  const role: SubmitterRole | "NONE" =
    resolvedSearchParams.role === "GAME_MASTER"
      ? "GAME_MASTER"
      : (localSignupRoles as readonly string[]).includes(highestRole)
        ? "NONE"
        : (highestRole as SubmitterRole | "NONE");
  const initialStatus = getEditLarpInitialStatusForUserAndLarp(user, larp);
  if (!initialStatus) {
    return (
      <LoginRequiredCard messages={translations.LoginRequired} container />
    );
  }

  const isCompact = user?.editFormPreference === EditFormPreference.COMPACT;
  const newT = translations.NewLarpPage;
  const linksMessages = { links: translations.Larp.attributes.links };

  const form = (
    <Form
      id={formId}
      className={`${styles.form} ${isCompact ? styles.formCompact : ""}`}
      action={editLarp.bind(null, locale, larp.id)}
    >
      {isCompact ? (
        <>
          <SubmitterFormComponent
            user={user}
            role={role}
            translations={translations}
            compact
          />
          <CompactLarpFormComponent
            translations={translations}
            locale={locale}
            larp={larp}
          />
          <FormSection id="links" title={newT.sections.links.title} compact>
            <LarpLinksManager
              messages={linksMessages}
              initialLinks={larp.links}
            />
          </FormSection>
          <YoureAlmostReadyFormComponent
            translations={translations}
            user={user}
            compact
          />
        </>
      ) : (
        <>
          <SubmitterFormComponent
            user={user}
            role={role}
            translations={translations}
          />
          <LarpBasicInfoFormComponent
            translations={translations}
            locale={locale}
            larp={larp}
          />
          <LarpTimeFormComponent
            translations={translations}
            locale={locale}
            larp={larp}
          >
            <LarpLocationFormComponent
              translations={translations}
              locale={locale}
              larp={larp}
            />
          </LarpTimeFormComponent>
          <LarpSignupInfoFormComponent
            translations={translations}
            locale={locale}
            larp={larp}
          />
          <LarpPageContentFormComponent
            translations={translations}
            locale={locale}
            larp={larp}
          />
          <FormSection
            id="links"
            title={newT.sections.links.title}
            intro={newT.sections.links.message}
          >
            <LarpLinksManager
              messages={linksMessages}
              initialLinks={larp.links}
            />
          </FormSection>
          <LarpCancelledFormComponent translations={translations} larp={larp} />
          <YoureAlmostReadyFormComponent
            translations={translations}
            user={user}
          />
        </>
      )}
    </Form>
  );

  return (
    <>
      <header className="lf-container lf-page-header">
        <p className="lf-eyebrow">
          <Link href={getLarpHref(larp)} className="lf-row-link">
            {larp.name}
          </Link>
        </p>
        <h1 className="lf-display-l">{t.title}</h1>
        <p className={styles.pageIntro}>{t.policy[initialStatus]}</p>
      </header>

      <div className={`lf-container ${styles.layout}`}>
        {form}
        {!isCompact && (
          <LarpFormSidebar
            formId={formId}
            translations={translations}
            locale={locale}
            sections={[
              { id: "who", title: newT.sections.contact.title },
              { id: "basics", title: newT.sections.larp.title },
              { id: "when", title: newT.sections.time.title },
              { id: "signup", title: newT.sections.signup.title },
              { id: "content", title: newT.sections.content.title },
              { id: "links", title: newT.sections.links.title },
              { id: "cancelled", title: newT.sections.cancelled.title },
            ]}
          />
        )}
      </div>

      {user && (
        <div className={`lf-container ${styles.formPreference}`}>
          <Form
            action={setEditFormPreference.bind(
              null,
              locale,
              larp.id,
              isCompact ? EditFormPreference.FULL : EditFormPreference.COMPACT,
            )}
          >
            <button className="btn btn-link px-0">
              {isCompact ? t.switchToFullForm : t.switchToCompactForm}
            </button>
          </Form>
        </div>
      )}
    </>
  );
}
