import {
  isSignupOpen,
  isSignupOpeningSoon,
  isSignupOver,
} from "@/models/Larp.client";
import { Openness } from "@/prisma/enums";
import type { Larp } from "@/prisma/models";

export type SignupPillKind = "open" | "soon" | "over" | "cancelled";

export type SignupPillReason =
  | "cancelled"
  | "inviteOnly"
  | "openUntil"
  | "openIndefinitely"
  | "opens"
  | "over";

export interface SignupPillState {
  kind: SignupPillKind;
  reason: SignupPillReason;
  /** YYYY-MM-DD for openUntil and opens. */
  date?: string;
}

export type SignupPillLarp = Pick<
  Larp,
  | "openness"
  | "signupStartsAt"
  | "signupEndsAt"
  | "startsAt"
  | "endsAt"
  | "cancelledAt"
>;

/** Client-safe mapping of the signup status helpers in models/Larp to a status pill. */
export function getSignupPillState(
  larp: SignupPillLarp,
): SignupPillState | null {
  if (larp.cancelledAt) return { kind: "cancelled", reason: "cancelled" };
  if (larp.openness === Openness.INVITE_ONLY) {
    return { kind: "over", reason: "inviteOnly" };
  }
  if (isSignupOpen(larp)) {
    return larp.signupEndsAt
      ? { kind: "open", reason: "openUntil", date: larp.signupEndsAt }
      : { kind: "open", reason: "openIndefinitely" };
  }
  if (isSignupOpeningSoon(larp)) {
    return { kind: "soon", reason: "opens", date: larp.signupStartsAt! };
  }
  if (isSignupOver(larp)) return { kind: "over", reason: "over" };
  return null;
}
