/**
 * Parse a search parameter that may be a string, array, or undefined.
 * Handles common patterns:
 * - Convert string to array
 * - Use defaults when empty or includes ""
 * - Use all values when includes "ALL"
 * - Filter to only valid enum/set values
 */
export function parseSearchParam<T extends string>(
  value: string | string[] | undefined,
  options: {
    /** Default values when param is empty or includes "" */
    defaults: T[];
    /** All possible values (used when param includes "ALL") */
    allValues: T[];
    /** Validate that a string is a valid value of T */
    isValid: (v: string) => v is T;
  },
): T[] {
  let values: string[];

  if (typeof value === "string") {
    values = [value];
  } else if (!value) {
    values = [];
  } else {
    values = value;
  }

  if (values.length === 0 || values.includes("")) {
    return options.defaults;
  }

  if (values.includes("ALL")) {
    return options.allValues;
  }

  return values.filter(options.isValid);
}

/**
 * Create isValid function for an enum
 */
export function createEnumValidator<T extends Record<string, string>>(
  enumObj: T,
): (v: string) => v is T[keyof T] {
  const validValues = new Set(Object.values(enumObj));
  return (v: string): v is T[keyof T] => validValues.has(v);
}
