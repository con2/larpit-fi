import MainHeading from "@/components/MainHeading";
import { getTranslations } from "@/translations";
import Link from "next/link";
import { Card, CardBody, CardTitle } from "react-bootstrap";
import Container from "react-bootstrap/Container";

interface Props {
  params: Promise<{
    locale: string;
  }>;
}

export default async function NewLarpThanksPage({ params }: Props) {
  const { locale } = await params;

  const translations = getTranslations(locale);
  const t = translations.NewLarpPage;

  return (
    <Container>
      <MainHeading>{t.title}</MainHeading>
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
    </Container>
  );
}
