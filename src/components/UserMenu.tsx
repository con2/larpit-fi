"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Session } from "next-auth";
import { signIn, signOut, useSession } from "next-auth/react";

import Nav from "react-bootstrap/Nav";
import NavDropdown from "react-bootstrap/NavDropdown";

import type { Translations } from "@/translations/en";

interface Props {
  messages: Translations["UserMenu"];
}

interface ProfileLink {
  title: string;
  href: string;
}

export default function UserMenu({ messages: t }: Props) {
  const session = useSession();

  const links: ProfileLink[] = [
    {
      title: t.ownLarps,
      href: "/profile/larps",
    },
  ];

  if (session.status === "authenticated") {
    const { user } = session.data;

    return (
      <NavDropdown
        title={user?.name ? <>{user.name}</> : <em>{t.usernameMissing}</em>}
        id="kompassi-user-menu"
        data-bs-theme="light"
        align="end"
      >
        {links.map(({ href, title }) => (
          <NavDropdown.Item key={href} as={Link} href={href}>
            {title}
          </NavDropdown.Item>
        ))}
        <NavDropdown.Divider />
        <NavDropdown.Item onClick={() => signOut()}>
          {t.signOut}
        </NavDropdown.Item>
      </NavDropdown>
    );
  } else {
    return <Nav.Link onClick={() => signIn("kompassi")}>{t.signIn}…</Nav.Link>;
  }
}
