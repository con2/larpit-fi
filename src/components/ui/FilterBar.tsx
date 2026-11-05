import Link from "next/link";
import { ReactNode } from "react";

import styles from "./FilterBar.module.scss";
import { CheckIcon, ChevronDownIcon } from "./icons";

export interface FilterOption {
  title: string;
  /** For options whose visible title is abbreviated, such as language codes. */
  fullTitle?: string;
  href: string;
  current: boolean;
}

interface CommonProps {
  /** False keeps the scroll position, for filters above content that stays in place. */
  scroll?: boolean;
}

/** A row of filter groups that wraps when it runs out of room. */
export default function FilterBar({
  label,
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={styles.filters}
      role={label ? "group" : undefined}
      aria-label={label}
    >
      {children}
    </div>
  );
}

/** A labelled segmented control whose options are links. */
export function FilterGroup({
  label,
  options,
  scroll,
  children,
}: CommonProps & {
  label: string;
  options: FilterOption[];
  children?: ReactNode;
}) {
  return (
    <div role="group" aria-label={label} className={styles.filterGroup}>
      <span className={styles.filterLabel} aria-hidden="true">
        {label}
      </span>
      <div className={styles.segmented}>
        {options.map((option) => (
          <Link
            key={option.href}
            href={option.href}
            scroll={scroll}
            aria-current={option.current ? "true" : undefined}
            aria-label={option.fullTitle}
            title={option.fullTitle}
          >
            {option.title}
          </Link>
        ))}
        {children}
      </div>
    </div>
  );
}

/**
 * Options that would not fit in a segmented control, behind a native disclosure. Goes inside a
 * FilterGroup as its last segment.
 */
export function FilterMenu({
  summary,
  isCurrent,
  options,
  scroll,
}: CommonProps & {
  summary: string;
  isCurrent: boolean;
  options: FilterOption[];
}) {
  return (
    <details className={styles.menu}>
      <summary aria-current={isCurrent ? "true" : undefined}>
        {summary} <ChevronDownIcon size={10} />
      </summary>
      <div className={styles.menuList}>
        {options.map((option) => (
          <Link
            key={option.href}
            href={option.href}
            scroll={scroll}
            aria-current={option.current ? "true" : undefined}
          >
            <span className={styles.check} aria-hidden="true">
              {option.current && <CheckIcon size={12} />}
            </span>
            {option.title}
          </Link>
        ))}
      </div>
    </details>
  );
}
