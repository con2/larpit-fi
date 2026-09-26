import type { JsonValue } from "@prisma/orm-postgres/target/codec-types";

export type { JsonValue };

/**
 * Serializes a value for a jsonb column the way JSON.stringify would, so objects with custom
 * toJSON (Temporal dates from the moderation request forms) store as their JSON form.
 */
export function toJson(value: unknown): JsonValue {
  return JSON.parse(JSON.stringify(value ?? null));
}
