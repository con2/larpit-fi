import LarpSubpage from "@/components/larp-page/LarpSubpage";
import { getTranslations } from "@/translations";
import Link from "next/link";
import { Card, CardBody, CardTitle } from "react-bootstrap";

interface Props {
  params: Promise<{
    locale: string;
  }>;
}

export default async function NewLarpThanksPage({ params }: Props) {
  const { locale } = await params;

  const translations = getTranslations(locale);
  const t = translations.NewLarpPage;
  const ediT = translations.EditLarpPage;

  return (
    <LarpSubpage title={ediT.title}>
      <Card>
        <CardBody>
          <CardTitle>{t.subpages.thanks.title}</CardTitle>
          {t.subpages.thanks.message}
          <div>
            <Link className="btn btn-primary mt-3" href="/">
              {t.subpages.thanks.backToFrontPage}
            </Link>
          </div>
        </CardBody>
      </Card>
    </LarpSubpage>
  );
}
