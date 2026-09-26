import { pool } from "@/prisma/pool";

export async function truncateAll() {
  await pool.query(
    'truncate moderation_request, related_larp, related_user, larp_link, larp, "user" cascade',
  );
}
