const runSuffixPattern = /\s*\((\d+\..*)\)$/;

/** Splits "Ehtoo (2. pelautus)" into the name and the rerun suffix shown in dim weight. */
export function splitRunSuffix(name: string): {
  name: string;
  suffix: string | null;
} {
  const match = name.match(runSuffixPattern);
  if (!match) return { name, suffix: null };
  return { name: name.slice(0, match.index), suffix: match[1] };
}
