"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ChevronDownIcon } from "./icons";
import type { NavItem } from "./NavLinks";
import useDropdown from "./useDropdown";

export default function InfoMenu({
  title,
  items,
}: {
  title: string;
  items: NavItem[];
}) {
  const pathname = usePathname();
  const { isOpen, setOpen, containerRef, buttonRef, menuId } = useDropdown();
  const isCurrent = items.some(({ href }) => href === pathname);

  return (
    <div className="lf-nav__dropdown" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-current={isCurrent ? "page" : undefined}
        onClick={() => setOpen(!isOpen)}
      >
        {title}
        <ChevronDownIcon className="lf-muted" />
      </button>
      {isOpen && (
        <div className="lf-menu lf-menu--start" id={menuId}>
          <div className="lf-menu__group">
            {items.map(({ href, title }) => (
              <Link
                key={href}
                href={href}
                className="lf-menu__item"
                aria-current={href === pathname ? "page" : undefined}
              >
                <span>{title}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
