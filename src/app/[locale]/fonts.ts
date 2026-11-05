import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";

// Without the wdth and opsz axes the condensed headings silently fall back to width 100.
export const display = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  axes: ["opsz", "wdth"],
  variable: "--larpit-display-font",
  fallback: ["system-ui", "sans-serif"],
});

export const sans = Geist({
  subsets: ["latin", "latin-ext"],
  // Larp pages set fluff text in italic; without the italic files browsers fake the slant.
  style: ["normal", "italic"],
  variable: "--larpit-default-font",
  fallback: ["system-ui", "sans-serif"],
});

export const mono = Geist_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--larpit-mono-font",
  fallback: ["ui-monospace", "monospace"],
});

export const fontVariableClassNames = [
  display.variable,
  sans.variable,
  mono.variable,
].join(" ");
