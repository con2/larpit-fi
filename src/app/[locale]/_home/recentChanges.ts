import { EditAction, Language } from "@/prisma/enums";
import { getReader } from "@/prisma/reader";
import { sql } from "@/prisma/sql";

export interface RecentChange {
  resolvedAt: Date;
  action: EditAction;
  id: string;
  alias: string | null;
  name: string;
  language: Language;
  isCancelled: boolean;
}

export async function getRecentChanges(
  limit: number = 7,
): Promise<RecentChange[]> {
  const { query: readQuery } = await getReader();
  return readQuery<RecentChange>(sql`
    select
      resolved_at as "resolvedAt",
      action,
      id,
      alias,
      name,
      language,
      is_cancelled as "isCancelled"
    from
      (
        select
          m.resolved_at,
          m.action,
          l.id,
          l.alias,
          l.name,
          l.language,
          l.cancelled_at is not null as is_cancelled,
          row_number () over (
            partition by l.id
            order by m.resolved_at desc nulls last
          ) as rn
        from
          moderation_request m
          join larp l on (m.larp_id = l.id)
        where
          l.openness != 'INVITE_ONLY'
          and m.status in ('APPROVED', 'AUTO_APPROVED')
          and m.action in ('CREATE', 'UPDATE')
          and m.larp_id is not null
        order by 1 desc nulls last
        limit ${10 * limit}
      )
    where
      rn = 1
    limit ${limit}
  `);
}
