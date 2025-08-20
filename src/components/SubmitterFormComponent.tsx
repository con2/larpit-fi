import {
  Card,
  CardBody,
  CardTitle,
  FormControl,
  FormLabel,
  FormSelect,
  FormText,
} from "react-bootstrap";
import LoginLink, { LogoutLink, ProfileLink } from "./LoginLink";
import type { Translations } from "@/translations/en";
import { SubmitterRole } from "@/generated/prisma";

interface Props {
  user: {
    email: string;
    name: string | null;
  } | null;
  role: SubmitterRole | null;
  translations: Translations;
}

export default function SubmitterFormComponent({
  user,
  role,
  translations,
}: Props) {
  const t = translations.NewLarpPage;
  const requesT = translations.ModerationRequest;

  return (
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
                <FormLabel htmlFor="SubmitterFormComponent-submitterName">
                  {requesT.attributes.submitterName.label}*
                </FormLabel>
                <FormControl
                  type="text"
                  name="submitterName"
                  id="SubmitterFormComponent-submitterName"
                  required
                />
                <FormText>{requesT.attributes.submitterName.helpText}</FormText>
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
                <FormText>
                  {requesT.attributes.submitterEmail.helpText}
                </FormText>
              </>
            )}
          </div>
        </div>

        <div className="form-group mb-1">
          <FormLabel htmlFor="SubmitterFormComponent-submitterRole">
            {requesT.attributes.submitterRole.label}*
          </FormLabel>
          <FormSelect
            id="SubmitterFormComponent-submitterRole"
            name="submitterRole"
            defaultValue={role ?? undefined}
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
  );
}
