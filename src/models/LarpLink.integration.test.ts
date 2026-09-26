import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { iso, parseDates } from "@/prisma/dates";
import { db } from "@/prisma/db";
import { Language, LarpLinkType } from "@/prisma/enums";
import { pool } from "@/prisma/pool";
import { truncateAll } from "@/test/truncate";
import { handleLarpLinks } from "./LarpLink";

async function createLarpUpdatedAt(updatedAt: Date) {
  const larp = await db.orm.public.Larp.create({
    name: "Test Larp",
    language: Language.fi,
  });
  // The updatedAt preset stamps every write, so the timestamp is backdated behind its back.
  await pool.query("update larp set updated_at = $1 where id = $2", [
    iso(updatedAt),
    larp.id,
  ]);
  return larp;
}

describe("handleLarpLinks", () => {
  beforeEach(truncateAll);
  afterAll(async () => {
    await db.close();
    await pool.end();
  });

  it("bumps the larp's updatedAt when links change", async () => {
    const longAgo = new Date("2020-01-01T00:00:00Z");
    const larp = await createLarpUpdatedAt(longAgo);

    await handleLarpLinks(
      larp.id,
      [{ type: LarpLinkType.PHOTOS, href: "https://larppikuvat.fi/test" }],
      [],
    );

    const updated = parseDates(
      (await db.orm.public.Larp.first({ id: larp.id }))!,
    );
    expect(updated.updatedAt.getTime()).toBeGreaterThan(longAgo.getTime());
  });

  it("leaves updatedAt alone when there is nothing to change", async () => {
    const longAgo = new Date("2020-01-01T00:00:00Z");
    const larp = await createLarpUpdatedAt(longAgo);

    await handleLarpLinks(larp.id, [], []);

    const unchanged = parseDates(
      (await db.orm.public.Larp.first({ id: larp.id }))!,
    );
    expect(unchanged.updatedAt).toEqual(longAgo);
  });
});
