"use client";

import { signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Offcanvas from "react-bootstrap/Offcanvas";

import type { Translations } from "@/translations/en";
import type { AdminLink, UserMenuUser } from "../UserMenu";
import { FolderIcon, MenuIcon, SignOutIcon, UserIcon } from "./icons";
import NavLinks, { LanguageSegmented, type NavItem } from "./NavLinks";
import ThemeSegmented from "./ThemeSegmented";

interface Props {
  navItems: NavItem[];
  adminLinks: AdminLink[];
  user: UserMenuUser | null;
  messages: Translations["AppBar"];
  userMenuMessages: Translations["UserMenu"];
  locale: string;
  locales: readonly string[];
}

export default function MobileMenu({
  navItems,
  adminLinks,
  user,
  messages: t,
  userMenuMessages,
  locale,
  locales,
}: Props) {
  const pathname = usePathname();
  // Remembering where the menu was opened closes it when a link inside navigates away.
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const isOpen = openedAt === pathname;

  return (
    <>
      <button
        type="button"
        className="lf-icon-button lf-phone-only"
        aria-label={t.menu}
        aria-expanded={isOpen}
        onClick={() => setOpenedAt(pathname)}
      >
        <MenuIcon size={20} />
      </button>
      <Offcanvas
        show={isOpen}
        onHide={() => setOpenedAt(null)}
        placement="end"
        className="lf-mobile-menu"
        aria-label={t.menu}
      >
        <Offcanvas.Header closeButton closeLabel={t.closeMenu} />
        <Offcanvas.Body>
          <NavLinks
            items={navItems}
            label={t.mainNavigation}
            className="lf-menu__group"
          />
          <div className="lf-menu__group">
            {user ? (
              <>
                <Link href="/profile/larps" className="lf-menu__item">
                  <FolderIcon />
                  <span>{t.myLarps}</span>
                </Link>
                <Link href="/profile/preferences" className="lf-menu__item">
                  <UserIcon />
                  <span>{t.profile}</span>
                </Link>
                {adminLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="lf-menu__item"
                  >
                    <span>{link.title}</span>
                    {!!link.badge && (
                      <span className="lf-badge-pending">{link.badge}</span>
                    )}
                  </Link>
                ))}
                <button
                  type="button"
                  className="lf-menu__item lf-menu__item--quiet"
                  onClick={() => signOut()}
                >
                  <SignOutIcon />
                  <span>{userMenuMessages.signOut}</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                className="lf-menu__item"
                onClick={() => signIn("kompassi")}
              >
                <UserIcon />
                <span>{userMenuMessages.signIn}</span>
              </button>
            )}
          </div>
          <div className="lf-menu__group">
            <div className="lf-menu__setting">
              <span>{t.theme}</span>
              <ThemeSegmented label={t.theme} choices={t.themeChoices} />
            </div>
            <div className="lf-menu__setting">
              <span>{t.language}</span>
              <LanguageSegmented
                locale={locale}
                locales={locales}
                label={t.language}
              />
            </div>
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
}
