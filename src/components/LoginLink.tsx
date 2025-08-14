"use client";

import { signIn, signOut } from "next-auth/react";
import { ReactNode } from "react";

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
