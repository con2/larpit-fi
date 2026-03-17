import prisma from "@/prisma";

export function parseDateFi(dateStr: string): string | null {
  if (!dateStr) {
    return null;
  }

  const match = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  console.warn("INVALID DATE:", dateStr);
  return null;
}

export function parseUnixTimestamp(
  val: string | number | null | undefined,
): string | null {
  if (!val) return null;
  const num = typeof val === "number" ? val : parseInt(String(val), 10);
  if (isNaN(num) || num === 0) return null;
  return new Date(num * 1000).toISOString().slice(0, 10);
}

export async function loadMunicipalityMapping(): Promise<Record<string, string>> {
  const municipalities = await prisma.municipality.findMany();
  const mapping: Record<string, string> = {};
  for (const municipality of municipalities) {
    if (!municipality.nameFi) continue;
    mapping[municipality.nameFi.toLowerCase()] = municipality.id;
  }
  return mapping;
}
