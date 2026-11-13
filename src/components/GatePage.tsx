import Link from "next/link";

import { contentPagePath } from "@/models/Page.client";
import type { Translations } from "@/translations/en";

import SignInButton from "./SignInButton";
import HeroMessage, { heroActionClasses } from "./ui/HeroMessage";

/** A way onwards from a page the visitor may not see. */
export interface GateAction {
  href: string;
  label: string;
}

interface GateMessages {
  eyebrow: string;
  title: string;
  message: string;
}

/**
 * Links that make sense where a gate stands. A gate offers the one or two that fit its page:
 * the larp or content page the visitor came for, and contact for asking for rights.
 */
export function gateActions(translations: Translations) {
  return {
    frontPage: { href: "/", label: translations.NotFoundPage.frontPage },
    allLarps: { href: "/larp", label: translations.Larp.listTitle },
    contact: { href: "/contact", label: translations.ContactPage.title },
    larp: (larpId: string) => ({
      href: `/larp/${larpId}`,
      label: translations.Common.actions.returnToLarpPage.title,
    }),
    claimLarp: (larpId: string) => ({
      href: `/larp/${larpId}/edit?role=GAME_MASTER`,
      label: translations.LarpPage.actions.claim,
    }),
    page: (slug: string, language: string) => ({
      href: contentPagePath(slug, language),
      label: translations.GatePage.backToPage,
    }),
  } satisfies Record<string, GateAction | ((...args: string[]) => GateAction)>;
}

function GateActionLinks({
  actions,
  hasPrimary,
}: {
  actions: GateAction[];
  hasPrimary: boolean;
}) {
  const classes = hasPrimary
    ? [heroActionClasses.secondary]
    : [heroActionClasses.primary, heroActionClasses.secondary];
  return actions.map((action, index) => {
    const className = classes[index] ?? heroActionClasses.quiet;
    return (
      <Link key={action.href} href={action.href} className={className}>
        {action.label}
        {className === heroActionClasses.quiet && " →"}
      </Link>
    );
  });
}

/** The whole page, when it needs a signed-in visitor. Sign-in comes back to this page. */
export function LoginRequiredPage({
  messages: t,
  actions,
}: {
  messages: Translations["LoginRequired"];
  actions: GateAction[];
}) {
  return (
    <HeroMessage eyebrow={t.eyebrow} title={t.title} lede={t.message}>
      <SignInButton className={heroActionClasses.primary}>
        {t.actions.login}
      </SignInButton>
      <GateActionLinks actions={actions} hasPrimary />
    </HeroMessage>
  );
}

/** The whole page, when the signed-in visitor lacks the rights to see it. */
export function AccessDeniedPage({
  messages: t,
  actions,
}: {
  messages: GateMessages;
  actions: GateAction[];
}) {
  return (
    <HeroMessage eyebrow={t.eyebrow} title={t.title} lede={t.message}>
      <GateActionLinks actions={actions} hasPrimary={false} />
    </HeroMessage>
  );
}
