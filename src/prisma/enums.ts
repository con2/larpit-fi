import type { Row } from "./models";

type ValuesOf<T> = T[keyof T];
/** Resolves to `true` only when the object lists every member of the contract's enum. */
type Exhaustive<Obj, Union> = [Exclude<Union, ValuesOf<Obj>>] extends [never]
  ? true
  : never;

export const UserRole = {
  NOT_VERIFIED: "NOT_VERIFIED",
  VERIFIED: "VERIFIED",
  MODERATOR: "MODERATOR",
  ADMIN: "ADMIN",
} as const satisfies Record<string, Row<"User">["role"]>;
export type UserRole = ValuesOf<typeof UserRole>;
true satisfies Exhaustive<typeof UserRole, Row<"User">["role"]>;

export const EditFormPreference = {
  FULL: "FULL",
  COMPACT: "COMPACT",
} as const satisfies Record<string, Row<"User">["editFormPreference"]>;
export type EditFormPreference = ValuesOf<typeof EditFormPreference>;
true satisfies Exhaustive<
  typeof EditFormPreference,
  Row<"User">["editFormPreference"]
>;

export const TokenType = {
  EMAIL_VERIFICATION: "EMAIL_VERIFICATION",
  ACCOUNT_REMOVAL: "ACCOUNT_REMOVAL",
} as const satisfies Record<string, Row<"VerificationToken">["type"]>;
export type TokenType = ValuesOf<typeof TokenType>;
true satisfies Exhaustive<typeof TokenType, Row<"VerificationToken">["type"]>;

export const LarpType = {
  ONE_SHOT: "ONE_SHOT",
  CAMPAIGN_LARP: "CAMPAIGN_LARP",
  CAMPAIGN: "CAMPAIGN",
  MULTIPLE_RUNS: "MULTIPLE_RUNS",
  OTHER_EVENT_SERIES: "OTHER_EVENT_SERIES",
  OTHER_EVENT: "OTHER_EVENT",
} as const satisfies Record<string, Row<"Larp">["type"]>;
export type LarpType = ValuesOf<typeof LarpType>;
true satisfies Exhaustive<typeof LarpType, Row<"Larp">["type"]>;

export const Language = {
  fi: "fi",
  en: "en",
  sv: "sv",
  OTHER: "OTHER",
} as const satisfies Record<string, Row<"Larp">["language"]>;
export type Language = ValuesOf<typeof Language>;
true satisfies Exhaustive<typeof Language, Row<"Larp">["language"]>;

export const Openness = {
  OPEN: "OPEN",
  TARGETED: "TARGETED",
  INVITE_ONLY: "INVITE_ONLY",
} as const satisfies Record<string, NonNullable<Row<"Larp">["openness"]>>;
export type Openness = ValuesOf<typeof Openness>;
true satisfies Exhaustive<
  typeof Openness,
  NonNullable<Row<"Larp">["openness"]>
>;

export const RelatedLarpType = {
  SEQUEL: "SEQUEL",
  SPINOFF: "SPINOFF",
  IN_CAMPAIGN: "IN_CAMPAIGN",
  IN_SERIES: "IN_SERIES",
  RUN_OF: "RUN_OF",
  RERUN_OF: "RERUN_OF",
  PLAYED_AT: "PLAYED_AT",
} as const satisfies Record<string, Row<"RelatedLarp">["type"]>;
export type RelatedLarpType = ValuesOf<typeof RelatedLarpType>;
true satisfies Exhaustive<typeof RelatedLarpType, Row<"RelatedLarp">["type"]>;

export const RelatedUserRole = {
  EDITOR: "EDITOR",
  CREATED_BY: "CREATED_BY",
  GAME_MASTER: "GAME_MASTER",
  TEAM_MEMBER: "TEAM_MEMBER",
  VOLUNTEER: "VOLUNTEER",
  PLAYER: "PLAYER",
  FAVORITE: "FAVORITE",
  LOCAL_SIGNUP_YES: "LOCAL_SIGNUP_YES",
  LOCAL_SIGNUP_MAYBE: "LOCAL_SIGNUP_MAYBE",
  LOCAL_SIGNUP_NO: "LOCAL_SIGNUP_NO",
} as const satisfies Record<string, Row<"RelatedUser">["role"]>;
export type RelatedUserRole = ValuesOf<typeof RelatedUserRole>;
true satisfies Exhaustive<typeof RelatedUserRole, Row<"RelatedUser">["role"]>;

export const LocalSignupStatus = {
  DISABLED: "DISABLED",
  PUBLIC: "PUBLIC",
  CODE_REQUIRED: "CODE_REQUIRED",
} as const satisfies Record<string, Row<"Larp">["localSignupStatus"]>;
export type LocalSignupStatus = ValuesOf<typeof LocalSignupStatus>;
true satisfies Exhaustive<
  typeof LocalSignupStatus,
  Row<"Larp">["localSignupStatus"]
>;

export const RelatedUserVisibility = {
  PARTICIPANTS: "PARTICIPANTS",
  GM: "GM",
  ONLY_ME: "ONLY_ME",
} as const satisfies Record<string, Row<"RelatedUser">["visibility"]>;
export type RelatedUserVisibility = ValuesOf<typeof RelatedUserVisibility>;
true satisfies Exhaustive<
  typeof RelatedUserVisibility,
  Row<"RelatedUser">["visibility"]
>;

export const LarpLinkType = {
  HOMEPAGE: "HOMEPAGE",
  PHOTOS: "PHOTOS",
  SOCIAL_MEDIA: "SOCIAL_MEDIA",
  PLAYER_GUIDE: "PLAYER_GUIDE",
  SIGNUP: "SIGNUP",
  OTHER: "OTHER",
} as const satisfies Record<string, Row<"LarpLink">["type"]>;
export type LarpLinkType = ValuesOf<typeof LarpLinkType>;
true satisfies Exhaustive<typeof LarpLinkType, Row<"LarpLink">["type"]>;

export const SubmitterRole = {
  NONE: "NONE",
  GAME_MASTER: "GAME_MASTER",
  TEAM_MEMBER: "TEAM_MEMBER",
  VOLUNTEER: "VOLUNTEER",
  PLAYER: "PLAYER",
} as const satisfies Record<string, Row<"ModerationRequest">["submitterRole"]>;
export type SubmitterRole = ValuesOf<typeof SubmitterRole>;
true satisfies Exhaustive<
  typeof SubmitterRole,
  Row<"ModerationRequest">["submitterRole"]
>;

export const EditStatus = {
  PENDING_VERIFICATION: "PENDING_VERIFICATION",
  VERIFIED: "VERIFIED",
  AUTO_APPROVED: "AUTO_APPROVED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  WITHDRAWN: "WITHDRAWN",
} as const satisfies Record<string, Row<"ModerationRequest">["status"]>;
export type EditStatus = ValuesOf<typeof EditStatus>;
true satisfies Exhaustive<
  typeof EditStatus,
  Row<"ModerationRequest">["status"]
>;

export const EditAction = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  CLAIM: "CLAIM",
  DELETE: "DELETE",
} as const satisfies Record<string, Row<"ModerationRequest">["action"]>;
export type EditAction = ValuesOf<typeof EditAction>;
true satisfies Exhaustive<
  typeof EditAction,
  Row<"ModerationRequest">["action"]
>;
