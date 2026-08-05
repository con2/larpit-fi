"use client";

import { signIn } from "next-auth/react";
import { MessageCard } from "@con2/components";

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

/// Thin client wrapper around @con2/components' MessageCard for the
/// "please sign in" gate. Kept as its own "use client" component (rather than
/// inlining `action.onAction` at each call site) because most call sites are
/// Server Components, and a function prop (the signIn callback) cannot be
/// passed from a Server Component directly to a Client Component.
export function LoginRequiredCard({ messages: t, container = false }: Props) {
  return (
    <MessageCard
      title={t.title}
      message={t.message}
      action={{ label: t.actions.login, onAction: () => signIn("kompassi") }}
      container={container}
    />
  );
}
