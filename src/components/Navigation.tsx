import { getTranslations } from "@/translations";
import { ClientLink as Link } from "@con2/components";
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
import { LanguageSwitcher } from "@con2/components";
import UserMenu from "./UserMenu";
import { isStaging } from "@/config";
import { auth } from "@/auth";
import { db } from "@/prisma/db";
import { EditAction, EditStatus } from "@/prisma/enums";
import {
  getDeleteLarpInitialStatusForUser,
  getUserFromSession,
  canEditPages,
  canManageUsers,
  canModerate,
} from "@/models/User";

interface Props {
  locale: string;
}

export async function Navigation({ locale }: Props) {
  const translations = getTranslations(locale);
  const t = translations.Navigation;

  // TODO Forces dynamic rendering for all pages.
  // Learn how to put custom fields on session.user and use useSession.
  const session = await auth();
  const [user, numPendingNonDeleteRequests, numPendingDeleteRequests] =
    await Promise.all([
      getUserFromSession(session),
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

  const isAdmin =
    getDeleteLarpInitialStatusForUser(user) === EditStatus.APPROVED;

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
            <NavLink as={Link} href="/calendar">
              {translations.CalendarPage.title}
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
                {!!numPendingNonDeleteRequests && (
                  <>
                    <Badge pill bg="primary">
                      {numPendingNonDeleteRequests}
                    </Badge>{" "}
                  </>
                )}
                {isAdmin && !!numPendingDeleteRequests && (
                  <>
                    <Badge pill bg="danger">
                      {numPendingDeleteRequests}
                    </Badge>{" "}
                  </>
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
