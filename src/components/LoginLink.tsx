"use client";

import { signIn, signOut } from "next-auth/react";
import { ReactNode } from "react";
import MaybeExternalLink from "./MaybeExternalLink";
import { kompassiProfileUrl, privacyPolicyUrl } from "@/config";

export function LoginLink({ children }: { children: ReactNode }) {
  return (
    <a href="#" onClick={() => signIn("kompassi")}>
      {children}
    </a>
  );
}

export default LoginLink;

export function LogoutLink({ children }: { children: ReactNode }) {
  return (
    <a href="#" onClick={() => signOut()}>
      {children}
    </a>
  );
}

export function PrivacyPolicyLink({ children }: { children: ReactNode }) {
  return (
    <MaybeExternalLink href={privacyPolicyUrl}>{children}</MaybeExternalLink>
  );
}

export function SubtlePrivacyPolicyLink({ children }: { children: ReactNode }) {
  return (
    <MaybeExternalLink href={privacyPolicyUrl} className="link-subtle">
      {children}
    </MaybeExternalLink>
  );
}

export function ProfileLink({ children }: { children: ReactNode }) {
  return (
    <a href={kompassiProfileUrl} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}
