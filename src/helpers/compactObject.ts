export default function compactObject<T extends object>(
  newContent: T
): Partial<T> {
  return Object.fromEntries(
    Object.entries(newContent).filter(([_, v]) => v !== null && v !== "")
  ) as unknown as Partial<T>;
}
