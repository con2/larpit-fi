import type { Language } from "@/prisma/enums";

import { splitRunSuffix } from "./larpName";

const runAliasPrefix: Record<Language, string> = {
  fi: "p",
  en: "run",
  sv: "run",
  OTHER: "run",
};

const romanNumeralValues: Record<string, number> = { I: 1, V: 5, X: 10 };

function parseRomanNumeral(numeral: string): number {
  let total = 0;
  for (let i = 0; i < numeral.length; i++) {
    const value = romanNumeralValues[numeral[i]];
    const next = romanNumeralValues[numeral[i + 1]] ?? 0;
    total += value < next ? -value : value;
  }
  return total;
}

const ordinalWords: Record<string, number> = {
  ensimmäinen: 1,
  toinen: 2,
  kolmas: 3,
  neljäs: 4,
  viides: 5,
  kuudes: 6,
  seitsemäs: 7,
  kahdeksas: 8,
  yhdeksäs: 9,
  kymmenes: 10,
  first: 1,
  second: 2,
  third: 3,
  fourth: 4,
  fifth: 5,
  sixth: 6,
  seventh: 7,
  eighth: 8,
  ninth: 9,
  tenth: 10,
};

const numeralToken = /\d+|\b[IVX]+\b/g;
const ordinalWordToken = new RegExp(
  `(?<!\\p{L})(?:${Object.keys(ordinalWords).join("|")})(?!\\p{L})`,
  "giu",
);

function parseRunNumberToken(token: string): number {
  if (/\d/.test(token)) return Number(token);
  return ordinalWords[token.toLowerCase()] ?? parseRomanNumeral(token);
}

/**
 * The run number of a run identifier such as "2. pelautus", "Run II" or "toinen pelautus"; null
 * unless the identifier has exactly one.
 */
export function parseRunNumber(runSuffix: string): number | null {
  const tokens = [
    ...runSuffix.matchAll(numeralToken),
    ...runSuffix.matchAll(ordinalWordToken),
  ].map(([token]) => token);
  return tokens.length === 1 ? parseRunNumberToken(tokens[0]) : null;
}

const transliterations: Record<string, string> = {
  æ: "ae",
  ø: "o",
  ß: "ss",
  þ: "th",
  ð: "d",
  đ: "d",
  ł: "l",
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[æøßþðđł]/g, (letter) => transliterations[letter])
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function truncateSlug(slug: string, maxLength: number): string {
  if (slug.length <= maxLength) return slug;
  const cut = slug.slice(0, maxLength + 1);
  const lastHyphen = cut.lastIndexOf("-");
  return lastHyphen > 0 ? cut.slice(0, lastHyphen) : slug.slice(0, maxLength);
}

/**
 * Suggests a short address for a larp from its name. A run identifier with a single run number
 * becomes a compact language-specific tail: "Welcome to Grayhaven (2. pelautus)" in Finnish
 * becomes "welcome-to-grayhaven-p2", and "Odysseus – Run 2" in English "odysseus-run2".
 */
export function suggestLarpAlias(
  name: string,
  language: Language,
  maxLength: number,
): string | null {
  const { name: baseName, suffix } = splitRunSuffix(name);
  const runNumber = suffix ? parseRunNumber(suffix) : null;

  if (runNumber === null) {
    return truncateSlug(slugify(name), maxLength) || null;
  }

  const runTail = `-${runAliasPrefix[language]}${runNumber}`;
  const base = truncateSlug(slugify(baseName), maxLength - runTail.length);
  return base ? `${base}${runTail}` : null;
}
