"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function CalendarKeyboardNav({
  prevHref,
  nextHref,
  todayHref,
}: {
  prevHref: string;
  nextHref: string;
  todayHref: string;
}) {
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.defaultPrevented ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLSelectElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      )
        return;
      if (e.key === "ArrowLeft") router.push(prevHref);
      if (e.key === "ArrowRight") router.push(nextHref);
      if (e.key === "t" || e.key === "T") router.push(todayHref);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [prevHref, nextHref, todayHref, router]);

  return null;
}
