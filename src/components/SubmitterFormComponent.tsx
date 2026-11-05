import type { ReactNode } from "react";
import { FormControl, FormLabel, FormText } from "react-bootstrap";
import { ProfileLink } from "./ExternalLinks";
import { FormSection, RadioGroup, RequiredMark } from "./FormSection";
import LoginLink, { LogoutLink } from "./LoginLink";
import type { Translations } from "@/translations/en";
import { SubmitterRole } from "@/prisma/enums";
import styles from "./LarpForm.module.scss";

interface Props {
  user: {
    email: string;
    name: string | null;
  } | null;
  role: SubmitterRole | null;
  translations: Translations;
  compact?: boolean;
  /** Rendered at the end of the section, such as the privacy consent. */
  children?: ReactNode;
}

export default function SubmitterFormComponent({
  user,
  role,
  translations,
  compact,
  children,
}: Props) {
  const t = translations.NewLarpPage;
  const requesT = translations.ModerationRequest;
  const roleT = requesT.attributes.submitterRole;

  const roleField = (
    <RadioGroup
      idPrefix="SubmitterFormComponent-submitterRole"
      name="submitterRole"
      legend={roleT.label}
      defaultValue={role}
      required
      variant={compact ? "pill" : "card"}
      choices={Object.entries(roleT.choices).map(([key, { title, label }]) =>
        compact
          ? { value: key, title }
          : { value: key, title, description: label },
      )}
    />
  );

  if (compact) {
    return (
      <FormSection id="who" compact>
        {roleField}
      </FormSection>
    );
  }

  return (
    <FormSection
      id="who"
      title={t.sections.contact.title}
      intro={
        user
          ? t.sections.contact.loggedIn(LogoutLink, ProfileLink)
          : t.sections.contact.notLoggedIn(LoginLink)
      }
    >
      <div className={styles.grid2}>
        <div className={styles.field}>
          {user ? (
            <>
              <div className="form-label">
                {requesT.attributes.submitterName.label}
              </div>
              <div className={styles.staticValue}>{user.name}</div>
            </>
          ) : (
            <>
              <FormLabel htmlFor="SubmitterFormComponent-submitterName">
                {requesT.attributes.submitterName.label}
                <RequiredMark />
              </FormLabel>
              <FormControl
                type="text"
                name="submitterName"
                id="SubmitterFormComponent-submitterName"
                autoComplete="name"
                required
              />
              <FormText>{requesT.attributes.submitterName.helpText}</FormText>
            </>
          )}
        </div>

        <div className={styles.field}>
          {user ? (
            <>
              <div className="form-label">
                {requesT.attributes.submitterEmail.label}
              </div>
              <div className={`${styles.staticValue} lf-data`}>
                {user.email}
              </div>
            </>
          ) : (
            <>
              <FormLabel htmlFor="SubmitterFormComponent-submitterEmail">
                {requesT.attributes.submitterEmail.label}
                <RequiredMark />
              </FormLabel>
              <FormControl
                type="email"
                name="submitterEmail"
                id="SubmitterFormComponent-submitterEmail"
                autoComplete="email"
                required
              />
              <FormText>{requesT.attributes.submitterEmail.helpText}</FormText>
            </>
          )}
        </div>
      </div>

      {roleField}
      {children}
    </FormSection>
  );
}
