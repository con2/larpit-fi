import { toISODateNull, uuid7ToInstant } from "@/helpers/temporal";

export function larpToApi<
  T extends {
    id: string;
    startsAt: Date | null;
    endsAt: Date | null;
    signupStartsAt: Date | null;
    signupEndsAt: Date | null;
    updatedAt: Date;
    municipality: { nameFi: string | null } | null;
  },
>(
  larp: T
): Omit<
  T,
  "startsAt" | "endsAt" | "signupStartsAt" | "signupEndsAt" | "updatedAt" | "municipality"
> & {
  createdAt: string;
  startsAt: string | null;
  endsAt: string | null;
  signupStartsAt: string | null;
  signupEndsAt: string | null;
  updatedAt: string;
  municipality: string | null;
} {
  return {
    ...larp,
    createdAt: uuid7ToInstant(larp.id).toString(),
    startsAt: toISODateNull(larp.startsAt),
    endsAt: toISODateNull(larp.endsAt),
    signupStartsAt: toISODateNull(larp.signupStartsAt),
    signupEndsAt: toISODateNull(larp.signupEndsAt),
    updatedAt: larp.updatedAt.toISOString(),
    municipality: larp.municipality?.nameFi ?? null,
  };
}
