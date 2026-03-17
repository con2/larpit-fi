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
        newContent: { ...minimalNewContent, name: "My Larp", tagline: "A tagline" },
      },
    });

    const result = await approveCreateLarpRequest(request, user, null, "APPROVED");
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

    const updated = await prisma.moderationRequest.findUnique({ where: { id: request.id } });
    expect(updated?.status).toBe(EditStatus.REJECTED);
    expect(updated?.resolvedMessage).toBe("Spam");
    expect(updated?.resolvedAt).not.toBeNull();
  });
});
