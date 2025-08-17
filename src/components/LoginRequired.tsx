"use client";

import { signIn } from "next-auth/react";
import {
  Button,
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
    actions: {
      login: string;
    };
  };
}

export default function LoginRequired({ messages: t }: Props) {
  return (
    <Container>
      <Card className="mb-4">
        <CardBody>
          <CardTitle>{t.title}</CardTitle>
          <CardText className="mb-4">{t.message}</CardText>
          <Button variant="primary" onClick={() => signIn("kompassi")}>
            {t.actions.login}
          </Button>
        </CardBody>
      </Card>
    </Container>
  );
}
