"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export interface NavItem {
  href: string;
  title: string;
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** `children` come before the links, such as a dropdown or a heading. */
export default function NavLinks({
  items,
  label,
  className = "lf-nav",
  children,
}: {
  items: NavItem[];
  label: string;
  className?: string;
  children?: ReactNode;
}) {
  const pathname = usePathname();
  return (
    <nav aria-label={label} className={className}>
      {children}
      {items.map(({ href, title }) => (
        <Link
          key={href}
          href={href}
          aria-current={
            isActive(pathname, href) && !pathname.startsWith("/larp/new")
              ? "page"
              : undefined
          }
        >
          {title}
        </Link>
      ))}
    </nav>
  );
}

/** FI / EN in the app bar; the current language is emphasised. */
export function LanguageSegmented({
  locale,
  locales,
  label,
}: {
  locale: string;
  locales: readonly string[];
  label: string;
}) {
  const pathname = usePathname();
  return (
    <span className="lf-segmented" role="group" aria-label={label}>
      {locales.map((code) => (
        <a
          key={code}
          href={`/${code}${pathname}`}
          hrefLang={code}
          lang={code}
          aria-current={code === locale ? "true" : undefined}
        >
          {code.toUpperCase()}
        </a>
      ))}
    </span>
  );
}
