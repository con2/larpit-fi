"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
  href: string;
  title: string;
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function NavLinks({
  items,
  label,
  className = "lf-nav",
}: {
  items: NavItem[];
  label: string;
  className?: string;
}) {
  const pathname = usePathname();
  return (
    <nav aria-label={label} className={className}>
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
export function LanguageToggle({
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
    <span className="lf-lang" role="group" aria-label={label}>
      {locales.map((code, index) => (
        <span key={code}>
          {index > 0 && " / "}
          {code === locale ? (
            <span aria-current="true">{code.toUpperCase()}</span>
          ) : (
            // A plain anchor: next/link would prefetch and switch the locale cookie early.
            <a href={`/${code}${pathname}`} hrefLang={code} lang={code}>
              {code.toUpperCase()}
            </a>
          )}
        </span>
      ))}
    </span>
  );
}

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
