import postgres from "@prisma/orm-postgres/runtime";

import { pool, readPool } from "@/prisma/pool";
import type { Contract } from "./contract.d.ts";
import contractJson from "./contract.json" with { type: "json" };

/** Module-level singleton for the process lifetime; shares its connection pool with raw SQL. */
export const db = postgres<Contract>({ contractJson, pg: pool });

/**
 * Same contract on the read replica, for public read paths only. Anything per-user, anything
 * that follows a write in the same request, and everything in server actions uses `db`: a
 * replica may trail the primary by a moment, and the primary is where role changes and fresh
 * writes are visible. Identical to `db` when no replica is configured.
 */
export const dbRead =
  readPool === pool ? db : postgres<Contract>({ contractJson, pg: readPool });

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
