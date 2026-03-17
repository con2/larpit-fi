/**
 * HTML form submission normalizes textarea newlines to CRLF (\r\n), but
 * client-side maxLength and JS String.length count only LF (\n). Strip \r
 * from all string values to keep server-side length counts consistent with
 * what the user sees.
 */
export function normalizeFormData(
  data: FormData
): Record<string, FormDataEntryValue> {
  return Object.fromEntries(
    Array.from(data.entries()).map(([key, value]) => [
      key,
      typeof value === "string" ? value.replace(/\r/g, "") : value,
    ])
  );
}
