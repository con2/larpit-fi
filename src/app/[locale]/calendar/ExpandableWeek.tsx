"use client";

import {
  createContext,
  CSSProperties,
  ReactNode,
  useContext,
  useState,
} from "react";

import { visibleLanesPerWeek } from "./calendarLayout";

const WeekExpansion = createContext<{
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
  weekId: string;
} | null>(null);

/**
 * A week row of the month grid whose lanes past the visible four can be shown in place. Without
 * JavaScript the toggles are plain links that reload the page with the week expanded.
 */
export function ExpandableWeek({
  id,
  className,
  laneCount,
  initiallyExpanded,
  children,
}: {
  id: string;
  className: string;
  laneCount: number;
  initiallyExpanded: boolean;
  children: ReactNode;
}) {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const lanes = expanded
    ? Math.max(visibleLanesPerWeek, laneCount)
    : visibleLanesPerWeek;

  return (
    <WeekExpansion.Provider value={{ expanded, setExpanded, weekId: id }}>
      <div
        id={id}
        className={className}
        data-expanded={expanded || undefined}
        style={{ "--lanes": lanes } as CSSProperties}
      >
        {children}
      </div>
    </WeekExpansion.Provider>
  );
}

/** Renders `children` only while the week is in the given state. */
export function WhenExpanded({
  expanded,
  children,
}: {
  expanded: boolean;
  children: ReactNode;
}) {
  const context = useContext(WeekExpansion);
  return context?.expanded === expanded ? children : null;
}

export function WeekExpansionToggle({
  expand,
  href,
  label,
  className,
  children,
}: {
  expand: boolean;
  href: string;
  label?: string;
  className?: string;
  children: ReactNode;
}) {
  const context = useContext(WeekExpansion);
  return (
    <a
      href={href}
      className={className}
      role="button"
      aria-expanded={!expand}
      aria-controls={context?.weekId}
      aria-label={label}
      onClick={(event) => {
        if (!context) return;
        event.preventDefault();
        context.setExpanded(expand);
      }}
    >
      {children}
    </a>
  );
}
