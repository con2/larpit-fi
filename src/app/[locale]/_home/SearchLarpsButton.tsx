"use client";

import Link from "next/link";
import { MouseEvent } from "react";

import { useCommandPalette } from "@/components/ui/CommandPalette";

/** Opens the command palette; without JavaScript it is a link to the search page. */
export default function SearchLarpsButton({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  const { open } = useCommandPalette();

  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    open();
  }

  return (
    <Link href="/search" className={className} onClick={onClick}>
      {label}
    </Link>
  );
}
