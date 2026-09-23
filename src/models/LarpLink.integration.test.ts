import { Language, LarpLinkType } from "@/generated/prisma/client";
import prisma from "@/prisma";
import { truncateAll } from "@/test/truncate";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { handleLarpLinks } from "./LarpLink";

describe("handleLarpLinks", () => {
  beforeEach(truncateAll);
  afterAll(() => prisma.$disconnect());

  it("bumps the larp's updatedAt when links change", async () => {
    const longAgo = new Date("2020-01-01T00:00:00Z");
    const larp = await prisma.larp.create({
      data: { name: "Test Larp", language: Language.fi, updatedAt: longAgo },
    });

    await handleLarpLinks(
      larp.id,
      [{ type: LarpLinkType.PHOTOS, href: "https://larppikuvat.fi/test" }],
      [],
    );

    const updated = await prisma.larp.findUniqueOrThrow({
      where: { id: larp.id },
    });
    expect(updated.updatedAt.getTime()).toBeGreaterThan(longAgo.getTime());
  });

  it("leaves updatedAt alone when there is nothing to change", async () => {
    const longAgo = new Date("2020-01-01T00:00:00Z");
    const larp = await prisma.larp.create({
      data: { name: "Test Larp", language: Language.fi, updatedAt: longAgo },
    });

    await handleLarpLinks(larp.id, [], []);

    const unchanged = await prisma.larp.findUniqueOrThrow({
      where: { id: larp.id },
    });
    expect(unchanged.updatedAt).toEqual(longAgo);
  });
});
