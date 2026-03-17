import {
  EditAction,
  EditStatus,
  Language,
  LarpType,
  SubmitterRole,
  UserRole,
} from "@/generated/prisma/client";
import prisma from "@/prisma";
import { truncateAll } from "@/test/truncate";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
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
  afterAll(() => prisma.$disconnect());

  it("approveCreateLarpRequest creates a larp with correct fields", async () => {
    const user = await prisma.user.create({ data: testUser });

    const request = await prisma.moderationRequest.create({
      data: {
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
      },
    });

    const result = await approveCreateLarpRequest(
      request,
      user,
      null,
      "APPROVED",
    );
    const larp = await prisma.larp.findUnique({ where: { id: result.id } });

    expect(larp?.name).toBe("My Larp");
    expect(larp?.tagline).toBe("A tagline");
    expect(larp?.language).toBe(Language.fi);
  });

  it("approveUpdateLarpRequest only updates changed fields", async () => {
    const user = await prisma.user.create({ data: testUser });
    const larp = await prisma.larp.create({
      data: {
        name: "Original Name",
        language: Language.fi,
        tagline: "Original tagline",
        description: "Original description",
      },
    });

    const request = await prisma.moderationRequest.create({
      data: {
        action: EditAction.UPDATE,
        larpId: larp.id,
        status: EditStatus.VERIFIED,
        submitterName: user.name!,
        submitterEmail: user.email,
        submitterRole: SubmitterRole.NONE,
        newContent: { name: "New Name" },
      },
    });

    await approveUpdateLarpRequest(request, user, null, "APPROVED");

    const updated = await prisma.larp.findUnique({ where: { id: larp.id } });
    expect(updated?.name).toBe("New Name");
    expect(updated?.tagline).toBe("Original tagline");
    expect(updated?.description).toBe("Original description");
  });

  it("approveUpdateLarpRequest with empty diff leaves larp unchanged", async () => {
    const user = await prisma.user.create({ data: testUser });
    const larp = await prisma.larp.create({
      data: {
        name: "Original Name",
        language: Language.fi,
        tagline: "Original tagline",
      },
    });

    const request = await prisma.moderationRequest.create({
      data: {
        action: EditAction.UPDATE,
        larpId: larp.id,
        status: EditStatus.VERIFIED,
        submitterName: user.name!,
        submitterEmail: user.email,
        submitterRole: SubmitterRole.NONE,
        newContent: {},
      },
    });

    await approveUpdateLarpRequest(request, user, null, "APPROVED");

    const updated = await prisma.larp.findUnique({ where: { id: larp.id } });
    expect(updated?.name).toBe("Original Name");
    expect(updated?.tagline).toBe("Original tagline");
  });

  it("approveDeleteLarpRequest deletes the larp and deletes the request", async () => {
    const user = await prisma.user.create({
      data: { ...testUser, role: UserRole.ADMIN },
    });
    const larp = await prisma.larp.create({
      data: { name: "To Be Deleted", language: Language.fi },
    });

    const request = await prisma.moderationRequest.create({
      data: {
        action: EditAction.DELETE,
        larpId: larp.id,
        status: EditStatus.VERIFIED,
        submitterName: user.name!,
        submitterEmail: user.email,
        submitterRole: SubmitterRole.NONE,
        newContent: {},
      },
    });

    await approveDeleteLarpRequest(request, user, "Duplicate page", "APPROVED");

    const deletedLarp = await prisma.larp.findUnique({
      where: { id: larp.id },
    });
    expect(deletedLarp).toBeNull();

    // The delete cascades to the moderation request itself as well.
    const updatedRequest = await prisma.moderationRequest.findUnique({
      where: { id: request.id },
    });
    expect(updatedRequest).toBeNull();
  });

  it("approveDeleteLarpRequest also deletes cascade-related moderation requests", async () => {
    const user = await prisma.user.create({
      data: { ...testUser, role: UserRole.ADMIN },
    });
    const larp = await prisma.larp.create({
      data: { name: "Has Other Requests", language: Language.fi },
    });

    // An older, already-approved CREATE request for this larp
    await prisma.moderationRequest.create({
      data: {
        action: EditAction.CREATE,
        larpId: larp.id,
        status: EditStatus.APPROVED,
        submitterName: user.name!,
        submitterEmail: user.email,
        submitterRole: SubmitterRole.GAME_MASTER,
        newContent: {},
      },
    });

    const deleteRequest = await prisma.moderationRequest.create({
      data: {
        action: EditAction.DELETE,
        larpId: larp.id,
        status: EditStatus.VERIFIED,
        submitterName: user.name!,
        submitterEmail: user.email,
        submitterRole: SubmitterRole.NONE,
        newContent: {},
      },
    });

    await approveDeleteLarpRequest(deleteRequest, user, null, "APPROVED");

    const remainingRequests = await prisma.moderationRequest.findMany({
      where: { larpId: larp.id },
    });
    expect(remainingRequests).toHaveLength(0);
  });

  it("rejectRequest sets status to REJECTED with reason", async () => {
    const user = await prisma.user.create({ data: testUser });

    const request = await prisma.moderationRequest.create({
      data: {
        action: EditAction.CREATE,
        status: EditStatus.VERIFIED,
        submitterName: user.name!,
        submitterEmail: user.email,
        submitterRole: SubmitterRole.NONE,
        newContent: minimalNewContent,
      },
    });

    await rejectRequest(request, user, "Spam");

    const updated = await prisma.moderationRequest.findUnique({
      where: { id: request.id },
    });
    expect(updated?.status).toBe(EditStatus.REJECTED);
    expect(updated?.resolvedMessage).toBe("Spam");
    expect(updated?.resolvedAt).not.toBeNull();
  });
});
