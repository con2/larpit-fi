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
        <NavbarToggle aria-controls="basic-navbar-nav" />
        <NavbarCollapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <NavLink as={Link} href="/larp/new">
              {t.actions.addLarp}…
            </NavLink>
          </Nav>
        </NavbarCollapse>
      </Container>
    </Navbar>
  );
}
