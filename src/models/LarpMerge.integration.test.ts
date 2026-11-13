import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { db } from "@/prisma/db";
import {
  EditAction,
  EditStatus,
  Language,
  LarpLinkType,
  RelatedLarpType,
  RelatedUserRole,
  RelatedUserVisibility,
  UserRole,
} from "@/prisma/enums";
import { pool } from "@/prisma/pool";
import { truncateAll } from "@/test/truncate";

import type { MergeChoices } from "./LarpMerge.client";
import { findMergeCandidates, getMergePreview, mergeLarps } from "./LarpMerge";

const message = "Yhdistetty";
const describeMerge = () => message;

async function createModerator() {
  return db.orm.public.User.upsert({
    create: {
      name: "Moderator",
      email: "moderator@larp.fi",
      role: UserRole.MODERATOR,
    },
    update: {},
    conflictOn: { email: "moderator@larp.fi" },
  });
}

async function createUser(email: string) {
  return db.orm.public.User.create({ email, role: UserRole.VERIFIED });
}

async function createLarp(
  fields: Partial<Parameters<typeof db.orm.public.Larp.create>[0]> = {},
) {
  return db.orm.public.Larp.create({
    name: "Test Larp",
    language: Language.fi,
    ...fields,
  });
}

/** The choices the merge page submits when the moderator accepts every default. */
async function defaultChoices(
  aId: string,
  bId: string,
  overrides: Partial<MergeChoices> = {},
): Promise<MergeChoices> {
  const preview = await getMergePreview(aId, bId);
  if (!preview) throw new Error("No preview");
  const fields: MergeChoices["fields"] = {};
  for (const { field, status, defaultSide } of preview.diff) {
    if (status === "conflict") fields[field] = defaultSide;
  }
  return {
    fields,
    keepLinkIds: preview.links.map((link) => link.id),
    aUpdateCount: preview.a.updateCount,
    bUpdateCount: preview.b.updateCount,
    aUpdatedAt: preview.a.updatedAt,
    bUpdatedAt: preview.b.updatedAt,
    ...overrides,
  };
}

async function merge(aId: string, bId: string, overrides = {}) {
  const moderator = await createModerator();
  return mergeLarps(
    moderator,
    aId,
    bId,
    await defaultChoices(aId, bId, overrides),
    describeMerge,
  );
}

beforeEach(truncateAll);
afterAll(async () => {
  await db.close();
  await pool.end();
});

