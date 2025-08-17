import {
  Card,
  CardBody,
  CardText,
  CardTitle,
  Container,
} from "react-bootstrap";

interface Props {
  messages: {
    title: string;
    message: string;
  };
}

export default function InsufficientPrivileges({ messages: t }: Props) {
  return (
    <Container>
      <Card className="mb-4">
        <CardBody>
          <CardTitle>{t.title}</CardTitle>
          <CardText>{t.message}</CardText>
        </CardBody>
      </Card>
    </Container>
  );
}
