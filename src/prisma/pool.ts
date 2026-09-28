import { Pool } from "pg";

import { databaseReplicaUrl, databaseUrl } from "@/config";

declare global {
  var pgPool: Pool | undefined;
  var pgReadPool: Pool | undefined;
}

function createPool(connectionString: string): Pool {
  return new Pool({ connectionString, max: 10 });
}

/**
 * One pg.Pool per process, shared by the ORM client and raw SQL. In development the module is
 * re-evaluated on hot reload, so the pool is parked on globalThis to avoid leaking connections.
 */
export const pool: Pool =
  process.env.NODE_ENV === "production"
    ? createPool(databaseUrl)
    : (globalThis.pgPool ??= createPool(databaseUrl));

/**
 * Pool for reads that may trail the primary by replication lag: public pages and APIs whose
 * data the current request did not just write. Without DATABASE_URL_REPLICA it is `pool`
 * itself, so callers need not care whether a replica exists.
 */
export const readPool: Pool = databaseReplicaUrl
  ? process.env.NODE_ENV === "production"
    ? createPool(databaseReplicaUrl)
    : (globalThis.pgReadPool ??= createPool(databaseReplicaUrl))
  : pool;
