"use client";

import { signIn } from "next-auth/react";

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
  const card = (
    <section className="lf-surface mb-4" aria-labelledby="login-required-title">
      <h2 className="lf-surface__title" id="login-required-title">
        {t.title}
      </h2>
      <p className="lf-muted">{t.message}</p>
      <div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => signIn("kompassi")}
        >
          {t.actions.login}
        </button>
      </div>
    </section>
  );

  return container ? <div className="lf-container py-5">{card}</div> : card;
}
