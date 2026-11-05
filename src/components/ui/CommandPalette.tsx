"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  Fragment,
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import type { LarpType } from "@/prisma/enums";
import type { Translations } from "@/translations/en";
import {
  CalendarIcon,
  EditIcon,
  LinkIcon,
  ListIcon,
  PlusIcon,
  RelatedIcon,
  SearchIcon,
  ShareIcon,
  ShieldIcon,
  StatsIcon,
  ThemeIcon,
  TodayIcon,
} from "./icons";
import { searchLarps, type LarpSearchResults } from "./searchLarps";
import type { SignupPillState } from "./signupPillState";
import StatusPill from "./StatusPill";
import { formatShortDateRange } from "@/helpers/dates";
import { getEffectiveTheme, setThemePreference } from "./themeClient";

export type PaletteIcon =
  | "edit"
  | "related"
  | "shield"
  | "calendar"
  | "link"
  | "share"
  | "today"
  | "plus"
  | "list"
  | "stats"
  | "theme";

export type PaletteAction = "copyLink" | "share" | "switchTheme";

export interface PaletteCommand {
  id: string;
  label: string;
  icon: PaletteIcon;
  href?: string;
  action?: PaletteAction;
  /** Shown as a keycap. Only for shortcuts that actually work. */
  shortcut?: string;
}

export interface RecentLarp {
  href: string;
  name: string;
  dateLabel: string;
}

export interface PalettePageContext {
  title: string;
  commands: PaletteCommand[];
}

const iconComponents: Record<PaletteIcon, typeof SearchIcon> = {
  edit: EditIcon,
  related: RelatedIcon,
  shield: ShieldIcon,
  calendar: CalendarIcon,
  link: LinkIcon,
  share: ShareIcon,
  today: TodayIcon,
  plus: PlusIcon,
  list: ListIcon,
  stats: StatsIcon,
  theme: ThemeIcon,
};

// ---------- platform ----------

const touchOnlyQuery = "(hover: none) and (pointer: coarse)";
const phoneQuery = "(max-width: 767.98px)";

function isApplePlatform() {
  const nav = navigator as Navigator & {
    userAgentData?: { platform?: string };
  };
  const platform = nav.userAgentData?.platform || navigator.platform || "";
  return /mac|iphone|ipad|ipod/i.test(platform);
}

function subscribeToMedia(query: string) {
  return (onChange: () => void) => {
    const media = window.matchMedia(query);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  };
}

function useMediaQuery(query: string) {
  return useSyncExternalStore(
    subscribeToMedia(query),
    () => window.matchMedia(query).matches,
    () => false,
  );
}

const noop = () => () => {};

/** "⌘K" on Apple platforms, "Ctrl K" elsewhere; null on the server and on touch-only devices. */
export function useShortcutKeycap(): string | null {
  const isTouchOnly = useMediaQuery(touchOnlyQuery);
  const isApple = useSyncExternalStore(noop, isApplePlatform, () => null);
  if (isApple === null || isTouchOnly) return null;
  return isApple ? "⌘K" : "Ctrl K";
}

// ---------- recent larps ----------

const recentStorageKey = "larpit-recent-larps";
const recentLimit = 5;

function readRecent(): RecentLarp[] {
  try {
    const value = JSON.parse(localStorage.getItem(recentStorageKey) ?? "[]");
    return Array.isArray(value) ? value.slice(0, recentLimit) : [];
  } catch {
    return [];
  }
}

export function rememberRecentLarp(larp: RecentLarp) {
  try {
    const recent = [
      larp,
      ...readRecent().filter((item) => item.href !== larp.href),
    ].slice(0, recentLimit);
    localStorage.setItem(recentStorageKey, JSON.stringify(recent));
  } catch {
    // Storage may be unavailable (private browsing); the Recent group just stays empty.
  }
}

// ---------- context ----------

interface CommandPaletteContextValue {
  open: () => void;
  setPageContext: (context: PalettePageContext | null) => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue>({
  open: () => {},
  setPageContext: () => {},
});

export function useCommandPalette() {
  return useContext(CommandPaletteContext);
}

function isEditable(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
  );
}

interface ProviderProps {
  children: ReactNode;
  locale: string;
  messages: Translations["CommandPalette"];
  typeTitles: Record<LarpType, string>;
}

