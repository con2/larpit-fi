import postgres from "@prisma/orm-postgres/runtime";

import { pool } from "@/prisma/pool";
import type { Contract } from "./contract.d.ts";
import contractJson from "./contract.json" with { type: "json" };

/** Module-level singleton for the process lifetime; shares its connection pool with raw SQL. */
export const db = postgres<Contract>({ contractJson, pg: pool });
