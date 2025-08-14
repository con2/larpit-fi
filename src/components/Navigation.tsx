import { getTranslations } from "@/translations";
import Link from "next/link";
import {
  Container,
  Nav,
  Navbar,
  NavbarBrand,
  NavbarCollapse,
  NavbarToggle,
  NavLink,
} from "react-bootstrap";
import LanguageSwitcher from "./LanguageSwitcher";

interface Props {
  locale: string;
}

export function Navigation({ locale }: Props) {
  const translations = getTranslations(locale);
  const t = translations.Navigation;
  return (
    <Navbar expand="md">
      <Container>
        <NavbarBrand as={Link} href="/">
          {translations.brand}
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
          </Nav>
          <Nav className="ms-auto">
            <LanguageSwitcher
              locale={locale}
              messages={translations.LanguageSwitcher}
            />
          </Nav>
        </NavbarCollapse>
      </Container>
    </Navbar>
  );
}
