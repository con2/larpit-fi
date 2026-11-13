"use client";

import { signIn } from "next-auth/react";

import { MessageCard } from "./MessageCard";

interface Props {
  messages: {
    title: string;
    message: string;
    actions: {
      login: string;
    };
  };
  container?: boolean;
}

/// The "please sign in" gate. A client component because most call sites are Server
/// Components, which cannot pass the signIn callback to a Client Component.
export function LoginRequiredCard({ messages: t, container = false }: Props) {
  return (
    <MessageCard title={t.title} message={t.message} container={container}>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => signIn("kompassi")}
      >
        {t.actions.login}
      </button>
    </MessageCard>
  );
}