describe("mergeLarps", () => {
  it("applies the chosen field values and records the merge", async () => {
    const a = await createLarp({
      name: "Kalevala",
      tagline: "",
      locationText: "Seurantalo",
      numPlayerCharacters: 20,
    });
    const b = await createLarp({
      name: "Kalevala!",
      tagline: "Myyttinen larppi",
      locationText: "Nuorisoseurantalo",
      numPlayerCharacters: 30,
    });

    const result = await merge(a.id, b.id, {
      fields: { locationText: "b", numPlayerCharacters: "a" },
      customName: "Kalevala – the larp",
    });

    expect(result.ok).toBe(true);
    const merged = await db.orm.public.Larp.first({ id: a.id });
    expect(merged).toMatchObject({
      name: "Kalevala – the larp",
      // Only B had a tagline, so it is taken without asking.
      tagline: "Myyttinen larppi",
      locationText: "Nuorisoseurantalo",
      numPlayerCharacters: 20,
      updateCount: a.updateCount + 1,
    });
    expect(await db.orm.public.Larp.first({ id: b.id })).toBeNull();

    const requests = await db.orm.public.ModerationRequest.where({
      larpId: a.id,
    }).all();
    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({
      action: EditAction.MERGE,
      status: EditStatus.APPROVED,
      message,
      newContent: {
        name: "Kalevala – the larp",
        tagline: "Myyttinen larppi",
        locationText: "Nuorisoseurantalo",
      },
    });
  });

  it("combines related users, collapsing the same user in the same role", async () => {
    const a = await createLarp();
    const b = await createLarp();
    const both = await createUser("both@example.com");
    const onlyB = await createUser("onlyb@example.com");
    await db.orm.public.RelatedUser.createAndCount([
      {
        larpId: a.id,
        userId: both.id,
        role: RelatedUserRole.FAVORITE,
        visibility: RelatedUserVisibility.ONLY_ME,
      },
      {
        larpId: b.id,
        userId: both.id,
        role: RelatedUserRole.FAVORITE,
        visibility: RelatedUserVisibility.PARTICIPANTS,
      },
      { larpId: b.id, userId: both.id, role: RelatedUserRole.PLAYER },
      { larpId: b.id, userId: onlyB.id, role: RelatedUserRole.GAME_MASTER },
    ]);

    await merge(a.id, b.id);

    const relatedUsers = await db.orm.public.RelatedUser.where({
      larpId: a.id,
    }).all();
    expect(
      relatedUsers
        .map((r) => `${r.userId === both.id ? "both" : "onlyB"} ${r.role}`)
        .sort(),
    ).toEqual(["both FAVORITE", "both PLAYER", "onlyB GAME_MASTER"]);
    // A's own row wins when both have the same role.
    expect(
      relatedUsers.find((r) => r.role === RelatedUserRole.FAVORITE)?.visibility,
    ).toBe(RelatedUserVisibility.ONLY_ME);
  });

  it("combines related larps without relating A to itself or duplicating a shared one", async () => {
    const a = await createLarp();
    const b = await createLarp();
    const shared = await createLarp({ name: "Shared" });
    const onlyB = await createLarp({ name: "Only B" });
    await db.orm.public.RelatedLarp.createAndCount([
      { leftId: a.id, rightId: b.id, type: RelatedLarpType.RERUN_OF },
      { leftId: a.id, rightId: shared.id, type: RelatedLarpType.IN_SERIES },
      // The same pair in the other direction must not become a second relation.
      { leftId: shared.id, rightId: b.id, type: RelatedLarpType.SEQUEL },
      { leftId: onlyB.id, rightId: b.id, type: RelatedLarpType.SEQUEL },
    ]);

    await merge(a.id, b.id);

    const relations = await db.orm.public.RelatedLarp.all();
    expect(
      relations.map((r) => ({
        leftId: r.leftId,
        rightId: r.rightId,
        type: r.type,
      })),
    ).toEqual(
      expect.arrayContaining([
        { leftId: a.id, rightId: shared.id, type: RelatedLarpType.IN_SERIES },
        { leftId: onlyB.id, rightId: a.id, type: RelatedLarpType.SEQUEL },
      ]),
    );
    expect(relations).toHaveLength(2);
  });

  it("collapses duplicate links and drops the ones the moderator unticked", async () => {
    const a = await createLarp();
    const b = await createLarp();
    const link = (larpId: string, type: LarpLinkType, href: string) =>
      db.orm.public.LarpLink.create({ larpId, type, href });
    const aHome = await link(
      a.id,
      LarpLinkType.HOMEPAGE,
      "https://Example.com/",
    );
    const aDropped = await link(a.id, LarpLinkType.OTHER, "https://a.example/");
    // Differs from A's homepage only by host case and trailing slash.
    await link(b.id, LarpLinkType.HOMEPAGE, "https://example.com");
    const bPhotos = await link(b.id, LarpLinkType.PHOTOS, "https://b.example/");

    const preview = await getMergePreview(a.id, b.id);
    expect(preview?.links.map((l) => [l.id, l.origin])).toEqual([
      [aHome.id, "both"],
      [aDropped.id, "a"],
      [bPhotos.id, "b"],
    ]);

    await merge(a.id, b.id, { keepLinkIds: [aHome.id, bPhotos.id] });

    const links = await db.orm.public.LarpLink.where({ larpId: a.id })
      .orderBy((l) => l.id.asc())
      .all();
    expect(links.map((l) => l.id)).toEqual([aHome.id, bPhotos.id]);
  });

  it("moves B's requests to A and rewrites pending relation changes that name B", async () => {
    const a = await createLarp();
    const b = await createLarp();
    const other = await createLarp({ name: "Other" });
    const pending = await db.orm.public.ModerationRequest.create({
      action: EditAction.UPDATE,
      status: EditStatus.VERIFIED,
      larpId: other.id,
      submitterName: "Someone",
      submitterEmail: "someone@example.com",
      addRelatedLarps: [
        { leftId: other.id, rightId: b.id, type: RelatedLarpType.SEQUEL },
      ],
    });
    const onB = await db.orm.public.ModerationRequest.create({
      action: EditAction.UPDATE,
      status: EditStatus.VERIFIED,
      larpId: b.id,
      submitterName: "Someone",
      submitterEmail: "someone@example.com",
    });

    await merge(a.id, b.id);

    expect(
      (await db.orm.public.ModerationRequest.first({ id: pending.id }))
        ?.addRelatedLarps,
    ).toEqual([
      { leftId: other.id, rightId: a.id, type: RelatedLarpType.SEQUEL },
    ]);
    expect(
      (await db.orm.public.ModerationRequest.first({ id: onB.id }))?.larpId,
    ).toBe(a.id);
  });

  it("keeps A's alias and turns B's alias into a redirect to A", async () => {
    const a = await createLarp({ alias: "kalevala" });
    const b = await createLarp({ alias: "kalevala-2" });

    await merge(a.id, b.id);

    expect((await db.orm.public.Larp.first({ id: a.id }))?.alias).toBe(
      "kalevala",
    );
    expect(
      (await db.orm.public.LarpAliasRedirect.first({ alias: "kalevala-2" }))
        ?.larpId,
    ).toBe(a.id);
    expect(
      (await db.orm.public.LarpRedirect.first({ fromId: b.id }))?.larpId,
    ).toBe(a.id);
  });

  it("gives A the alias of B when A has none", async () => {
    const a = await createLarp();
    const b = await createLarp({ alias: "kalevala" });

    await merge(a.id, b.id);

    expect((await db.orm.public.Larp.first({ id: a.id }))?.alias).toBe(
      "kalevala",
    );
    expect(await db.orm.public.LarpAliasRedirect.all()).toEqual([]);
  });

  it("makes A's old alias a redirect when B's alias is chosen", async () => {
    const a = await createLarp({ alias: "kalevala-a" });
    const b = await createLarp({ alias: "kalevala" });

    await merge(a.id, b.id, { fields: { alias: "b" } });

    expect((await db.orm.public.Larp.first({ id: a.id }))?.alias).toBe(
      "kalevala",
    );
    expect(
      (await db.orm.public.LarpAliasRedirect.first({ alias: "kalevala-a" }))
        ?.larpId,
    ).toBe(a.id);
  });

  it("points earlier redirects to B at A when merges chain", async () => {
    const a = await createLarp();
    const b = await createLarp();
    const c = await createLarp();
    await db.orm.public.LarpAliasRedirect.create({
      alias: "old-b",
      larpId: b.id,
    });

    await merge(b.id, c.id);
    await merge(a.id, b.id);

    const redirects = await db.orm.public.LarpRedirect.all();
    expect(
      Object.fromEntries(redirects.map((r) => [r.fromId, r.larpId])),
    ).toEqual({ [b.id]: a.id, [c.id]: a.id });
    expect(
      (await db.orm.public.LarpAliasRedirect.first({ alias: "old-b" }))?.larpId,
    ).toBe(a.id);
  });

  it("moves signups without breaking the one-per-email rule", async () => {
    const a = await createLarp();
    const b = await createLarp();
    const signup = (larpId: string, email: string, code: string) => ({
      larpId,
      email,
      displayName: email,
      signupStatus: RelatedUserRole.LOCAL_SIGNUP_YES,
      visibility: RelatedUserVisibility.GM,
      verificationCode: code,
      verifiedAt: new Date().toISOString(),
    });
    await db.orm.public.UnauthenticatedSignup.createAndCount([
      signup(a.id, "both@example.com", "1"),
      signup(b.id, "both@example.com", "2"),
      signup(b.id, "onlyb@example.com", "3"),
    ]);

    await merge(a.id, b.id);

    const signups = await db.orm.public.UnauthenticatedSignup.where({
      larpId: a.id,
    }).all();
    expect(signups.map((s) => s.verificationCode).sort()).toEqual(["1", "3"]);
  });

  it("refuses when either larp changed after the preview was loaded", async () => {
    const a = await createLarp({ tagline: "A" });
    const b = await createLarp({ tagline: "B" });
    const moderator = await createModerator();
    const choices = await defaultChoices(a.id, b.id);
    await db.orm.public.Larp.where({ id: b.id }).update({
      updateCount: 5,
    });

    const result = await mergeLarps(
      moderator,
      a.id,
      b.id,
      choices,
      describeMerge,
    );

    expect(result).toEqual({ ok: false, error: "stale" });
    expect(await db.orm.public.Larp.first({ id: b.id })).not.toBeNull();
    expect((await db.orm.public.Larp.first({ id: a.id }))?.tagline).toBe("A");
  });

  it("refuses when a conflicting field has no explicit choice", async () => {
    const a = await createLarp({ tagline: "A" });
    const b = await createLarp({ tagline: "B" });

    const result = await merge(a.id, b.id, { fields: {} });

    expect(result).toEqual({ ok: false, error: "undecided" });
    expect(await db.orm.public.Larp.first({ id: b.id })).not.toBeNull();
  });

  it("refuses users who are not moderators", async () => {
    const a = await createLarp();
    const b = await createLarp();
    const user = await createUser("user@example.com");

    const result = await mergeLarps(
      user,
      a.id,
      b.id,
      await defaultChoices(a.id, b.id),
      describeMerge,
    );

    expect(result).toEqual({ ok: false, error: "forbidden" });
  });
});

describe("findMergeCandidates", () => {
  it("finds larps with the same name and overlapping dates, of any type", async () => {
    const a = await createLarp({
      name: "Kalevala (1. pelautus)",
      startsAt: "2027-02-27",
      endsAt: "2027-02-28",
    });
    const duplicate = await createLarp({
      name: "KALEVALA",
      type: "OTHER_EVENT",
      startsAt: "2027-02-28",
    });
    await createLarp({ name: "Kalevala", startsAt: "2028-02-27" });

    const candidates = await findMergeCandidates(a);

    expect(candidates.map((c) => c.id)).toEqual([duplicate.id]);
  });
});
