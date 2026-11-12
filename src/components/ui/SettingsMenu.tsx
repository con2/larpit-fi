"use client";

import type { Translations } from "@/translations/en";
import { ChevronDownIcon, GlobeIcon } from "./icons";
import { LanguageSegmented } from "./NavLinks";
import ThemeSegmented from "./ThemeSegmented";
import useDropdown from "./useDropdown";

interface Props {
  messages: Translations["AppBar"];
  locale: string;
  locales: readonly string[];
  themeSwitching: boolean;
}

/** Language and theme for a visitor who is not signed in; the user menu has the same settings. */
export default function SettingsMenu({
  messages: t,
  locale,
  locales,
  themeSwitching,
}: Props) {
  const { isOpen, setOpen, containerRef, buttonRef, menuId } = useDropdown();
  const label = themeSwitching ? t.languageAndTheme : t.language;

  return (
    <div className="position-relative" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        className="lf-settings-button"
        aria-label={label}
        title={label}
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setOpen(!isOpen)}
      >
        <GlobeIcon size={18} />
        <span aria-hidden="true">{locale.toUpperCase()}</span>
        <ChevronDownIcon className="lf-muted" />
      </button>

      {isOpen && (
        <div className="lf-menu" id={menuId}>
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
        </div>
      )}
    </div>
  );
}