export function CommandPaletteProvider({
  children,
  locale,
  messages,
  typeTitles,
}: ProviderProps) {
  const pathname = usePathname();
  // Remembering where the palette was opened closes it when a result navigates away.
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const isOpen = openedAt === pathname;
  const [pageContext, setPageContext] = useState<PalettePageContext | null>(
    null,
  );
  const router = useRouter();
  const pendingG = useRef<number | null>(null);

  const open = useCallback(() => setOpenedAt(pathname), [pathname]);
  const close = useCallback(() => setOpenedAt(null), []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const modifier = isApplePlatform() ? event.metaKey : event.ctrlKey;
      if (modifier && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpenedAt(isOpen ? null : pathname);
        return;
      }
      if (
        isOpen ||
        isEditable(event.target) ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      ) {
        return;
      }

      if (pendingG.current !== null) {
        window.clearTimeout(pendingG.current);
        pendingG.current = null;
        const targets: Record<string, string> = {
          c: "/calendar",
          l: "/larp",
        };
        const target = targets[event.key.toLowerCase()];
        if (target) {
          event.preventDefault();
          router.push(target);
          return;
        }
      }

      switch (event.key) {
        case "/":
          event.preventDefault();
          setOpenedAt(pathname);
          break;
        case "n":
        case "N":
          event.preventDefault();
          router.push("/larp/new");
          break;
        case "g":
        case "G":
          pendingG.current = window.setTimeout(() => {
            pendingG.current = null;
          }, 1000);
          break;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, pathname, router]);

  const contextValue = useMemo(() => ({ open, setPageContext }), [open]);

  return (
    <CommandPaletteContext.Provider value={contextValue}>
      {children}
      {isOpen && (
        <CommandPaletteDialog
          onClose={close}
          locale={locale}
          messages={messages}
          typeTitles={typeTitles}
          pageContext={pageContext}
          pathname={pathname}
        />
      )}
    </CommandPaletteContext.Provider>
  );
}

// ---------- the dialog ----------

type PaletteItem =
  | {
      kind: "larp";
      key: string;
      href: string;
      result: LarpSearchResults["results"][number];
    }
  | { kind: "command"; key: string; command: PaletteCommand }
  | { kind: "recent"; key: string; href: string; recent: RecentLarp };

interface PaletteGroup {
  key: string;
  label: string;
  aside?: string;
  items: PaletteItem[];
}

function Highlight({ text, query }: { text: string; query: string }) {
  const index = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;
  if (index < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <mark>{text.slice(index, index + query.length)}</mark>
      {text.slice(index + query.length)}
    </>
  );
}

function pillText(
  pill: SignupPillState,
  t: Translations["CommandPalette"]["pill"],
  locale: string,
) {
  const date = pill.date ? formatShortDateRange(pill.date, null, locale) : "";
  return t[pill.reason].replace("{date}", date);
}

