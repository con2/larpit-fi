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
}

export default function LarpLinksFormComponent({ translations, links }: Props) {
  const t = translations.NewLarpPage;
  const larpT = translations.Larp;

  const larpLinksForm = larpLinksToForm(links || []);

  return (
    <Card className="mb-4">
      <CardBody>
        <CardTitle>{t.sections.links.title}</CardTitle>
        {t.sections.links.message}
        {Object.entries(larpT.attributes.links.types).map(
          ([type, { title, helpText }]) => {
            const name = `links_${type}`;
            const value =
              (larpLinksForm as Record<string, string | undefined>)[type] || "";

            return (
              <div key={type} className={`form-group mt-3`}>
                <FormLabel htmlFor={`LarpLinksFormComponent-link-${type}`}>
                  {title}
                </FormLabel>
                <FormControl
                  type="url"
                  id={`LarpLinksFormComponent-link-${type}`}
                  name={name}
                  defaultValue={value}
                />
                <FormText>{helpText}</FormText>
              </div>
            );
          }
        )}
      </CardBody>
    </Card>
  );
}
