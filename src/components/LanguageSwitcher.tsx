"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import NavDropdown from "react-bootstrap/NavDropdown";

import type { Translations } from "@/translations/en";

interface Props {
  locale: string;
  messages: Translations["LanguageSwitcher"];
}

export default function LanguageSwitcher({ locale, messages }: Props) {
  const { switchTo: supportedLanguages } = messages;
  let pathname = usePathname();

  // Remove the language prefix from the pathname
  // If we were using <Link>, Next.js would handle this for us
  // But that also sometimes preloads the link, causing a language change
  for (const supportedLanguage of Object.keys(supportedLanguages)) {
    if (
      pathname === `/${supportedLanguage}` ||
      pathname.startsWith(`/${supportedLanguage}/`)
    ) {
      pathname = pathname.slice(supportedLanguage.length + 1);
      break;
    }
  }

  return (
    <NavDropdown title={locale.toUpperCase()} id="kompassi-locale-menu">
      {Object.entries(supportedLanguages).map(([code, name]) => (
        <NavDropdown.Item
          key={code}
          as={Link}
          href={`/${code}${pathname}`}
          active={code === locale}
          prefetch={false}
        >
          {name}
        </NavDropdown.Item>
      ))}
    </NavDropdown>
  );
}
