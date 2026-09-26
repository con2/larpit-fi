import { uuid7ToInstant } from "@con2/components/helpers";

export function larpToApi<
  T extends {
    id: string;
    updatedAt: Date;
    municipality: { nameFi: string | null } | null;
  },
>(
  larp: T,
): Omit<T, "updatedAt" | "municipality"> & {
  createdAt: string;
  updatedAt: string;
  municipality: string | null;
} {
  return {
    ...larp,
    createdAt: uuid7ToInstant(larp.id).toString(),
    updatedAt: larp.updatedAt.toISOString(),
    municipality: larp.municipality?.nameFi ?? null,
  };
}
