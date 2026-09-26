import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { iso } from "@/prisma/dates";
import { db } from "@/prisma/db";
import {
  EditAction,
  EditStatus,
  Language,
  LarpLinkType,
  LarpType,
  RelatedLarpType,
  SubmitterRole,
  UserRole,
} from "@/prisma/enums";
import { pool } from "@/prisma/pool";
import { truncateAll } from "@/test/truncate";
import {
  approveCreateLarpRequest,
  approveDeleteLarpRequest,
  approveUpdateLarpRequest,
  rejectRequest,
} from "./ModerationRequest";

const testUser = {
  name: "Test User",
  email: "test@larpit.fi",
  role: UserRole.MODERATOR,
};

const minimalNewContent = {
  name: "Test Larp",
  tagline: "",
  type: LarpType.ONE_SHOT,
  openness: null,
  language: Language.fi,
  fluffText: "",
  description: "",
  locationText: "",
  municipality: null,
  numPlayerCharacters: null,
  numTotalParticipants: null,
  startsAt: null,
  endsAt: null,
  signupStartsAt: null,
  signupEndsAt: null,
};

describe("ModerationRequest integration tests", () => {
  beforeEach(truncateAll);
  afterAll(async () => {
    await db.close();
    await pool.end();
  });

  it("approveCreateLarpRequest creates a larp with correct fields", async () => {
    const user = await db.orm.public.User.create(testUser);

    const request = await db.orm.public.ModerationRequest.create({
      action: EditAction.CREATE,
      status: EditStatus.VERIFIED,
      submitterName: user.name!,
      submitterEmail: user.email,
      submitterId: user.id,
      submitterRole: SubmitterRole.GAME_MASTER,
      newContent: {
        ...minimalNewContent,
        name: "My Larp",
        tagline: "A tagline",
      },
      addLinks: [{ type: LarpLinkType.HOMEPAGE, href: "https://example.com" }],
    });

    const result = await approveCreateLarpRequest(
      request,
      user,
      null,
      "APPROVED",
    );
    const larp = await db.orm.public.Larp.include("links").first({
      id: result.id,
    });

    expect(larp?.name).toBe("My Larp");
    expect(larp?.tagline).toBe("A tagline");
    expect(larp?.language).toBe(Language.fi);
    expect(larp?.links).toHaveLength(1);
    expect(larp?.links[0].href).toBe("https://example.com");
    expect(larp?.links[0].type).toBe(LarpLinkType.HOMEPAGE);
  });

  it("approveUpdateLarpRequest only updates changed fields", async () => {
    const user = await db.orm.public.User.create(testUser);
    const larp = await db.orm.public.Larp.create({
      name: "Original Name",
      language: Language.fi,
      tagline: "Original tagline",
      description: "Original description",
      links: (links) =>
        links.create({
          type: LarpLinkType.HOMEPAGE,
          href: "https://old.example.com",
        }),
    });

    const request = await db.orm.public.ModerationRequest.create({
      action: EditAction.UPDATE,
      larpId: larp.id,
      status: EditStatus.VERIFIED,
      submitterName: user.name!,
      submitterEmail: user.email,
      submitterRole: SubmitterRole.NONE,
      newContent: { name: "New Name" },
      addLinks: [
        { type: LarpLinkType.PHOTOS, href: "https://photos.example.com" },
      ],
      removeLinks: [
        { type: LarpLinkType.HOMEPAGE, href: "https://old.example.com" },
      ],
    });

    await approveUpdateLarpRequest(request, user, null, "APPROVED");

    const updated = await db.orm.public.Larp.include("links").first({
      id: larp.id,
    });
    expect(updated?.name).toBe("New Name");
    expect(updated?.tagline).toBe("Original tagline");
    expect(updated?.description).toBe("Original description");
    expect(updated?.links).toHaveLength(1);
    expect(updated?.links[0].href).toBe("https://photos.example.com");
    expect(updated?.links[0].type).toBe(LarpLinkType.PHOTOS);
  });

  it("approveUpdateLarpRequest with empty diff leaves larp unchanged", async () => {
    const user = await db.orm.public.User.create(testUser);
    const larp = await db.orm.public.Larp.create({
      name: "Original Name",
      language: Language.fi,
      tagline: "Original tagline",
    });

    const request = await db.orm.public.ModerationRequest.create({
      action: EditAction.UPDATE,
      larpId: larp.id,
      status: EditStatus.VERIFIED,
      submitterName: user.name!,
      submitterEmail: user.email,
      submitterRole: SubmitterRole.NONE,
      newContent: {},
    });

    await approveUpdateLarpRequest(request, user, null, "APPROVED");

    const updated = await db.orm.public.Larp.first({ id: larp.id });
    expect(updated?.name).toBe("Original Name");
    expect(updated?.tagline).toBe("Original tagline");
  });

  it("approveUpdateLarpRequest sets cancelledAt when the diff cancels the larp", async () => {
    const user = await db.orm.public.User.create(testUser);
    const larp = await db.orm.public.Larp.create({
      name: "Original Name",
      language: Language.fi,
    });

    const request = await db.orm.public.ModerationRequest.create({
      action: EditAction.UPDATE,
      larpId: larp.id,
      status: EditStatus.VERIFIED,
      submitterName: user.name!,
      submitterEmail: user.email,
      submitterRole: SubmitterRole.NONE,
      newContent: { isCancelled: true },
    });

    const before = new Date();
    await approveUpdateLarpRequest(request, user, null, "APPROVED");

    const updated = await db.orm.public.Larp.first({ id: larp.id });
    expect(updated?.cancelledAt).not.toBeNull();
    expect(new Date(updated!.cancelledAt!).getTime()).toBeGreaterThanOrEqual(
      before.getTime(),
    );
  });

  it("approveUpdateLarpRequest preserves cancelledAt when an unrelated field is edited", async () => {
    const user = await db.orm.public.User.create(testUser);
    const cancelledAt = new Date("2020-01-01T00:00:00Z");
    const larp = await db.orm.public.Larp.create({
      name: "Original Name",
      language: Language.fi,
      cancelledAt: iso(cancelledAt),
    });

    // The diff omits isCancelled because the submitted checkbox state
    // (checked, mirroring the cancelled larp) matches the current value.
    const request = await db.orm.public.ModerationRequest.create({
      action: EditAction.UPDATE,
      larpId: larp.id,
      status: EditStatus.VERIFIED,
      submitterName: user.name!,
      submitterEmail: user.email,
      submitterRole: SubmitterRole.NONE,
      newContent: { name: "New Name" },
    });

    await approveUpdateLarpRequest(request, user, null, "APPROVED");

    const updated = await db.orm.public.Larp.first({ id: larp.id });
    expect(updated?.name).toBe("New Name");
    expect(new Date(updated!.cancelledAt!)).toEqual(cancelledAt);
  });

  it("approveUpdateLarpRequest clears cancelledAt when the diff un-cancels the larp", async () => {
    const user = await db.orm.public.User.create(testUser);
    const larp = await db.orm.public.Larp.create({
      name: "Original Name",
      language: Language.fi,
      cancelledAt: "2020-01-01T00:00:00Z",
    });

    const request = await db.orm.public.ModerationRequest.create({
      action: EditAction.UPDATE,
      larpId: larp.id,
      status: EditStatus.VERIFIED,
      submitterName: user.name!,
      submitterEmail: user.email,
      submitterRole: SubmitterRole.NONE,
      newContent: { isCancelled: false },
    });

    await approveUpdateLarpRequest(request, user, null, "APPROVED");

    const updated = await db.orm.public.Larp.first({ id: larp.id });
    expect(updated?.cancelledAt).toBeNull();
  });

  it("approveDeleteLarpRequest deletes the larp and deletes the request", async () => {
    const user = await db.orm.public.User.create({
      ...testUser,
      role: UserRole.ADMIN,
    });
    const larp = await db.orm.public.Larp.create({
      name: "To Be Deleted",
      language: Language.fi,
    });

    const request = await db.orm.public.ModerationRequest.create({
      action: EditAction.DELETE,
      larpId: larp.id,
      status: EditStatus.VERIFIED,
      submitterName: user.name!,
      submitterEmail: user.email,
      submitterRole: SubmitterRole.NONE,
      newContent: {},
    });

    await approveDeleteLarpRequest(request, user, "Duplicate page", "APPROVED");

    const deletedLarp = await db.orm.public.Larp.first({ id: larp.id });
    expect(deletedLarp).toBeNull();

    // The delete cascades to the moderation request itself as well.
    const updatedRequest = await db.orm.public.ModerationRequest.first({
      id: request.id,
    });
    expect(updatedRequest).toBeNull();
  });

  it("approveDeleteLarpRequest also deletes cascade-related moderation requests", async () => {
    const user = await db.orm.public.User.create({
      ...testUser,
      role: UserRole.ADMIN,
    });
    const larp = await db.orm.public.Larp.create({
      name: "Has Other Requests",
      language: Language.fi,
    });

    // An older, already-approved CREATE request for this larp
    await db.orm.public.ModerationRequest.create({
      action: EditAction.CREATE,
      larpId: larp.id,
      status: EditStatus.APPROVED,
      submitterName: user.name!,
      submitterEmail: user.email,
      submitterRole: SubmitterRole.GAME_MASTER,
      newContent: {},
    });

    const deleteRequest = await db.orm.public.ModerationRequest.create({
      action: EditAction.DELETE,
      larpId: larp.id,
      status: EditStatus.VERIFIED,
      submitterName: user.name!,
      submitterEmail: user.email,
      submitterRole: SubmitterRole.NONE,
      newContent: {},
    });

    await approveDeleteLarpRequest(deleteRequest, user, null, "APPROVED");

    const remainingRequests = await db.orm.public.ModerationRequest.where({
      larpId: larp.id,
    }).all();
    expect(remainingRequests).toHaveLength(0);
  });

  it("approveUpdateLarpRequest with addRelatedLarps creates the relation", async () => {
    const user = await db.orm.public.User.create(testUser);
    const larpA = await db.orm.public.Larp.create({
      name: "Larp A",
      language: Language.fi,
    });
    const larpB = await db.orm.public.Larp.create({
      name: "Larp B",
      language: Language.fi,
    });

    const request = await db.orm.public.ModerationRequest.create({
      action: EditAction.UPDATE,
      larpId: larpA.id,
      status: EditStatus.VERIFIED,
      submitterName: user.name!,
      submitterEmail: user.email,
      submitterRole: SubmitterRole.NONE,
      newContent: {},
      addRelatedLarps: [
        { leftId: larpA.id, rightId: larpB.id, type: RelatedLarpType.SEQUEL },
      ],
    });

    await approveUpdateLarpRequest(request, user, null, "APPROVED");

    const relation = await db.orm.public.RelatedLarp.first({
      leftId: larpA.id,
      rightId: larpB.id,
    });
    expect(relation?.type).toBe(RelatedLarpType.SEQUEL);
  });

  it("approveUpdateLarpRequest with removeRelatedLarps removes the relation", async () => {
    const user = await db.orm.public.User.create(testUser);
    const larpA = await db.orm.public.Larp.create({
      name: "Larp A",
      language: Language.fi,
    });
    const larpB = await db.orm.public.Larp.create({
      name: "Larp B",
      language: Language.fi,
    });

    await db.orm.public.RelatedLarp.create({
      leftId: larpA.id,
      rightId: larpB.id,
      type: RelatedLarpType.SPINOFF,
    });

    const request = await db.orm.public.ModerationRequest.create({
      action: EditAction.UPDATE,
      larpId: larpA.id,
      status: EditStatus.VERIFIED,
      submitterName: user.name!,
      submitterEmail: user.email,
      submitterRole: SubmitterRole.NONE,
      newContent: {},
      removeRelatedLarps: [
        {
          leftId: larpA.id,
          rightId: larpB.id,
          type: RelatedLarpType.SPINOFF,
        },
      ],
    });

    await approveUpdateLarpRequest(request, user, null, "APPROVED");

    const relation = await db.orm.public.RelatedLarp.first({
      leftId: larpA.id,
      rightId: larpB.id,
    });
    expect(relation).toBeNull();
  });

  it("approveUpdateLarpRequest allows (A,B) and (B,A) relations to coexist", async () => {
    const user = await db.orm.public.User.create(testUser);
    const larpA = await db.orm.public.Larp.create({
      name: "Larp A",
      language: Language.fi,
    });
    const larpB = await db.orm.public.Larp.create({
      name: "Larp B",
      language: Language.fi,
    });

    // Create (A → B) as SEQUEL
    await db.orm.public.RelatedLarp.create({
      leftId: larpA.id,
      rightId: larpB.id,
      type: RelatedLarpType.SEQUEL,
    });

    // Request to add (B → A) as RERUN_OF — a different direction, should be allowed
    const request = await db.orm.public.ModerationRequest.create({
      action: EditAction.UPDATE,
      larpId: larpB.id,
      status: EditStatus.VERIFIED,
      submitterName: user.name!,
      submitterEmail: user.email,
      submitterRole: SubmitterRole.NONE,
      newContent: {},
      addRelatedLarps: [
        {
          leftId: larpB.id,
          rightId: larpA.id,
          type: RelatedLarpType.RERUN_OF,
        },
      ],
    });

    await approveUpdateLarpRequest(request, user, null, "APPROVED");

    const ab = await db.orm.public.RelatedLarp.first({
      leftId: larpA.id,
      rightId: larpB.id,
    });
    const ba = await db.orm.public.RelatedLarp.first({
      leftId: larpB.id,
      rightId: larpA.id,
    });
    expect(ab?.type).toBe(RelatedLarpType.SEQUEL);
    expect(ba?.type).toBe(RelatedLarpType.RERUN_OF);
  });

  it("approveUpdateLarpRequest increments updateCount on each approval", async () => {
    const user = await db.orm.public.User.create(testUser);
    const larp = await db.orm.public.Larp.create({
      name: "My Larp",
      language: Language.fi,
    });
    expect(larp.updateCount).toBe(0);

    const makeRequest = () =>
      db.orm.public.ModerationRequest.create({
        action: EditAction.UPDATE,
        larpId: larp.id,
        status: EditStatus.VERIFIED,
        submitterName: user.name!,
        submitterEmail: user.email,
        submitterRole: SubmitterRole.NONE,
        newContent: { name: "Updated Name" },
      });

    await approveUpdateLarpRequest(await makeRequest(), user, null, "APPROVED");
    const after1 = await db.orm.public.Larp.first({ id: larp.id });
    expect(after1?.updateCount).toBe(1);

    await approveUpdateLarpRequest(await makeRequest(), user, null, "APPROVED");
    const after2 = await db.orm.public.Larp.first({ id: larp.id });
    expect(after2?.updateCount).toBe(2);
  });

  it("approveCreateLarpRequest leaves updateCount at 0", async () => {
    const user = await db.orm.public.User.create(testUser);

    const request = await db.orm.public.ModerationRequest.create({
      action: EditAction.CREATE,
      status: EditStatus.VERIFIED,
      submitterName: user.name!,
      submitterEmail: user.email,
      submitterId: user.id,
      submitterRole: SubmitterRole.GAME_MASTER,
      newContent: minimalNewContent,
    });

    const result = await approveCreateLarpRequest(
      request,
      user,
      null,
      "APPROVED",
    );
    const larp = await db.orm.public.Larp.first({ id: result.id });
    expect(larp?.updateCount).toBe(0);
  });

  it("rejectRequest sets status to REJECTED with reason", async () => {
    const user = await db.orm.public.User.create(testUser);

    const request = await db.orm.public.ModerationRequest.create({
      action: EditAction.CREATE,
      status: EditStatus.VERIFIED,
      submitterName: user.name!,
      submitterEmail: user.email,
      submitterRole: SubmitterRole.NONE,
      newContent: minimalNewContent,
    });

    await rejectRequest(request, user, "Spam");

    const updated = await db.orm.public.ModerationRequest.first({
      id: request.id,
    });
    expect(updated?.status).toBe(EditStatus.REJECTED);
    expect(updated?.resolvedMessage).toBe("Spam");
    expect(updated?.resolvedAt).not.toBeNull();
  });
});
