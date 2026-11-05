"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

import styles from "./page.module.scss";

interface Props {
  /** Server-rendered fallback that shows the whole year when JavaScript is off. */
  href: string;
  label: string;
  children: ReactNode;
}

export default function YearExpander({ href, label, children }: Props) {
  const [expanded, setExpanded] = useState(false);
  const revealedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (expanded) revealedRef.current?.querySelector("a")?.focus();
  }, [expanded]);

  if (expanded) {
    return (
      <div ref={revealedRef} className="lf-section">
        {children}
      </div>
    );
  }

  return (
    <a
      href={href}
      className={styles.more}
      onClick={(event) => {
        event.preventDefault();
        setExpanded(true);
      }}
    >
      {label} ↓
    </a>
  );
}
