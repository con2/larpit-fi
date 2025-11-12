import { sendEmail } from "@/email";
import VerifyRequest, {
  verifyRequestSubject,
  verifyRequestText,
} from "@/emails/VerifyRequest";
import {
  EditAction,
  EditStatus,
  Language,
  Larp,
  LarpType,
  ModerationRequest,
  Openness,
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
  zPlainDateNull,
} from "@/helpers/temporal";
import prisma from "@/prisma";
import { toSupportedLanguage } from "@/translations";
import { pretty, render } from "@react-email/render";
import z from "zod";
import {
  handleLarpLinks,
  LarpLinkRemovable,
  LarpLinkUpsertable,
} from "./LarpLink";

export enum Resolution {
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export const zResolution = z.enum<typeof Resolution>(Resolution);
export const zOpenness = z.preprocess(
  (value) => (value === "" ? null : value),
  z.enum<typeof Openness>(Openness).nullable().default(null)
);
export const zSubmitterRole = z.enum<typeof SubmitterRole>(SubmitterRole);
export const zLanguage = z.enum<typeof Language>(Language).default(Language.fi);

export const ModerationRequestContent = z.object({
  name: z.string().min(1).max(200),
  tagline: z.string().max(500).optional().default(""),
  openness: zOpenness,
  language: zLanguage,
  fluffText: z.string().max(2000).optional().default(""),
  description: z.string().max(2000).optional().default(""),

  locationText: z.string().max(200).optional().default(""),
  municipality: z.string().max(20).nullable().default(null),

  numPlayerCharacters: z.int().nullable().default(null),
  numTotalParticipants: z.int().nullable().default(null),

  startsAt: zPlainDateNull,
  endsAt: zPlainDateNull,
  signupStartsAt: zPlainDateNull,
  signupEndsAt: zPlainDateNull,
});

export const ModerationRequestForm = ModerationRequestContent.extend({
  submitterName: z.string().min(1).max(100).optional(),
  submitterEmail: z.email().optional(),
  submitterRole: zSubmitterRole,
  cat: z.coerce.string().lowercase().optional(),
  message: z.string().max(2000).optional(),
});

export type ModerationRequestContent = z.infer<typeof ModerationRequestContent>;
export type ModerationRequestForm = z.infer<typeof ModerationRequestForm>;

export async function approveRequest(
  request: Pick<
    ModerationRequest,
    | "id"
    | "action"
    | "status"
    | "larpId"
    | "newContent"
    | "addLinks"
    | "removeLinks"
    | "submitterId"
    | "submitterRole"
  >,
  resolvedBy: Pick<User, "id" | "role">,
  reason: string | null,
  newStatus: "APPROVED" | "AUTO_APPROVED"
) {
  if (request.action === EditAction.CREATE) {
    return approveCreateLarpRequest(request, resolvedBy, reason, newStatus);
  } else if (request.action === EditAction.UPDATE) {
    return approveUpdateLarpRequest(request, resolvedBy, reason, newStatus);
  } else {
    throw new Error(`Not implemented yet: ${request.action}`);
  }
}

export function contentToLarp(content: ModerationRequestContent) {
  return {
    name: content.name,
    type: LarpType.ONE_SHOT, // TODO
    openness: content.openness,
    tagline: content.tagline,
    language: content.language,
    locationText: content.locationText,
    municipalityId: content.municipality,
    fluffText: content.fluffText,
    description: content.description,
    startsAt: fromMorningNull(content.startsAt),
    endsAt: fromEveningNull(content.endsAt),
    signupStartsAt: fromEveningNull(content.signupStartsAt),
    signupEndsAt: fromJustBeforeMidnightNull(content.signupEndsAt),
  };
}

async function handleRequestSubmitter(
  action: EditAction,
  larpId: string,
  submitterId: string,
  submitterRole: SubmitterRole
) {
  const roles: Omit<RelatedUser, "id">[] = [];

  if (action === EditAction.CREATE) {
    roles.push({
      larpId,
      userId: submitterId,
      role: RelatedUserRole.CREATED_BY,
    });
  }

  if (
    submitterRole === SubmitterRole.GAME_MASTER ||
    submitterRole === SubmitterRole.VOLUNTEER
  ) {
    roles.push({
      larpId,
      userId: submitterId,
      role: submitterRole,
    });
  }

  await Promise.all([
    prisma.relatedUser.createMany({
      data: roles,
    }),

    // Verify the user if they are not yet verified
    // so that they may create further larps without pre-moderation
    prisma.user.updateMany({
      where: { id: submitterId, role: UserRole.NOT_VERIFIED },
      data: { role: UserRole.VERIFIED },
    }),
  ]);
}

export async function approveCreateLarpRequest(
  request: Pick<
    ModerationRequest,
    | "id"
    | "action"
    | "status"
    | "larpId"
    | "newContent"
    | "addLinks"
    | "submitterId"
    | "submitterRole"
  >,
  resolvedBy: Pick<User, "id" | "role">,
  reason: string | null,
  newStatus: "APPROVED" | "AUTO_APPROVED"
): Promise<Pick<Larp, "id">> {
  if (request.action !== EditAction.CREATE) {
    throw new Error(`Not a create larp request: ${request.id}`);
  }

  if (request.larpId) {
    throw new Error("A larp has already been created from this request.");
  }

  const content = ModerationRequestContent.parse(request.newContent);
  const data = contentToLarp(content);
  const addLinks = z.array(LarpLinkUpsertable).parse(request.addLinks);

  const larp = await prisma.larp.create({
    data,
    select: {
      id: true,
    },
  });

  if (request.submitterId) {
    await handleRequestSubmitter(
      request.action,
      larp.id,
      request.submitterId,
      request.submitterRole
    );
  }

  await handleLarpLinks(larp.id, addLinks, []);
  await handleRequestStatusUpdate(
    request.id,
    larp.id,
    newStatus,
    resolvedBy,
    reason
  );

  return larp;
}

async function handleRequestStatusUpdate(
  requestId: string,
  larpId: string,
  newStatus: "APPROVED" | "AUTO_APPROVED",
  resolvedBy: Pick<User, "id" | "role">,
  reason: string | null
) {
  // Auto-approved requests are not resolved; they will be post-moderated.
  let resolvedAt: Date | null = null;
  let resolvedById: string | null = null;
  let resolvedMessage: string | null = null;
  if (newStatus === EditStatus.APPROVED) {
    resolvedAt = new Date();
    resolvedById = resolvedBy.id;
    resolvedMessage = reason;
  }

  await prisma.moderationRequest.update({
    where: { id: requestId },
    data: {
      larpId,
      resolvedAt,
      resolvedById,
      resolvedMessage,
      status: newStatus,
    },
  });
}

export async function approveUpdateLarpRequest(
  request: Pick<
    ModerationRequest,
    | "id"
    | "action"
    | "status"
    | "larpId"
    | "newContent"
    | "addLinks"
    | "removeLinks"
    | "submitterId"
    | "submitterRole"
  >,
  resolvedBy: Pick<User, "id" | "role">,
  reason: string | null,
  newStatus: "APPROVED" | "AUTO_APPROVED"
): Promise<Pick<Larp, "id">> {
  if (request.action !== EditAction.UPDATE) {
    throw new Error(`Not an update larp request: ${request.id}`);
  }

  if (!request.larpId) {
    throw new Error(`Update larp request without larpId: ${request.id}`);
  }

  const content = ModerationRequestContent.parse(request.newContent);
  const data = contentToLarp(content);
  const addLinks = z.array(LarpLinkUpsertable).parse(request.addLinks);
  const removeLinks = z.array(LarpLinkRemovable).parse(request.removeLinks);

  const larp = await prisma.larp.findUnique({
    where: { id: request.larpId },
    select: { id: true },
  });

  if (!larp) {
    throw new Error("Larp not found");
  }

  await prisma.larp.update({
    where: { id: request.larpId },
    data,
  });

  if (request.submitterId) {
    await handleRequestSubmitter(
      request.action,
      larp.id,
      request.submitterId,
      request.submitterRole
    );
  }

  await handleLarpLinks(larp.id, addLinks, removeLinks);
  await handleRequestStatusUpdate(
    request.id,
    larp.id,
    newStatus,
    resolvedBy,
    reason
  );

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

export async function sendVerificationEmail(
  locale: string,
  request: Pick<ModerationRequest, "id" | "verificationCode" | "submitterEmail">
) {
  const { verificationCode, submitterEmail } = request;
  if (!submitterEmail) {
    throw new Error("No submitter email provided");
  }
  if (!verificationCode) {
    throw new Error("No verification code provided");
  }

  locale = toSupportedLanguage(locale);

  const subject = verifyRequestSubject(locale);
  const html = await pretty(
    await render(
      <VerifyRequest locale={locale} verificationCode={verificationCode} />
    )
  );
  const text = verifyRequestText(locale, verificationCode);

  await sendEmail(submitterEmail, subject, text, html);
}
