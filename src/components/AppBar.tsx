import Link from "next/link";

import { auth } from "@/auth";
import { featureFlags, isStaging, kompassiProfileUrl } from "@/config";
import type { SupportedLanguage } from "@/i18n/locales";
import {
  canEditPages,
  canManageUsers,
  canModerate,
  getDeleteLarpInitialStatusForUser,
  getUserFromSession,
} from "@/models/User";
import { db } from "@/prisma/db";
import { EditAction, EditStatus, RelatedUserRole } from "@/prisma/enums";
import { query, sql } from "@/prisma/sql";
import { getTranslations } from "@/translations";
import { SearchButton } from "./ui/CommandPalette";
import { PlusIcon } from "./ui/icons";
import MobileMenu from "./ui/MobileMenu";
import NavLinks, { LanguageToggle, type NavItem } from "./ui/NavLinks";
import UserMenu, { type AdminLink, type UserMenuCounts } from "./UserMenu";

interface Props {
  locale: string;
}

const languageOrder: readonly SupportedLanguage[] = ["fi", "en"];

async function getModerationCounts() {
  const [nonDelete, deletes] = await Promise.all([
    db.orm.public.ModerationRequest.where((r) =>
      r.status.in([EditStatus.VERIFIED, EditStatus.AUTO_APPROVED]),
    )
      .where((r) => r.action.neq(EditAction.DELETE))
      .aggregate((a) => ({ count: a.count() }))
      .then((r) => r.count),
    db.orm.public.ModerationRequest.where({
      status: EditStatus.VERIFIED,
      action: EditAction.DELETE,
    })
      .aggregate((a) => ({ count: a.count() }))
      .then((r) => r.count),
  ]);
  return { nonDelete, deletes };
}

async function getUserCounts(userId: string) {
  const [counts] = await query<{
    all: string;
    played: string;
    favourites: string;
  }>(sql`
    select
      count(distinct larp_id) as all,
      count(distinct larp_id) filter (where role = ${RelatedUserRole.PLAYER}) as played,
      count(distinct larp_id) filter (where role = ${RelatedUserRole.FAVORITE}) as favourites
    from related_user
    where user_id = ${userId}
  `);
  const pending = await db.orm.public.ModerationRequest.where({
    submitterId: userId,
  })
    .where((r) =>
      r.status.in([EditStatus.PENDING_VERIFICATION, EditStatus.VERIFIED]),
    )
    .select("id")
    .orderBy((r) => r.id.desc())
    .all();

  const result: UserMenuCounts = {
    all: Number(counts.all),
    played: Number(counts.played),
    favourites: Number(counts.favourites),
    pendingEdits: pending.length,
  };
  return { counts: result, latestPendingId: pending[0]?.id ?? null };
}

const emptyCounts: UserMenuCounts = {
  all: 0,
  played: 0,
  favourites: 0,
  pendingEdits: 0,
};

export default async function AppBar({ locale }: Props) {
  const translations = getTranslations(locale);
  const t = translations.AppBar;
  const navigationMessages = translations.Navigation;

  // Reading the session forces dynamic rendering for every page.
  const session = await auth();
  const user = await getUserFromSession(session);
  const [userCounts, moderationCounts] = await Promise.all([
    user ? getUserCounts(user.id) : null,
    canModerate(user) ? getModerationCounts() : null,
  ]);

  const isAdmin =
    getDeleteLarpInitialStatusForUser(user) === EditStatus.APPROVED;

  const adminLinks: AdminLink[] = [];
  if (moderationCounts) {
    adminLinks.push({
      href: "/moderate",
      title: navigationMessages.actions.moderate,
      icon: "moderate",
      badge:
        moderationCounts.nonDelete + (isAdmin ? moderationCounts.deletes : 0),
    });
  }
  if (canEditPages(user)) {
    adminLinks.push({
      href: "/page",
      title: navigationMessages.actions.pages,
      icon: "pages",
    });
  }
  if (canManageUsers(user)) {
    adminLinks.push({
      href: "/user",
      title: navigationMessages.actions.manageUsers,
      icon: "users",
    });
  }

  const navItems: NavItem[] = [
    { href: "/larp", title: translations.Larp.listTitle },
    { href: "/calendar", title: translations.CalendarPage.title },
    { href: "/stats", title: translations.StatsPage.title },
    { href: "/contact", title: translations.ContactPage.title },
  ];

  const menuUser = user ? { name: user.name, email: user.email } : null;

  return (
    <header className="lf-appbar">
      <div className="lf-appbar__aurora" aria-hidden="true">
        <div className="lf-appbar__aurora-glows" />
        <div className="lf-appbar__aurora-darken" />
      </div>
      <div className="lf-container lf-appbar__inner">
        <Link href="/" className="lf-logo">
          larpit<span>.fi</span>
          {isStaging && <span className="lf-staging">staging</span>}
        </Link>
        <div className="lf-desktop-only">
          <NavLinks items={navItems} label={t.mainNavigation} />
        </div>
        <div className="lf-appbar__actions">
          <SearchButton label={t.search} />
          <Link href="/larp/new" className="btn btn-primary lf-desktop-only">
            <PlusIcon size={14} />
            {navigationMessages.actions.addLarp}
          </Link>
          <Link
            href="/larp/new"
            className="lf-icon-button lf-icon-button--accent lf-phone-only"
            aria-label={navigationMessages.actions.addLarp}
          >
            <PlusIcon />
          </Link>
          <span className="lf-desktop-only">
            <LanguageToggle
              locale={locale}
              locales={languageOrder}
              label={t.language}
            />
          </span>
          <span className="lf-desktop-only">
            <UserMenu
              appBarMessages={t}
              messages={translations.UserMenu}
              user={menuUser}
              counts={userCounts?.counts ?? emptyCounts}
              pendingEditsHref={
                userCounts?.latestPendingId
                  ? `/moderate/${userCounts.latestPendingId}`
                  : null
              }
              adminLinks={adminLinks}
              locale={locale}
              locales={languageOrder}
              kompassiProfileUrl={kompassiProfileUrl}
              themeSwitching={featureFlags.themeSwitching}
            />
          </span>
          <MobileMenu
            navItems={navItems}
            adminLinks={adminLinks}
            user={menuUser}
            messages={t}
            userMenuMessages={translations.UserMenu}
            locale={locale}
            locales={languageOrder}
            themeSwitching={featureFlags.themeSwitching}
          />
        </div>
      </div>
    </header>
  );
}
