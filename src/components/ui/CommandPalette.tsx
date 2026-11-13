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
  ImageIcon,
  MergeIcon,
  LinkIcon,
  ListIcon,
  PagesIcon,
  PlusIcon,
  RelatedIcon,
  SearchIcon,
  ShareIcon,
  ShieldIcon,
  StatsIcon,
  ThemeIcon,
  TodayIcon,
} from "./icons";
import { searchPalette, type PaletteSearchResults } from "./searchPalette";
import type { SignupPillState } from "./signupPillState";
import StatusPill from "./StatusPill";
import { formatShortDateRange } from "@/helpers/dates";
import { useDebouncedValue } from "@/helpers/useDebouncedValue";
import { pagePathInUiLanguage } from "@/models/Page.client";
import type { LarpSearchResult, PageSearchResult } from "@/search/search";
import { getEffectiveTheme, setThemePreference } from "./themeClient";

type PaletteIcon =
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
  | "theme"
  | "image"
  | "merge";

type PaletteAction = "copyLink" | "share" | "switchTheme";

export interface PaletteCommand {
  /**
   * The action of the command in the `command` table, such as `larp:editLarp`. Search hits are
   * matched to commands by it, so it must stay in sync with `builtinCommandLabels` in
   * `src/models/Command.ts`.
   */
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
  /** Fills `{larpId}` in the URL templates of commands added in the database. */
  larpId?: string;
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
  image: ImageIcon,
  merge: MergeIcon,
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
function useShortcutKeycap(): string | null {
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

function rememberRecentLarp(larp: RecentLarp) {
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
  themeSwitching: boolean;
}

export function CommandPaletteProvider({
  children,
  locale,
  messages,
  typeTitles,
  themeSwitching,
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
          themeSwitching={themeSwitching}
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
      result: LarpSearchResult;
    }
  | { kind: "page"; key: string; href: string; page: PageSearchResult }
  | { kind: "allResults"; key: string; href: string }
  | { kind: "command"; key: string; command: PaletteCommand }
  | { kind: "recent"; key: string; href: string; recent: RecentLarp };

interface PaletteGroup {
  key: string;
  label?: string;
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
    (item.kind === "command" && item.command.id === "global:language") ||
    !href.startsWith("/") ||
    href.split(/[?#]/)[0].endsWith(".ics")
  );
}

function matches(label: string, query: string) {
  return label.toLowerCase().includes(query.toLowerCase());
}

const minSearchLength = 2;
const searchDelayMs = 250;

/** The href of a command added in the database, or null if the page lacks a value it needs. */
function fillUrlTemplate(
  template: string,
  values: Record<string, string | undefined>,
): string | null {
  let complete = true;
  const href = template.replace(/\{(\w+)\}/g, (_, name: string) => {
    const value = values[name];
    if (value === undefined) complete = false;
    return encodeURIComponent(value ?? "");
  });
  return complete ? href : null;
}

interface SearchResponse {
  query: string;
  results: Exclude<PaletteSearchResults, { rateLimited: true }>;
}

interface DialogProps {
  onClose: () => void;
  locale: string;
  messages: Translations["CommandPalette"];
  typeTitles: Record<LarpType, string>;
  themeSwitching: boolean;
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
  themeSwitching,
}: DialogProps) {
  const router = useRouter();
  const inputId = useId();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const isPhone = useMediaQuery(phoneQuery);
  const [recent] = useState(readRecent);
  const [effectiveTheme] = useState(getEffectiveTheme);

  const trimmedQuery = query.trim();
  const commandsOnly = trimmedQuery.startsWith(">");
  const searchText = (
    commandsOnly ? trimmedQuery.slice(1) : trimmedQuery
  ).trim();
  const searchable = searchText.length >= minSearchLength;
  const debouncedQuery = useDebouncedValue(
    searchable ? trimmedQuery : "",
    searchDelayMs,
  );

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
    if (!debouncedQuery) return;
    let cancelled = false;
    searchPalette(debouncedQuery, locale)
      .then((results) => {
        // When rate limited, the previous results stay up until a search gets through.
        if (!cancelled && !results.rateLimited) {
          setResponse({ query: debouncedQuery, results });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, locale]);

  // The latest response stays up while the next one is on its way.
  const shown = searchable ? response?.results : undefined;
  const shownLarps = shown?.larps ?? { total: 0, results: [] };
  const shownPages = shown?.pages ?? { total: 0, results: [] };

  const otherLocale = locale === "fi" ? "en" : "fi";
  const globalCommands: PaletteCommand[] = [
    {
      id: "global:addLarp",
      label: t.commands.addLarp,
      icon: "plus",
      href: "/larp/new",
      shortcut: "N",
    },
    {
      id: "global:calendar",
      label: t.commands.calendar,
      icon: "calendar",
      href: "/calendar",
      shortcut: "G C",
    },
    {
      id: "global:allLarps",
      label: t.commands.allLarps,
      icon: "list",
      href: "/larp",
      shortcut: "G L",
    },
    {
      id: "global:stats",
      label: t.commands.stats,
      icon: "stats",
      href: "/stats",
    },
    ...(themeSwitching
      ? [
          {
            id: "global:theme",
            label:
              effectiveTheme === "dark"
                ? t.commands.themeToDay
                : t.commands.themeToNight,
            icon: "theme" as const,
            action: "switchTheme" as const,
          },
        ]
      : []),
    {
      id: "global:language",
      label: t.commands.switchLanguage,
      icon: "list",
      href: `/${otherLocale}${pathname}`,
    },
  ];

  const commandRanks = new Map(
    shown?.commands.map((command, index) => [command.action, index]),
  );
  const rankOf = (command: PaletteCommand) =>
    commandRanks.get(command.id) ?? Infinity;
  // Search hits come first in rank order; label substring matches catch what stemming misses.
  const filterCommands = (commands: PaletteCommand[]) =>
    searchText
      ? commands
          .filter(
            (command) =>
              commandRanks.has(command.id) ||
              matches(command.label, searchText),
          )
          .sort((a, b) => rankOf(a) - rankOf(b))
      : commands;

  const knownCommandIds = new Set(
    [...globalCommands, ...(pageContext?.commands ?? [])].map(
      (command) => command.id,
    ),
  );
  const databaseCommands: PaletteCommand[] = (shown?.commands ?? []).flatMap(
    (command) => {
      if (!command.action.startsWith("/")) return [];
      if (knownCommandIds.has(command.action)) return [];
      const href = fillUrlTemplate(command.action, {
        larpId: pageContext?.larpId,
      });
      if (!href) return [];
      return [{ id: command.action, label: command.label, icon: "link", href }];
    },
  );
  const isContextual = (command: PaletteCommand) => command.id.includes("{");

  const groups: PaletteGroup[] = [];
  if (!commandsOnly && searchable) {
    groups.push({
      key: "larps",
      label: t.larps,
      aside: shownLarps.total
        ? t.resultCount
            .replace("{shown}", String(shownLarps.results.length))
            .replace("{total}", String(shownLarps.total))
        : undefined,
      items: shownLarps.results.map((result) => ({
        kind: "larp" as const,
        key: `larp-${result.id}`,
        href: result.href,
        result,
      })),
    });
    if (shownPages.results.length > 0) {
      groups.push({
        key: "pages",
        label: t.pages,
        aside:
          shownPages.total > shownPages.results.length
            ? t.resultCount
                .replace("{shown}", String(shownPages.results.length))
                .replace("{total}", String(shownPages.total))
            : undefined,
        items: shownPages.results.map((page) => ({
          kind: "page" as const,
          key: `page-${page.slug}`,
          href: pagePathInUiLanguage(page.slug),
          page,
        })),
      });
    }
    if (
      shownLarps.total > shownLarps.results.length ||
      shownPages.total > shownPages.results.length
    ) {
      groups.push({
        key: "allResults",
        items: [
          {
            kind: "allResults",
            key: "allResults",
            href: `/search?${new URLSearchParams({ search: searchText })}`,
          },
        ],
      });
    }
  }
  if (pageContext) {
    groups.push({
      key: "page",
      label: `${t.thisPage} · ${pageContext.title}`,
      items: filterCommands([
        ...pageContext.commands,
        ...databaseCommands.filter(isContextual),
      ]).map((command) => ({
        kind: "command" as const,
        key: `page-${command.id}`,
        command,
      })),
    });
  }
  groups.push({
    key: "global",
    label: t.everywhere,
    items: filterCommands([
      ...globalCommands,
      ...databaseCommands.filter((command) => !isContextual(command)),
    ]).map((command) => ({
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
              {group.label && (
                <div className="lf-palette__group-label" role="presentation">
                  <span>{group.label}</span>
                  {group.aside && <span>{group.aside}</span>}
                </div>
              )}
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
                          <Highlight text={result.name} query={searchText} />
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

                if (item.kind === "page") {
                  return (
                    <a
                      key={item.key}
                      href={item.href}
                      className="lf-palette__item"
                      {...common}
                    >
                      <PagesIcon />
                      <span className="lf-palette__label">
                        <Highlight text={item.page.title} query={searchText} />
                      </span>
                      {isSelected && !isPhone && <kbd>↵</kbd>}
                    </a>
                  );
                }

                if (item.kind === "allResults") {
                  return (
                    <a
                      key={item.key}
                      href={item.href}
                      className="lf-palette__item"
                      {...common}
                    >
                      <SearchIcon />
                      <span className="lf-palette__label">
                        {t.allResults.replace("{query}", searchText)}
                      </span>
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
                    {command.id === "global:language" ? (
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
  larpId,
  recent,
}: PalettePageContext & { recent?: RecentLarp }) {
  const { setPageContext } = useCommandPalette();
  const serialized = JSON.stringify({ title, commands, larpId });

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
