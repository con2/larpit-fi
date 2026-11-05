export const themeCookieName = "larpit-theme";

export const themePreferences = ["auto", "night", "day"] as const;
export type ThemePreference = (typeof themePreferences)[number];

export function parseThemePreference(
  value: string | undefined,
): ThemePreference {
  return themePreferences.includes(value as ThemePreference)
    ? (value as ThemePreference)
    : "auto";
}

export function toBootstrapTheme(
  preference: ThemePreference,
): "dark" | "light" | undefined {
  switch (preference) {
    case "night":
      return "dark";
    case "day":
      return "light";
    case "auto":
      return undefined;
  }
}

// Runs before first paint. With Auto there is no way to know the colour scheme on the server, so
// the attribute is filled in here, and kept in sync while the preference stays Auto.
export const autoThemeScript = `(function(){var d=document.documentElement,m=window.matchMedia("(prefers-color-scheme: dark)");function a(){if(d.getAttribute("data-larpit-theme")==="auto")d.setAttribute("data-bs-theme",m.matches?"dark":"light")}a();m.addEventListener("change",a)})()`;
