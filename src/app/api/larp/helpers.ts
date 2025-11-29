import { toISODateNull } from "@/helpers/temporal";

export function larpToApi<
  T extends {
    id: string;
    startsAt: Date | null;
    endsAt: Date | null;
    signupStartsAt: Date | null;
    signupEndsAt: Date | null;
    municipality: { nameFi: string | null } | null;
  },
>(
  larp: T
): Omit<
  T,
  "startsAt" | "endsAt" | "signupStartsAt" | "signupEndsAt" | "municipality"
> & {
  startsAt: string | null;
  endsAt: string | null;
  signupStartsAt: string | null;
  signupEndsAt: string | null;
  municipality: string | null;
} {
  return {
    ...larp,
    startsAt: toISODateNull(larp.startsAt),
    endsAt: toISODateNull(larp.endsAt),
    signupStartsAt: toISODateNull(larp.signupStartsAt),
    signupEndsAt: toISODateNull(larp.signupEndsAt),
    municipality: larp.municipality?.nameFi ?? null,
  };
}
