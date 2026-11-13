export const maxQueryLength = 100;

export interface SearchQuery {
  /** What the user typed, trimmed and capped; for display and highlighting. */
  text: string;
  /** `to_tsquery` input, or null when nothing searchable is left. */
  tsquery: string | null;
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
  if (tokens.length === 0) return { text, tsquery: null };
  const terms = tokens.map((token, index) =>
    index === tokens.length - 1 ? `${token}:*` : token,
  );
  return { text, tsquery: terms.join(" & ") };
}
