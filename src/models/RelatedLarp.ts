import { RelatedLarpType } from "@/generated/prisma/client";
import prisma from "@/prisma";
import z from "zod";

const zRelatedLarpType = z.enum<typeof RelatedLarpType>(RelatedLarpType);

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
  remove: RelatedLarpRemovable[]
) {
  const promises: Promise<unknown>[] = [];

  for (const { leftId, rightId, type } of add) {
    promises.push(
      prisma.relatedLarp.upsert({
        where: { leftId_rightId: { leftId, rightId } },
        create: { leftId, rightId, type },
        update: { type },
      })
    );
  }

  if (remove.length > 0) {
    promises.push(
      prisma.relatedLarp.deleteMany({
        where: {
          OR: remove.map(({ leftId, rightId }) => ({ leftId, rightId })),
        },
      })
    );
  }

  await Promise.all(promises);
}
