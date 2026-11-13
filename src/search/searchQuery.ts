export const maxQueryLength = 100;

export interface SearchQuery {
  /** What the user typed, trimmed and capped; for display and highlighting. */
  text: string;
  /** `to_tsquery` input, or null when nothing searchable is left. */
  tsquery: string | null;
  /** `tsquery` with `foldForeignLetters` applied, for matching folded larp names. */
  foldedTsquery: string | null;
}

/**
 * Lowercase letters from outside Finnish that people commonly type without their marks, and
 * what they become. Å, Ä and Ö are Finnish letters of their own and stay. `foldForeignLettersSql`
 * renders the same mapping, so query and document fold alike.
 */
export const foreignLetterFolds: Readonly<Record<string, string>> = {
  ...Object.fromEntries(
    [
      ["a", "àáâãāăą"],
      ["c", "çćĉč"],
      ["d", "ďđð"],
      ["e", "èéêëēĕėęě"],
      ["g", "ĝğġģ"],
      ["i", "ìíîïĩīĭįı"],
      ["l", "ĺļľł"],
      ["n", "ñńņň"],
      ["o", "òóôõōŏőø"],
      ["r", "ŕŗř"],
      ["s", "śŝşš"],
      ["t", "ţť"],
      ["u", "ùúûüũūŭůűų"],
      ["y", "ýÿ"],
      ["z", "źżž"],
    ].flatMap(([plain, marked]) =>
      [...marked].map((letter) => [letter, plain]),
    ),
  ),
  æ: "ae",
  œ: "oe",
  ß: "ss",
  þ: "th",
};

const foreignLetterPattern = new RegExp(
  `[${Object.keys(foreignLetterFolds).join("")}]`,
  "gu",
);

/** Lowercases and folds `foreignLetterFolds`, so that "Erreàn" and "errean" compare equal. */
export function foldForeignLetters(text: string): string {
  return text
    .toLowerCase()
    .replace(foreignLetterPattern, (letter) => foreignLetterFolds[letter]);
}

/**
 * The SQL counterpart of `foldForeignLetters` for a text expression. The letters are constants
 * of this module, never user input, so they are written into the SQL as literals.
 */
export function foldForeignLettersSql(expression: string): string {
  const single = Object.entries(foreignLetterFolds).filter(
    ([, plain]) => plain.length === 1,
  );
  const multiple = Object.entries(foreignLetterFolds).filter(
    ([, plain]) => plain.length > 1,
  );
  const from = single.map(([letter]) => letter).join("");
  const to = single.map(([, plain]) => plain).join("");
  return multiple.reduce(
    (sql, [letter, plain]) => `replace(${sql}, '${letter}', '${plain}')`,
    `translate(lower(${expression}), '${from}', '${to}')`,
  );
}

function toTsquery(tokens: string[]): string {
  return tokens
    .map((token, index) => (index === tokens.length - 1 ? `${token}:*` : token))
    .join(" & ");
}

/**
 * Every word must match, and the last one may be unfinished. Tokens are reduced to letters and
 * digits, so the result never contains `to_tsquery` operators from the input.
 */
export function parseSearchQuery(raw: string): SearchQuery {
  const text = raw.trim().slice(0, maxQueryLength);
  const tokens = text
    .split(/\s+/)
    .map((token) => token.replace(/[^\p{L}\p{N}]/gu, ""))
    .filter(Boolean);
  if (tokens.length === 0) return { text, tsquery: null, foldedTsquery: null };
  return {
    text,
    tsquery: toTsquery(tokens),
    foldedTsquery: toTsquery(tokens.map(foldForeignLetters)),
  };
}
