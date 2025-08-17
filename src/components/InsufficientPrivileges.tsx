import { Card, CardBody, CardText, CardTitle } from "react-bootstrap";

interface Props {
  messages: {
    title: string;
    message: string;
  };
}

export default function InsufficientPrivileges({ messages: t }: Props) {
  return (
    <Card className="mb-4">
      <CardBody>
        <CardTitle>{t.title}</CardTitle>
        <CardText className="mb-4">{t.message}</CardText>
      </CardBody>
    </Card>
  );
}
