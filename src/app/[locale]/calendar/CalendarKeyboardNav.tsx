"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function CalendarKeyboardNav({
  prevHref,
  nextHref,
}: {
  prevHref: string;
  nextHref: string;
}) {
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft") router.push(prevHref);
      if (e.key === "ArrowRight") router.push(nextHref);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [prevHref, nextHref, router]);

  return null;
}
