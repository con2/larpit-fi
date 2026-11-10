"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

/**
 * Open state of a click-to-open menu. A pointer down outside the container or Escape closes it;
 * Escape also returns focus to the button.
 */
export default function useDropdown() {
  const pathname = usePathname();
  // Remembering where the menu was opened closes it when a link inside navigates away.
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const isOpen = openedAt === pathname;
  const setOpen = (open: boolean) => setOpenedAt(open ? pathname : null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!isOpen) return;
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpenedAt(null);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenedAt(null);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  return { isOpen, setOpen, containerRef, buttonRef, menuId };
}
