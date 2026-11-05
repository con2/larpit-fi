"use client";

import { signIn } from "next-auth/react";
import { ReactNode } from "react";

export default function SignInButton({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => signIn("kompassi")}
    >
      {children}
    </button>
  );
}
