import { and, or } from "@prisma/orm-postgres/orm-client";
import z from "zod";

import { db } from "@/prisma/db";
import { RelatedLarpType } from "@/prisma/enums";

const zRelatedLarpType = z.enum(RelatedLarpType);

export const RelatedLarpAddable = z.object({
  leftId: z.string().uuid(),
  rightId: z.string().uuid(),
  type: zRelatedLarpType,
});

export type RelatedLarpAddable = z.infer<typeof RelatedLarpAddable>;

export const RelatedLarpRemovable = z.object({
  leftId: z.string().uuid(),
  rightId: z.string().uuid(),
  type: zRelatedLarpType,
});

export type RelatedLarpRemovable = z.infer<typeof RelatedLarpRemovable>;

export async function handleRelatedLarps(
  add: RelatedLarpAddable[],
  remove: RelatedLarpRemovable[],
) {
  const promises: Promise<unknown>[] = [];

  for (const { leftId, rightId, type } of add) {
    promises.push(
      db.orm.public.RelatedLarp.upsert({
        create: { leftId, rightId, type },
        update: { type },
      }),
    );
  }

  if (remove.length > 0) {
    promises.push(
      db.orm.public.RelatedLarp.where((r) =>
        or(
          ...remove.map(({ leftId, rightId }) =>
            and(r.leftId.eq(leftId), r.rightId.eq(rightId)),
          ),
        ),
      ).deleteAndCount(),
    );
  }

  await Promise.all(promises);
}
