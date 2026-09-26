import type { DefaultModelRow } from "@prisma/orm-postgres/orm-client";

import type { WithDates } from "./dates";
import type { Contract } from "./contract.d.ts";

/** A model's row exactly as the ORM returns it (timestamps as strings). */
export type Row<Model extends string> = DefaultModelRow<
  Contract,
  Model,
  "public"
>;

/** A model's row as the application uses it: timestamps parsed to `Date` (see `dates.ts`). */
export type Larp = WithDates<Row<"Larp">>;
export type LarpLink = Row<"LarpLink">;
export type RelatedLarp = Row<"RelatedLarp">;
export type RelatedUser = WithDates<Row<"RelatedUser">>;
export type User = WithDates<Row<"User">>;
export type Municipality = Row<"Municipality">;
export type Country = Row<"Country">;
export type ModerationRequest = WithDates<Row<"ModerationRequest">>;
export type Page = WithDates<Row<"Page">>;
export type UnauthenticatedSignup = WithDates<Row<"UnauthenticatedSignup">>;
export type VerificationToken = WithDates<Row<"VerificationToken">>;
export type Holiday = Row<"Holiday">;
