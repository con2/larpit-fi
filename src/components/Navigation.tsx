import { getTranslations } from "@/translations";
import Link from "next/link";
import {
  Badge,
  Container,
  Nav,
  Navbar,
  NavbarBrand,
  NavbarCollapse,
  NavbarToggle,
  NavLink,
} from "react-bootstrap";
import LanguageSwitcher from "./LanguageSwitcher";
import UserMenu from "./UserMenu";
import { isStaging } from "@/config";
import { auth } from "@/auth";
import prisma from "@/prisma";
import { EditStatus } from "@/generated/prisma/client";
import { canEditPages, canManageUsers, canModerate } from "@/models/User";

interface Props {
  locale: string;
}

export async function Navigation({ locale }: Props) {
  const translations = getTranslations(locale);
  const t = translations.Navigation;

  // TODO Forces dynamic rendering for all pages.
  // Learn how to put custom fields on session.user and use useSession.
  const session = await auth();
  const [user, numPendingModerationRequests] = await Promise.all([
    session?.user?.email
      ? prisma.user.findUnique({
          where: { email: session.user.email },
          select: { id: true, name: true, email: true, role: true },
        })
      : null,
    prisma.moderationRequest.count({
      where: {
        status: { in: [EditStatus.VERIFIED, EditStatus.AUTO_APPROVED] },
      },
    }),
  ]);

  return (
    <Navbar expand="md">
      <Container>
        <NavbarBrand as={Link} href="/">
          {isStaging ? translations.stagingTitle : translations.title}
        </NavbarBrand>
        <NavbarToggle aria-controls="navbar-collapse" />
        <NavbarCollapse id="navbar-collapse">
          <Nav>
            <NavLink as={Link} href="/larp/new">
              {t.actions.addLarp}
            </NavLink>
            <NavLink as={Link} href="/search">
              {t.actions.search}
            </NavLink>
            <NavLink as={Link} href="/larp">
              {translations.Larp.listTitle}
            </NavLink>
            <NavLink as={Link} href="/stats">
              {translations.StatsPage.title}
            </NavLink>
            <NavLink as={Link} href="/contact">
              {translations.ContactPage.title}
            </NavLink>
          </Nav>
          <Nav className="ms-auto">
            {canModerate(user) && (
              <NavLink as={Link} href="/moderate">
                {t.actions.moderate}{" "}
                {!!numPendingModerationRequests && (
                  <Badge pill bg="primary">
                    {numPendingModerationRequests}
                  </Badge>
                )}
              </NavLink>
            )}
            {canEditPages(user) && (
              <NavLink as={Link} href="/page">
                {t.actions.pages}
              </NavLink>
            )}
            {canManageUsers(user) && (
              <NavLink as={Link} href="/user">
                {t.actions.manageUsers}
              </NavLink>
            )}
            <LanguageSwitcher
              locale={locale}
              messages={translations.LanguageSwitcher}
            />
            <UserMenu messages={translations.UserMenu} user={user} />
          </Nav>
        </NavbarCollapse>
      </Container>
    </Navbar>
  );
}
