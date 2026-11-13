import postgres from "@prisma/orm-postgres/runtime";

import { pool, readPool } from "@/prisma/pool";
import { contractFromJson } from "@prisma/orm-postgres/static";
import type { Contract } from "./contract.d.ts";
import contractJson from "./contract.json" with { type: "json" };

const contract = contractFromJson<Contract>(contractJson);

/** Module-level singleton for the process lifetime; shares its connection pool with raw SQL. */
export const db = postgres({ contract, pg: pool });

/**
 * Same contract on the read replica, for public read paths only; pages get it through
 * `getReader()`, which keeps signed-in requests on the primary. Anything per-user, anything
 * that follows a write in the same request, and everything in server actions uses `db`: a
 * replica may trail the primary by a moment, and the primary is where role changes and fresh
 * writes are visible. Identical to `db` when no replica is configured.
 */
export const dbRead =
  readPool === pool ? db : postgres({ contract, pg: readPool });

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
