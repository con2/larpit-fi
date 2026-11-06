const spacedHyphen = /(?<=\S)([ \u00a0])-(?=[ \u00a0])/g;

/**
 * Turns a hyphen between spaces into an en dash: "Yö - 2. pelautus" becomes "Yö – 2. pelautus".
 * Only spaces count, not line breaks, so a Markdown list item stays a list item.
 */
export function typesetDashes(text: string): string {
  return text.replace(spacedHyphen, "$1–");
}

const markdownCode = /(```[\s\S]*?```|`[^`\n]*`)/;

/** `typesetDashes` for Markdown, leaving code spans and fenced code blocks alone. */
export function typesetMarkdownDashes(markdown: string): string {
  return markdown
    .split(markdownCode)
    .map((part, index) => (index % 2 === 0 ? typesetDashes(part) : part))
    .join("");
}

const runKeyword = /\brun\b|pelautu/i;
const bracketedTail = /\s*[([]([^()[\]]*)[)\]]$/;
const tailSeparator = /\s+[-–—]\s+|,\s+/g;
const unseparatedTail = /\s+((?:\d+|[IVX]+)\.?\s*pelautu\p{L}*)$/iu;

/**
 * Splits off the run identifier of a larp name, such as "2. pelautus" or "Run 3", for showing
 * in a dimmer weight. The name is typeset with `typesetDashes` first.
 *
 * The run identifier is the last part of the name, in brackets or after a dash or a comma, if it
 * mentions a run ("run", or the stem "pelautu" to cover inflections and compounds). Failing that,
 * a trailing "3. pelautus" without a separator counts too. Any other last part stays in the name,
 * so "Pohjolan tuho – Kurssi 233: Kutsutut" (campaign, subcampaign, larp) is not split.
 */
export function splitRunSuffix(rawName: string): {
  name: string;
  suffix: string | null;
} {
  const name = typesetDashes(rawName);

  const bracketed = name.match(bracketedTail);
  if (bracketed) {
    return runKeyword.test(bracketed[1])
      ? { name: name.slice(0, bracketed.index), suffix: bracketed[1] }
      : { name, suffix: null };
  }

  const lastSeparator = [...name.matchAll(tailSeparator)].at(-1);
  if (lastSeparator) {
    const tail = name.slice(lastSeparator.index + lastSeparator[0].length);
    if (runKeyword.test(tail)) {
      return { name: name.slice(0, lastSeparator.index), suffix: tail };
    }
  }

  const unseparated = name.match(unseparatedTail);
  if (unseparated) {
    return { name: name.slice(0, unseparated.index), suffix: unseparated[1] };
  }

  return { name, suffix: null };
}
