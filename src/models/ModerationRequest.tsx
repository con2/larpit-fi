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
} from "@/generated/prisma/client";
import {
  fromEveningNull,
  fromJustBeforeMidnightNull,
  fromMorningNull,
  toPlainDateNull,
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

export const zLarpType = z
  .enum<typeof LarpType>(LarpType)
  .default(LarpType.ONE_SHOT);
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
  type: zLarpType,
  openness: zOpenness,
  language: zLanguage,
  fluffText: z.string().max(2000).optional().default(""),
  description: z.string().max(2000).optional().default(""),

  locationText: z.string().max(200).optional().default(""),
  municipality: z.string().max(20).nullable().default(null),

  numPlayerCharacters: z.coerce.number().nullable().default(null),
  numTotalParticipants: z.coerce.number().nullable().default(null),

  startsAt: zPlainDateNull,
  endsAt: zPlainDateNull,
  signupStartsAt: zPlainDateNull,
  signupEndsAt: zPlainDateNull,
});

export const ModerationRequestForm = ModerationRequestContent.extend({
  submitterName: z.string().min(1).max(100).optional(),
  submitterEmail: z.email().optional(),
  submitterRole: zSubmitterRole,
  cat: z.coerce.string().optional(),
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

export function larpToContent(
  larp: Pick<Larp, 'name' | 'tagline' | 'type' | 'openness' | 'language' |
    'fluffText' | 'description' | 'locationText' | 'municipalityId' |
    'numPlayerCharacters' | 'numTotalParticipants' |
    'startsAt' | 'endsAt' | 'signupStartsAt' | 'signupEndsAt'>
): ModerationRequestContent {
  return {
    name: larp.name,
    tagline: larp.tagline ?? "",
    type: larp.type,
    openness: larp.openness,
    language: larp.language,
    fluffText: larp.fluffText ?? "",
    description: larp.description ?? "",
    locationText: larp.locationText ?? "",
    municipality: larp.municipalityId,
    numPlayerCharacters: larp.numPlayerCharacters,
    numTotalParticipants: larp.numTotalParticipants,
    startsAt: toPlainDateNull(larp.startsAt),
    endsAt: toPlainDateNull(larp.endsAt),
    signupStartsAt: toPlainDateNull(larp.signupStartsAt),
    signupEndsAt: toPlainDateNull(larp.signupEndsAt),
  };
}

/**
 * Parse a stored diff back to Partial<ModerationRequestContent>.
 * Cannot use ModerationRequestContent.partial().parse() directly because Zod still applies
 * .default() to absent fields, turning a minimal diff into a full object of defaults.
 */
export function parsePartialContent(raw: unknown): Partial<ModerationRequestContent> {
  const presentKeys = new Set(Object.keys(raw as object));
  const parsed = ModerationRequestContent.partial().parse(raw);
  return Object.fromEntries(
    Object.entries(parsed).filter(([key]) => presentKeys.has(key))
  ) as Partial<ModerationRequestContent>;
}

export function diffLarpContent(
  oldContent: ModerationRequestContent,
  newContent: ModerationRequestContent
): Partial<ModerationRequestContent> {
  const result: Partial<ModerationRequestContent> = {};

  for (const key of Object.keys(newContent) as (keyof ModerationRequestContent)[]) {
    const oldVal = oldContent[key];
    const newVal = newContent[key];
    const oldStr = oldVal == null ? null : String(oldVal);
    const newStr = newVal == null ? null : String(newVal);
    if (oldStr !== newStr) {
      (result as Record<string, unknown>)[key] = newVal;
    }
  }

  return result;
}

export function contentToLarp(content: ModerationRequestContent) {
  const {
    municipality,
    startsAt,
    endsAt,
    signupStartsAt,
    signupEndsAt,
    ...rest
  } = content;

  return {
    ...rest,
    municipalityId: municipality,
    startsAt: fromMorningNull(startsAt),
    endsAt: fromEveningNull(endsAt),
    signupStartsAt: fromEveningNull(signupStartsAt),
    signupEndsAt: fromJustBeforeMidnightNull(signupEndsAt),
  };
}

export function partialContentToLarp(content: Partial<ModerationRequestContent>) {
  const {
    municipality,
    startsAt,
    endsAt,
    signupStartsAt,
    signupEndsAt,
    ...rest
  } = content;

  return {
    ...rest,
    ...(municipality !== undefined ? { municipalityId: municipality } : {}),
    ...(startsAt !== undefined ? { startsAt: fromMorningNull(startsAt) } : {}),
    ...(endsAt !== undefined ? { endsAt: fromEveningNull(endsAt) } : {}),
    ...(signupStartsAt !== undefined ? { signupStartsAt: fromEveningNull(signupStartsAt) } : {}),
    ...(signupEndsAt !== undefined ? { signupEndsAt: fromJustBeforeMidnightNull(signupEndsAt) } : {}),
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

  if (submitterRole !== SubmitterRole.NONE) {
    roles.push({
      larpId,
      userId: submitterId,
      role: submitterRole,
    });
  }

  await prisma.relatedUser.createMany({
    data: roles,
    skipDuplicates: true,
  });

  // Verify the user if they are not yet verified
  // so that they may create further larps without pre-moderation
  await prisma.user.updateMany({
    where: { id: submitterId, role: UserRole.NOT_VERIFIED },
    data: { role: UserRole.VERIFIED },
  });
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

  const content = parsePartialContent(request.newContent);
  const data = partialContentToLarp(content);
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
