import { cache } from "react";

import { auth } from "@/auth";
import { db, dbRead } from "@/prisma/db";
import { pool, readPool } from "@/prisma/pool";
import { query, queryRead } from "@/prisma/sql";

/**
 * Picks the database for a page's reads. Signed-in requests read the primary, so the page a
 * server action redirects to after a write sees that write; anonymous requests read the replica.
 * Cached per request, so metadata, page and components share one session lookup.
 */
export const getReader = cache(async () => {
  const session = await auth();
  return session?.user?.id
    ? { db, query, pool }
    : { db: dbRead, query: queryRead, pool: readPool };
});
