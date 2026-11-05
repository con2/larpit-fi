"use client";

import { useSyncExternalStore } from "react";

import { themePreferences, type ThemePreference } from "@/theme";
import {
  getThemePreference,
  setThemePreference,
  themeChangeEvent,
} from "./themeClient";

function subscribe(onChange: () => void) {
  window.addEventListener(themeChangeEvent, onChange);
  return () => window.removeEventListener(themeChangeEvent, onChange);
}

export default function ThemeSegmented({
  label,
  choices,
}: {
  label: string;
  choices: Record<ThemePreference, string>;
}) {
  const current = useSyncExternalStore(
    subscribe,
    getThemePreference,
    () => null,
  );
  return (
    <span className="lf-segmented" role="group" aria-label={label}>
      {themePreferences.map((preference) => (
        <button
          key={preference}
          type="button"
          aria-pressed={current === preference}
          onClick={() => setThemePreference(preference)}
        >
          {choices[preference]}
        </button>
      ))}
    </span>
  );
}
