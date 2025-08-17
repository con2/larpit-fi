import {
  EditAction,
  EditStatus,
  Language,
  Larp,
  LarpType,
  ModerationRequest,
  RelatedUser,
  RelatedUserRole,
  SubmitterRole,
  User,
  UserRole,
} from "@/generated/prisma";
import {
  fromEveningNull,
  fromJustBeforeMidnightNull,
  fromMorningNull,
} from "@/helpers/temporal";
import prisma from "@/prisma";
import { Temporal } from "@js-temporal/polyfill";
import z from "zod";

export enum Resolution {
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export const zResolution = z.enum<typeof Resolution>(Resolution);

export const zPlainDateNull = z
  .string()
  .nullable()
  .optional()
  .transform((val) => {
    if (!val) return null;
    return Temporal.PlainDate.from(val);
  });

export const zSubmitterRole = z.enum<typeof SubmitterRole>(SubmitterRole);
export const zLanguage = z.enum<typeof Language>(Language).default(Language.fi);

export const ModerationRequestContent = z.object({
  name: z.string().min(1).max(200),
  tagline: z.string().max(500).optional(),
  language: zLanguage,
  locationText: z.string().max(200).optional(),
  fluffText: z.string().max(2000).optional(),
  description: z.string().max(2000).optional(),

  startsAt: zPlainDateNull,
  endsAt: zPlainDateNull,
  signupStartsAt: zPlainDateNull,
  signupEndsAt: zPlainDateNull,
});

export const CreateLarpForm = ModerationRequestContent.extend({
  submitterName: z.string().min(1).max(100).optional(),
  submitterEmail: z.email().optional(),
  submitterRole: zSubmitterRole,
  cat: z.coerce.string().lowercase().optional(),
  message: z.string().max(2000).optional(),
});

export type ModerationRequestContent = z.infer<typeof ModerationRequestContent>;
export type CreateLarpForm = z.infer<typeof CreateLarpForm>;

// NOTE: Expects request.status to be already set to APPROVED or AUTO_APPROVED to facilitate
// the new request status selection logic (verified users get VERIFIED etc.)
export async function approveRequest(
  request: Pick<
    ModerationRequest,
    | "id"
    | "action"
    | "status"
    | "larpId"
    | "newContent"
    | "submitterId"
    | "submitterRole"
  >,
  resolvedBy: Pick<User, "id" | "role">,
  reason: string | null
): Promise<Pick<Larp, "id">> {
  if (request.action !== EditAction.CREATE) {
    throw new Error(`Not implemented yet: ${request.action}`);
  }

  switch (request.status) {
    case EditStatus.APPROVED:
    case EditStatus.AUTO_APPROVED:
      break;
    default:
      throw new Error(
        `A larp can only be created from an approved request (got ${request.status}).`
      );
  }

  if (request.larpId && request.status !== EditStatus.AUTO_APPROVED) {
    throw new Error("A larp has already been created from this request.");
  }

  const content = ModerationRequestContent.parse(request.newContent);
  let larp: Pick<Larp, "id"> | null = null;
  if (request.larpId) {
    larp = await prisma.larp.findUnique({
      where: { id: request.larpId },
      select: { id: true },
    });

    if (!larp) {
      throw new Error("Larp not found");
    }
  } else {
    larp = await prisma.larp.create({
      data: {
        name: content.name,
        type: LarpType.ONE_SHOT, // TODO
        tagline: content.tagline,
        language: content.language,
        locationText: content.locationText,
        fluffText: content.fluffText,
        description: content.description,
        startsAt: fromMorningNull(content.startsAt),
        endsAt: fromEveningNull(content.endsAt),
        signupStartsAt: fromEveningNull(content.signupStartsAt),
        signupEndsAt: fromJustBeforeMidnightNull(content.signupEndsAt),
      },
      select: {
        id: true,
      },
    });
  }

  if (request.submitterId) {
    const roles: Omit<RelatedUser, "id">[] = [
      {
        userId: request.submitterId,
        larpId: larp.id,
        role: RelatedUserRole.CREATED_BY,
      },
    ];

    if (
      request.submitterRole === SubmitterRole.GAME_MASTER ||
      request.submitterRole === SubmitterRole.VOLUNTEER
    ) {
      roles.push({
        userId: request.submitterId,
        larpId: larp.id,
        role: request.submitterRole,
      });
    }

    await Promise.all([
      prisma.relatedUser.createMany({
        data: roles,
      }),

      // Verify the user if they are not yet verified
      // so that they may create further larps without pre-moderation
      prisma.user.updateMany({
        where: { id: request.submitterId, role: UserRole.NOT_VERIFIED },
        data: { role: UserRole.VERIFIED },
      }),
    ]);
  }

  // Auto-approved requests are not resolved; they will be post-moderated.
  let resolvedAt: Date | null = null;
  let resolvedById: string | null = null;
  let resolvedMessage: string | null = null;
  if (request.status === EditStatus.APPROVED) {
    resolvedAt = new Date();
    resolvedById = resolvedBy.id;
    resolvedMessage = reason;
  }

  await prisma.moderationRequest.update({
    where: { id: request.id },
    data: {
      larpId: larp.id,
      resolvedAt,
      resolvedById,
      resolvedMessage,
    },
  });

  return larp;
}

export async function rejectRequest(
  request: Pick<ModerationRequest, "id" | "action" | "status">,
  resolvedBy: Pick<User, "id" | "role">,
  reason: string | null
): Promise<void> {
  if (
    request.status === EditStatus.APPROVED ||
    request.status === EditStatus.REJECTED
  ) {
    throw new Error("Request is already resolved");
  }

  await prisma.moderationRequest.update({
    where: { id: request.id },
    data: {
      status: EditStatus.REJECTED,
      resolvedAt: new Date(),
      resolvedById: resolvedBy.id,
      resolvedMessage: reason,
    },
  });
}
