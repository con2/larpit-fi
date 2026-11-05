"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface Props {
  /** Maps the `#year-YYYY` hash of each collapsed year to the URL that renders it expanded. */
  collapsedHrefs: Record<string, string>;
}

/**
 * Expands a collapsed year when the URL hash points at it, so timeline bars and links such as
 * the statistics page's year bars (`/larp#year-YYYY`) land on the year's rows instead of its
 * expander.
 */
export default function ExpandYearOnHash({ collapsedHrefs }: Props) {
  const router = useRouter();

  useEffect(() => {
    const expand = () => {
      const href = collapsedHrefs[window.location.hash];
      if (href) router.replace(href);
    };
    expand();
    window.addEventListener("hashchange", expand);
    return () => window.removeEventListener("hashchange", expand);
  }, [collapsedHrefs, router]);

  return null;
}
