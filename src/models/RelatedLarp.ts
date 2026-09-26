import { and, or } from "@prisma/orm-postgres/orm-client";
import z from "zod";

import type { Tx } from "@/prisma/db";
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
  tx: Tx,
  add: RelatedLarpAddable[],
  remove: RelatedLarpRemovable[],
) {
  if (remove.length > 0) {
    await tx.orm.public.RelatedLarp.where((r) =>
      or(
        ...remove.map(({ leftId, rightId }) =>
          and(r.leftId.eq(leftId), r.rightId.eq(rightId)),
        ),
      ),
    ).deleteAndCount();
  }

  for (const { leftId, rightId, type } of add) {
    await tx.orm.public.RelatedLarp.upsert({
      create: { leftId, rightId, type },
      update: { type },
    });
  }
}
