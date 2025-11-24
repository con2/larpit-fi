"use client";

import { signIn, signOut } from "next-auth/react";
import Link from "next/link";

import Nav from "react-bootstrap/Nav";
import NavDropdown from "react-bootstrap/NavDropdown";

import { User } from "@/generated/prisma/client";
import type { Translations } from "@/translations/en";

interface Props {
  messages: Translations["UserMenu"];
  user: Pick<User, "name" | "role"> | null;
}

interface ProfileLink {
  title: string;
  href: string;
}

export default function UserMenu({ messages: t, user }: Props) {
  const links: ProfileLink[] = [
    {
      title: t.ownLarps,
      href: "/profile/larps",
    },
  ];

  if (user) {
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