// The language switch must pass through the i18n middleware, and calendar files and webcal links
// are not pages the client router can render.
function needsDocumentNavigation(item: PaletteItem, href: string) {
  return (
    (item.kind === "command" && item.command.id === "language") ||
    !href.startsWith("/") ||
    href.split(/[?#]/)[0].endsWith(".ics")
  );
}

function matches(label: string, query: string) {
  return label.toLowerCase().includes(query.toLowerCase());
}

interface DialogProps {
  onClose: () => void;
  locale: string;
  messages: Translations["CommandPalette"];
  typeTitles: Record<LarpType, string>;
  pageContext: PalettePageContext | null;
  pathname: string;
}

function CommandPaletteDialog({
  onClose,
  locale,
  messages: t,
  typeTitles,
  pageContext,
  pathname,
}: DialogProps) {
  const router = useRouter();
  const inputId = useId();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState<LarpSearchResults>({
    total: 0,
    results: [],
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const isPhone = useMediaQuery(phoneQuery);
  const [recent] = useState(readRecent);
  const [effectiveTheme] = useState(getEffectiveTheme);

  const commandsOnly = query.startsWith(">");
  const commandQuery = (commandsOnly ? query.slice(1) : query).trim();
  const larpQuery = commandsOnly ? "" : query.trim();

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, []);

  useEffect(() => {
    if (!larpQuery) return;
    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      const results = await searchLarps(larpQuery, locale);
      if (!cancelled) setSearch(results);
    }, 150);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [larpQuery, locale]);

  const shownSearch = larpQuery ? search : { total: 0, results: [] };

  const otherLocale = locale === "fi" ? "en" : "fi";
  const globalCommands: PaletteCommand[] = [
    {
      id: "addLarp",
      label: t.commands.addLarp,
      icon: "plus",
      href: "/larp/new",
      shortcut: "N",
    },
    {
      id: "calendar",
      label: t.commands.calendar,
      icon: "calendar",
      href: "/calendar",
      shortcut: "G C",
    },
    {
      id: "allLarps",
      label: t.commands.allLarps,
      icon: "list",
      href: "/larp",
      shortcut: "G L",
    },
    { id: "stats", label: t.commands.stats, icon: "stats", href: "/stats" },
    {
      id: "theme",
      label:
        effectiveTheme === "dark"
          ? t.commands.themeToDay
          : t.commands.themeToNight,
      icon: "theme",
      action: "switchTheme",
    },
    {
      id: "language",
      label: t.commands.switchLanguage,
      icon: "list",
      href: `/${otherLocale}${pathname}`,
    },
  ];

  const filterCommands = (commands: PaletteCommand[]) =>
    commandQuery
      ? commands.filter((command) => matches(command.label, commandQuery))
      : commands;

  const groups: PaletteGroup[] = [];
  if (larpQuery) {
    groups.push({
      key: "larps",
      label: t.larps,
      aside: shownSearch.total
        ? t.resultCount
            .replace("{shown}", String(shownSearch.results.length))
            .replace("{total}", String(shownSearch.total))
        : undefined,
      items: shownSearch.results.map((result) => ({
        kind: "larp" as const,
        key: `larp-${result.id}`,
        href: result.href,
        result,
      })),
    });
  }
  if (pageContext) {
    groups.push({
      key: "page",
      label: `${t.thisPage} · ${pageContext.title}`,
      items: filterCommands(pageContext.commands).map((command) => ({
        kind: "command" as const,
        key: `page-${command.id}`,
        command,
      })),
    });
  }
  groups.push({
    key: "global",
    label: t.everywhere,
    items: filterCommands(globalCommands).map((command) => ({
      kind: "command" as const,
      key: `global-${command.id}`,
      command,
    })),
  });
  if (isPhone && !query && recent.length > 0) {
    groups.push({
      key: "recent",
      label: t.recent,
      items: recent.map((item) => ({
        kind: "recent" as const,
        key: `recent-${item.href}`,
        href: item.href,
        recent: item,
      })),
    });
  }

  const items = groups.flatMap((group) => group.items);
  const selected = Math.min(selectedIndex, Math.max(items.length - 1, 0));

  async function runAction(action: PaletteAction) {
    switch (action) {
      case "copyLink":
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        window.setTimeout(onClose, 700);
        return;
      case "share":
        if (navigator.share) {
          await navigator
            .share({ title: document.title, url: window.location.href })
            .catch(() => {});
          onClose();
        } else {
          await runAction("copyLink");
        }
        return;
      case "switchTheme":
        setThemePreference(effectiveTheme === "dark" ? "day" : "night");
        onClose();
        return;
    }
  }

  function activate(item: PaletteItem, newTab: boolean) {
    const href =
      item.kind === "command" ? item.command.href : (item.href as string);
    if (item.kind === "command" && item.command.action) {
      void runAction(item.command.action);
      return;
    }
    if (!href) return;
    if (newTab) {
      window.open(href, "_blank", "noopener");
    } else if (needsDocumentNavigation(item, href)) {
      window.location.assign(href);
    } else {
      router.push(href);
      onClose();
    }
  }

  function onKeyDown(event: ReactKeyboardEvent) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setSelectedIndex((selected + 1) % Math.max(items.length, 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setSelectedIndex(
          (selected - 1 + items.length) % Math.max(items.length, 1),
        );
        break;
      case "Enter": {
        const item = items[selected];
        if (item) {
          event.preventDefault();
          activate(item, event.metaKey || event.ctrlKey);
        }
        break;
      }
      case "Escape":
        event.preventDefault();
        onClose();
        break;
      case "Tab":
        // The input is the only focus stop; arrows move within the list.
        event.preventDefault();
        break;
    }
  }

  useEffect(() => {
    document
      .getElementById(`${listId}-${selected}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [listId, selected]);

  let itemIndex = -1;

  return (
    <>
      <div
        className="lf-palette-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="lf-palette"
        role="dialog"
        aria-modal="true"
        aria-label={t.title}
        onKeyDown={onKeyDown}
      >
        <div className="lf-palette__input-row">
          <SearchIcon size={18} />
          <label htmlFor={inputId} className="visually-hidden">
            {t.inputLabel}
          </label>
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={
              items.length ? `${listId}-${selected}` : undefined
            }
            autoComplete="off"
            spellCheck={false}
            placeholder={t.placeholder}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelectedIndex(0);
            }}
          />
          {isPhone ? (
            <button
              type="button"
              className="lf-palette__cancel"
              onClick={onClose}
            >
              {t.close}
            </button>
          ) : (
            <>
              <span className="lf-palette__hint">
                <kbd>&gt;</kbd> {t.commandsHint}
              </span>
              <kbd>esc</kbd>
            </>
          )}
        </div>

        <div className="lf-palette__list" id={listId} role="listbox">
          {groups.map((group, groupIndex) => (
            <Fragment key={group.key}>
              {groupIndex > 0 && <div className="lf-palette__divider" />}
              <div className="lf-palette__group-label" role="presentation">
                <span>{group.label}</span>
                {group.aside && <span>{group.aside}</span>}
              </div>
              {group.key === "larps" && group.items.length === 0 && (
                <div className="lf-palette__empty">{t.noResults}</div>
              )}
              {group.items.map((item) => {
                itemIndex += 1;
                const index = itemIndex;
                const isSelected = index === selected;
                const common = {
                  id: `${listId}-${index}`,
                  role: "option",
                  "aria-selected": isSelected,
                  onMouseMove: () => setSelectedIndex(index),
                  onClick: (event: React.MouseEvent) => {
                    event.preventDefault();
                    activate(item, event.metaKey || event.ctrlKey);
                  },
                };

                if (item.kind === "larp") {
                  const { result } = item;
                  return (
                    <a
                      key={item.key}
                      href={item.href}
                      className={`lf-palette__item${result.past ? " lf-palette__item--past" : ""}`}
                      {...common}
                    >
                      <span className="lf-palette__date">
                        {result.dateLabel}
                      </span>
                      <span className="lf-palette__main">
                        <span
                          className="lf-palette__name"
                          lang={
                            result.language === "OTHER"
                              ? undefined
                              : result.language
                          }
                        >
                          <Highlight text={result.name} query={larpQuery} />
                        </span>
                        <span className="lf-palette__sub">
                          {[result.municipality, typeTitles[result.type]]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </span>
                      {result.pill && (
                        <StatusPill kind={result.pill.kind} small>
                          {pillText(result.pill, t.pill, locale)}
                        </StatusPill>
                      )}
                      {isSelected && !isPhone && <kbd>↵</kbd>}
                    </a>
                  );
                }

                if (item.kind === "recent") {
                  return (
                    <a
                      key={item.key}
                      href={item.href}
                      className="lf-palette__item"
                      {...common}
                    >
                      <span className="lf-palette__date">
                        {item.recent.dateLabel}
                      </span>
                      <span className="lf-palette__name">
                        {item.recent.name}
                      </span>
                    </a>
                  );
                }

                const { command } = item;
                const Icon = iconComponents[command.icon];
                const showCopied = command.action === "copyLink" && copied;
                return (
                  <a
                    key={item.key}
                    href={command.href ?? "#"}
                    className="lf-palette__item"
                    {...common}
                  >
                    {command.id === "language" ? (
                      <span className="lf-palette__lang-icon">
                        {otherLocale.toUpperCase()}
                      </span>
                    ) : (
                      <Icon
                        className={command.icon === "plus" ? "lf-accent" : ""}
                      />
                    )}
                    <span className="lf-palette__label">
                      {showCopied ? t.commands.copied : command.label}
                    </span>
                    {command.shortcut && !isPhone && (
                      <kbd>{command.shortcut}</kbd>
                    )}
                  </a>
                );
              })}
            </Fragment>
          ))}
        </div>

        <div className="lf-palette__footer" aria-hidden="true">
          <span>
            <kbd>↑</kbd> <kbd>↓</kbd> {t.footerMove}
          </span>
          <span>
            <kbd>↵</kbd> {t.footerOpen}
          </span>
          <span>
            <kbd>{isApplePlatform() ? "⌘↵" : "Ctrl ↵"}</kbd> {t.footerNewTab}
          </span>
          <span>{t.footerTip}</span>
        </div>
      </div>
    </>
  );
}

/**
 * Registers the contextual commands of the current page with the palette. Rendered by pages that
 * have any; the group is hidden elsewhere.
 */
export function PaletteContext({
  title,
  commands,
  recent,
}: PalettePageContext & { recent?: RecentLarp }) {
  const { setPageContext } = useCommandPalette();
  const serialized = JSON.stringify({ title, commands });

  useEffect(() => {
    setPageContext(JSON.parse(serialized));
    return () => setPageContext(null);
  }, [serialized, setPageContext]);

  const recentHref = recent?.href;
  useEffect(() => {
    if (recent) rememberRecentLarp(recent);
    // Remember once per page, not on every re-render with an equal object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recentHref]);

  return null;
}

export function SearchButton({ label }: { label: string }) {
  const { open } = useCommandPalette();
  const keycap = useShortcutKeycap();
  return (
    <>
      <button
        type="button"
        className="lf-search-button lf-desktop-only"
        onClick={open}
        aria-keyshortcuts="Meta+K Control+K"
      >
        <SearchIcon size={15} />
        {label}
        {keycap && <kbd>{keycap}</kbd>}
      </button>
      <button
        type="button"
        className="lf-icon-button lf-icon-button--outline lf-phone-only"
        onClick={open}
        aria-label={label}
      >
        <SearchIcon size={18} />
      </button>
    </>
  );
}
