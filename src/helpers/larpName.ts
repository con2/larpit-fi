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

const runSuffixPattern = /\s*\((\d+\..*)\)$/;

/**
 * Splits "Ehtoo (2. pelautus)" into the name and the rerun suffix shown in dim weight. The name
 * is typeset with `typesetDashes` first.
 */
export function splitRunSuffix(rawName: string): {
  name: string;
  suffix: string | null;
} {
  const name = typesetDashes(rawName);
  const match = name.match(runSuffixPattern);
  if (!match) return { name, suffix: null };
  return { name: name.slice(0, match.index), suffix: match[1] };
}
