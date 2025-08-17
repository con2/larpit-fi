import MainHeading from "@/components/MainHeading";
import { getTranslations } from "@/translations";
import { Card, CardBody, CardTitle } from "react-bootstrap";
import Container from "react-bootstrap/Container";

interface Props {
  params: Promise<{
    locale: string;
  }>;
}

export default async function NewLarpVerificationPage({ params }: Props) {
  const { locale } = await params;

  const translations = getTranslations(locale);
  const t = translations.NewLarpPage;

  return (
    <Container>
      <MainHeading>{t.title}</MainHeading>
      <Card>
        <CardBody>
          <CardTitle>{t.subpages.verificationRequired.title}</CardTitle>
          {t.subpages.verificationRequired.message}
        </CardBody>
      </Card>
    </Container>
  );
}
