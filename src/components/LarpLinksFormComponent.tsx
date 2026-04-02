import { larpLinksToForm, LarpLinkUpsertable } from "@/models/LarpLink";
import type { Translations } from "@/translations/en";
import {
  Card,
  CardBody,
  CardTitle,
  FormControl,
  FormLabel,
  FormText,
} from "react-bootstrap";

interface Props {
  translations: Translations;
  links?: LarpLinkUpsertable[];
  compact?: boolean;
}

// TODO Implement a component that lets you add multiple links of a type and input a title
// This is just an MVP placeholder
export default function LarpLinksFormComponent({
  translations,
  links,
  compact,
}: Props) {
  const t = translations.NewLarpPage;
  const larpT = translations.Larp;

  const larpLinksForm = larpLinksToForm(links || []);

  return (
    <Card className="mb-4">
      <CardBody>
        {!compact && (
          <>
            <CardTitle>{t.sections.links.title}</CardTitle>
            <div className="mb-4">{t.sections.links.message}</div>
          </>
        )}
        {Object.entries(larpT.attributes.links.types).map(
          ([type, { title, helpText }]) => {
            const name = `links_${type}`;
            const value =
              (larpLinksForm as Record<string, string | undefined>)[name] || "";

            return (
              <div key={type} className={`form-group mb-3`}>
                <FormLabel
                  htmlFor={`LarpLinksFormComponent-link-${type}`}
                  className={compact ? "form-text" : ""}
                >
                  {title}
                </FormLabel>
                <FormControl
                  type="url"
                  id={`LarpLinksFormComponent-link-${type}`}
                  name={name}
                  defaultValue={value}
                />
                {!compact && <FormText>{helpText}</FormText>}
              </div>
            );
          },
        )}
      </CardBody>
    </Card>
  );
}
