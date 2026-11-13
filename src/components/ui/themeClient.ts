"use client";

import {
  themeCookieName,
  toBootstrapTheme,
  type ThemePreference,
} from "@/theme";

const oneYearSeconds = 60 * 60 * 24 * 365;

export function getThemePreference(): ThemePreference {
  return (document.documentElement.getAttribute("data-larpit-theme") ??
    "auto") as ThemePreference;
}

export function getEffectiveTheme(): "dark" | "light" {
  return document.documentElement.getAttribute("data-bs-theme") === "dark"
    ? "dark"
    : "light";
}

export function setThemePreference(preference: ThemePreference) {
  const root = document.documentElement;
  document.cookie = `${themeCookieName}=${preference}; path=/; max-age=${oneYearSeconds}; samesite=lax`;
  root.setAttribute("data-larpit-theme", preference);
  root.setAttribute(
    "data-bs-theme",
    toBootstrapTheme(preference) ??
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"),
  );
  window.dispatchEvent(new CustomEvent(themeChangeEvent));
}

export const themeChangeEvent = "larpit-theme-change";

/** With the Auto preference, takes the colour scheme from the browser. */
export function applyAutoTheme() {
  const root = document.documentElement;
  if (root.getAttribute("data-larpit-theme") !== "auto") return;
  root.setAttribute(
    "data-bs-theme",
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light",
  );
}
