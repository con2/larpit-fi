"use client";

import { signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import type { Translations } from "@/translations/en";
import {
  CheckIcon,
  ChevronDownIcon,
  ClockIcon,
  ExternalIcon,
  FolderIcon,
  HeartIcon,
  LinkIcon,
  PagesIcon,
  ShieldCheckIcon,
  SignOutIcon,
  UserIcon,
} from "./ui/icons";
import { LanguageSegmented } from "./ui/NavLinks";
import ThemeSegmented from "./ui/ThemeSegmented";

export interface UserMenuUser {
  name: string | null;
  email: string;
}

export interface UserMenuCounts {
  all: number;
  played: number;
  favourites: number;
  pendingEdits: number;
}

export interface AdminLink {
  href: string;
  title: string;
  icon: "moderate" | "aliases" | "pages" | "users";
  badge?: number;
}

interface Props {
  appBarMessages: Translations["AppBar"];
  messages: Translations["UserMenu"];
  user: UserMenuUser | null;
  counts: UserMenuCounts;
  pendingEditsHref: string | null;
  adminLinks: AdminLink[];
  locale: string;
  locales: readonly string[];
  kompassiProfileUrl: string;
  themeSwitching: boolean;
}

export function getInitials(user: UserMenuUser): string {
  const words = (user.name ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return user.email.slice(0, 1).toUpperCase();
}

const adminIcons = {
  moderate: ShieldCheckIcon,
  aliases: LinkIcon,
  pages: PagesIcon,
  users: UserIcon,
};

export default function UserMenu({
  appBarMessages: t,
  messages,
  user,
  counts,
  pendingEditsHref,
  adminLinks,
  locale,
  locales,
  kompassiProfileUrl,
  themeSwitching,
}: Props) {
  const pathname = usePathname();
  // Remembering where the menu was opened closes it when a link inside navigates away.
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const isOpen = openedAt === pathname;
  const setOpen = (open: boolean) => setOpenedAt(open ? pathname : null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!isOpen) return;
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpenedAt(null);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenedAt(null);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  if (!user) {
    return (
      <button
        type="button"
        className="lf-signin"
        onClick={() => signIn("kompassi")}
      >
        {messages.signIn}
      </button>
    );
  }

  const initials = getInitials(user);
  const displayName = user.name || messages.usernameMissing;
  const firstName = user.name?.trim().split(/\s+/)[0] || displayName;

  return (
    <div className="position-relative" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        className="lf-user-pill"
        aria-label={t.accountMenu}
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setOpen(!isOpen)}
      >
        <span className="lf-disc" aria-hidden="true">
          {initials}
        </span>
        <span className="lf-user-pill__name">{firstName}</span>
        <ChevronDownIcon className="lf-user-pill__chevron lf-muted" />
        {counts.pendingEdits > 0 && (
          <span className="lf-user-pill__pending" aria-hidden="true" />
        )}
      </button>

      {isOpen && (
        <div className="lf-menu" id={menuId}>
          <div className="lf-menu__header">
            <span className="lf-disc lf-disc--large" aria-hidden="true">
              {initials}
            </span>
            <span className="fw-medium text-truncate">{displayName}</span>
          </div>

          <div className="lf-menu__group">
            <Link href="/profile/larps" className="lf-menu__item">
              <FolderIcon />
              <span>{t.myLarps}</span>
              <span className="lf-menu__count">{counts.all}</span>
            </Link>
            <Link href="/profile/larps?show=played" className="lf-menu__item">
              <CheckIcon />
              <span>{t.played}</span>
              <span className="lf-menu__count">{counts.played}</span>
            </Link>
            <Link
              href="/profile/larps?show=favourites"
              className="lf-menu__item"
            >
              <HeartIcon />
              <span>{t.favourites}</span>
              <span className="lf-menu__count">{counts.favourites}</span>
            </Link>
            {pendingEditsHref && counts.pendingEdits > 0 && (
              <Link href={pendingEditsHref} className="lf-menu__item">
                <ClockIcon />
                <span>{t.pendingEdits}</span>
                <span className="lf-badge-pending">{counts.pendingEdits}</span>
              </Link>
            )}
          </div>

          <div className="lf-menu__group">
            <Link href="/profile/preferences" className="lf-menu__item">
              <UserIcon />
              <span>{t.profile}</span>
            </Link>
            <a
              href={kompassiProfileUrl}
              className="lf-menu__item"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalIcon />
              <span>{t.editInKompassi}</span>
            </a>
          </div>

          <div className="lf-menu__group">
            {themeSwitching && (
              <div className="lf-menu__setting">
                <span>{t.theme}</span>
                <ThemeSegmented label={t.theme} choices={t.themeChoices} />
              </div>
            )}
            <div className="lf-menu__setting">
              <span>{t.language}</span>
              <LanguageSegmented
                locale={locale}
                locales={locales}
                label={t.language}
              />
            </div>
          </div>

          {adminLinks.length > 0 && (
            <div className="lf-menu__group">
              {adminLinks.map((link) => {
                const Icon = adminIcons[link.icon];
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="lf-menu__item"
                  >
                    <Icon />
                    <span>{link.title}</span>
                    {!!link.badge && (
                      <span className="lf-badge-pending">{link.badge}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          <div className="lf-menu__group">
            <button
              type="button"
              className="lf-menu__item lf-menu__item--quiet"
              onClick={() => signOut()}
            >
              <SignOutIcon />
              <span>{messages.signOut}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
