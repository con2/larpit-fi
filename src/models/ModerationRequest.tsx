import {
  toISODateNull,
  toPlainDateNull,
  zPlainDateNull,
} from "@con2/components/helpers";
import { pretty, render } from "react-email";
import z from "zod";

import { sendEmail } from "@/email";
import { deleteHeaderImage } from "@/models/HeaderImage";
import VerifyRequest, {
  verifyRequestSubject,
  verifyRequestText,
} from "@/emails/VerifyRequest";
import { formatDates, iso, parseDates } from "@/prisma/dates";
import { db, type Tx } from "@/prisma/db";
import { toJson } from "@/prisma/json";
import {
  EditAction,
  EditStatus,
  Language,
  LarpType,
  Openness,
  RelatedUserRole,
  RelatedUserVisibility,
  SubmitterRole,
  UserRole,
} from "@/prisma/enums";
import type { Larp, ModerationRequest, Row, User } from "@/prisma/models";
import { toSupportedLanguage } from "@/translations";
import { personNameSchema } from "./User";
import {
  handleLarpLinks,
  LarpLinkRemovable,
  LarpLinkUpsertable,
} from "./LarpLink";
import {
  handleRelatedLarps,
  RelatedLarpAddable,
  RelatedLarpRemovable,
} from "./RelatedLarp";
import { handleLarpTags, TagIds } from "./Tag";

export enum Resolution {
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

const zLarpType = z.enum(LarpType).default(LarpType.ONE_SHOT);
export const zResolution = z.enum(Resolution);
const zOpenness = z.preprocess(
  (value) => (value === "" ? null : value),
  z.enum(Openness).nullable().default(null),
);
const zSubmitterRole = z.enum(SubmitterRole);
const zCountNull = z.preprocess(
  (value) => (value === "" ? null : value),
  z.coerce.number().int().nonnegative().nullable().default(null),
);
const zLanguage = z.enum(Language).default(Language.fi);

/**
 * Free text as stored on a larp, in Unicode NFC. Pasted text can spell "ä" as "a" plus a
 * combining mark, which search would neither stem nor fold like the composed letter.
 */
const zText = () => z.string().normalize();

export const ModerationRequestContent = z.object({
  name: zText().min(1).max(200),
  tagline: zText().max(500).optional().default(""),
  type: zLarpType,
  openness: zOpenness,
  language: zLanguage,
  fluffText: zText().max(2000).optional().default(""),
  description: zText().max(2000).optional().default(""),

  locationText: zText().max(200).optional().default(""),
  municipality: z.preprocess(
    (v) => (v === "" ? null : v),
    z.string().max(20).nullable().default(null),
  ),

  numPlayerCharacters: zCountNull,
  numTotalParticipants: zCountNull,

  startsAt: zPlainDateNull,
  endsAt: zPlainDateNull,
  signupStartsAt: zPlainDateNull,
  signupEndsAt: zPlainDateNull,

  isCancelled: z.coerce.boolean().default(false),
});

export const ModerationRequestForm = ModerationRequestContent.extend({
  submitterName: personNameSchema(100).optional(),
  submitterEmail: z.email().optional(),
  submitterRole: zSubmitterRole,
  cat: z.coerce.string().optional(),
  message: z.string().max(2000).optional(),
});

export type ModerationRequestContent = z.infer<typeof ModerationRequestContent>;
export type ModerationRequestForm = z.infer<typeof ModerationRequestForm>;

type RequestChangeColumns =
  | "action"
  | "newContent"
  | "addLinks"
  | "removeLinks"
  | "addRelatedLarps"
  | "removeRelatedLarps"
  | "addTags"
  | "removeTags"
  | "submitterRole";

/** The changes a request proposes, parsed from its JSON columns. */
export interface RequestChanges {
  newContent: Partial<ModerationRequestContent>;
  addLinks: LarpLinkUpsertable[];
  removeLinks: LarpLinkRemovable[];
  addTags: string[];
  removeTags: string[];
  addRelatedLarps: RelatedLarpAddable[];
  removeRelatedLarps: RelatedLarpRemovable[];
  /** The role the submitter gains on the larp; NONE when the request grants none. */
  role: SubmitterRole;
}

export type ChangeListKey = Exclude<
  keyof RequestChanges,
  "newContent" | "role"
>;

export const changeListKeys: ChangeListKey[] = [
  "addLinks",
  "removeLinks",
  "addTags",
  "removeTags",
  "addRelatedLarps",
  "removeRelatedLarps",
];

/**
 * Which of a request's changes a moderator approves: the content field keys, the indexes into
 * each add/remove list, and whether the submitter gets the role they stated.
 */
export interface ApprovalSelection extends Record<ChangeListKey, number[]> {
  fields: (keyof ModerationRequestContent)[];
  role: boolean;
}

/**
 * Parse the changes stored on a request. With `lenient`, entries that no longer parse are
 * dropped instead of failing; older rows have link removals without `type`, for example.
 */
export function parseRequestChanges(
  request: Pick<ModerationRequest, RequestChangeColumns>,
  { lenient = false }: { lenient?: boolean } = {},
): RequestChanges {
  function parse<T>(schema: z.ZodType<T[]>, value: unknown): T[] {
    return lenient ? schema.catch([]).parse(value) : schema.parse(value);
  }

  return {
    newContent:
      request.action === EditAction.CREATE
        ? ModerationRequestContent.parse(request.newContent)
        : parsePartialContent(request.newContent),
    addLinks: parse(z.array(LarpLinkUpsertable), request.addLinks),
    removeLinks: parse(z.array(LarpLinkRemovable), request.removeLinks),
    addTags: parse(TagIds, request.addTags),
    removeTags: parse(TagIds, request.removeTags),
    addRelatedLarps: parse(
      z.array(RelatedLarpAddable),
      request.addRelatedLarps,
    ),
    removeRelatedLarps: parse(
      z.array(RelatedLarpRemovable),
      request.removeRelatedLarps,
    ),
    role: request.submitterRole,
  };
}

export function countChanges(changes: RequestChanges): number {
  return (
    Object.keys(changes.newContent).length +
    changeListKeys.reduce((sum, key) => sum + changes[key].length, 0) +
    (changes.role === SubmitterRole.NONE ? 0 : 1)
  );
}

/**
 * Split a request's changes into what the selection approves and what it leaves out.
 * Without a selection everything is applied and `declined` is null, as it is whenever the
 * selection covers every change.
 */
export function splitRequestChanges(
  changes: RequestChanges,
  selection?: ApprovalSelection,
): { applied: RequestChanges; declined: RequestChanges | null } {
  if (!selection) {
    return { applied: changes, declined: null };
  }

  const fields = new Set<string>(selection.fields);
  const contentEntries = Object.entries(changes.newContent);
  const applied: RequestChanges = {
    newContent: Object.fromEntries(
      contentEntries.filter(([key]) => fields.has(key)),
    ),
    role: selection.role ? changes.role : SubmitterRole.NONE,
  } as RequestChanges;
  const declined: RequestChanges = {
    newContent: Object.fromEntries(
      contentEntries.filter(([key]) => !fields.has(key)),
    ),
    role: selection.role ? SubmitterRole.NONE : changes.role,
  } as RequestChanges;

  for (const key of changeListKeys) {
    const selected = new Set(selection[key]);
    const list = changes[key] as unknown[];
    (applied[key] as unknown[]) = list.filter((_, index) =>
      selected.has(index),
    );
    (declined[key] as unknown[]) = list.filter(
      (_, index) => !selected.has(index),
    );
  }

  return {
    applied,
    declined: countChanges(declined) > 0 ? declined : null,
  };
}

/**
 * Split the changes for approval. Refuses a selection that leaves nothing to apply from a
 * request that has changes, so an approval never silently does nothing.
 */
function selectChanges(changes: RequestChanges, selection?: ApprovalSelection) {
  const split = splitRequestChanges(changes, selection);
  if (split.declined && countChanges(split.applied) === 0) {
    throw new Error("Nothing was selected for approval");
  }
  return split;
}

/**
 * The request's change columns narrowed to what was applied, with the rest under `declined`,
 * so that every reader of the row sees what actually went live.
 */
function narrowedRequestColumns(
  applied: RequestChanges,
  declined: RequestChanges | null,
) {
  if (!declined) {
    return {};
  }
  return {
    newContent: toJson(applied.newContent),
    addLinks: toJson(applied.addLinks),
    removeLinks: toJson(applied.removeLinks),
    addTags: toJson(applied.addTags),
    removeTags: toJson(applied.removeTags),
    addRelatedLarps: toJson(applied.addRelatedLarps),
    removeRelatedLarps: toJson(applied.removeRelatedLarps),
    submitterRole: applied.role,
    declined: toJson(declined),
  };
}

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
    | "addRelatedLarps"
    | "removeRelatedLarps"
    | "addTags"
    | "removeTags"
    | "submitterId"
    | "submitterRole"
  >,
  resolvedBy: Pick<User, "id" | "role">,
  reason: string | null,
  newStatus: "APPROVED" | "AUTO_APPROVED",
  selection?: ApprovalSelection,
) {
  if (request.action === EditAction.CREATE) {
    return approveCreateLarpRequest(
      request,
      resolvedBy,
      reason,
      newStatus,
      selection,
    );
  } else if (request.action === EditAction.UPDATE) {
    return approveUpdateLarpRequest(
      request,
      resolvedBy,
      reason,
      newStatus,
      selection,
    );
  } else if (request.action === EditAction.DELETE) {
    return approveDeleteLarpRequest(request);
  } else {
    throw new Error(`Not implemented yet: ${request.action}`);
  }
}

export function larpToContent(
  larp: Pick<
    Larp,
    | "name"
    | "tagline"
    | "type"
    | "openness"
    | "language"
    | "fluffText"
    | "description"
    | "locationText"
    | "municipalityId"
    | "numPlayerCharacters"
    | "numTotalParticipants"
    | "startsAt"
    | "endsAt"
    | "signupStartsAt"
    | "signupEndsAt"
    | "cancelledAt"
  >,
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
    isCancelled: larp.cancelledAt !== null,
  };
}

/**
 * Parse a stored diff back to Partial<ModerationRequestContent>.
 * Cannot use ModerationRequestContent.partial().parse() directly because Zod still applies
 * .default() to absent fields, turning a minimal diff into a full object of defaults.
 */
export function parsePartialContent(
  raw: unknown,
): Partial<ModerationRequestContent> {
  const presentKeys = new Set(Object.keys(raw as object));
  const parsed = ModerationRequestContent.partial().parse(raw);
  return Object.fromEntries(
    Object.entries(parsed).filter(([key]) => presentKeys.has(key)),
  ) as Partial<ModerationRequestContent>;
}

export function diffLarpContent(
  oldContent: ModerationRequestContent,
  newContent: ModerationRequestContent,
): Partial<ModerationRequestContent> {
  const result: Partial<ModerationRequestContent> = {};

  for (const key of Object.keys(
    newContent,
  ) as (keyof ModerationRequestContent)[]) {
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

function contentToLarp(content: ModerationRequestContent) {
  const {
    municipality,
    startsAt,
    endsAt,
    signupStartsAt,
    signupEndsAt,
    isCancelled,
    ...rest
  } = content;

  return {
    ...rest,
    municipalityId: municipality,
    startsAt: toISODateNull(startsAt),
    endsAt: toISODateNull(endsAt),
    signupStartsAt: toISODateNull(signupStartsAt),
    signupEndsAt: toISODateNull(signupEndsAt),
    cancelledAt: isCancelled ? new Date() : null,
  };
}

function partialContentToLarp(content: Partial<ModerationRequestContent>) {
  const {
    municipality,
    startsAt,
    endsAt,
    signupStartsAt,
    signupEndsAt,
    isCancelled,
    ...rest
  } = content;

  return {
    ...rest,
    ...(municipality !== undefined ? { municipalityId: municipality } : {}),
    ...(startsAt !== undefined ? { startsAt: toISODateNull(startsAt) } : {}),
    ...(endsAt !== undefined ? { endsAt: toISODateNull(endsAt) } : {}),
    ...(signupStartsAt !== undefined
      ? { signupStartsAt: toISODateNull(signupStartsAt) }
      : {}),
    ...(signupEndsAt !== undefined
      ? { signupEndsAt: toISODateNull(signupEndsAt) }
      : {}),
    ...(isCancelled !== undefined
      ? { cancelledAt: isCancelled ? new Date() : null }
      : {}),
  };
}

function assertApprovable(request: Pick<ModerationRequest, "id" | "status">) {
  if (request.status !== EditStatus.VERIFIED) {
    throw new Error(
      `Request ${request.id} cannot be approved from status ${request.status}`,
    );
  }
}

async function handleRequestSubmitter(
  tx: Tx,
  action: EditAction,
  larpId: string,
  submitterId: string,
  submitterRole: SubmitterRole,
) {
  const roles: RelatedUserRole[] = [];

  if (action === EditAction.CREATE) {
    roles.push(RelatedUserRole.CREATED_BY);
  }

  if (submitterRole !== SubmitterRole.NONE) {
    roles.push(submitterRole);
  }

  for (const role of roles) {
    await tx.orm.public.RelatedUser.upsert({
      create: {
        larpId,
        userId: submitterId,
        role,
        visibility: RelatedUserVisibility.ONLY_ME,
      },
      update: {},
    });
  }

  // Verify the user if they are not yet verified
  // so that they may create further larps without pre-moderation
  await tx.orm.public.User.where({
    id: submitterId,
    role: UserRole.NOT_VERIFIED,
  }).updateAndCount({ role: UserRole.VERIFIED });
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
    | "removeLinks"
    | "addRelatedLarps"
    | "removeRelatedLarps"
    | "addTags"
    | "removeTags"
    | "submitterId"
    | "submitterRole"
  >,
  resolvedBy: Pick<User, "id" | "role">,
  reason: string | null,
  newStatus: "APPROVED" | "AUTO_APPROVED",
  selection?: ApprovalSelection,
): Promise<Pick<Larp, "id">> {
  if (request.action !== EditAction.CREATE) {
    throw new Error(`Not a create larp request: ${request.id}`);
  }

  if (request.larpId) {
    throw new Error("A larp has already been created from this request.");
  }

  assertApprovable(request);

  const content = ModerationRequestContent.parse(request.newContent);
  const changes = parseRequestChanges(request);
  // The larp fields of a new larp are approved as a whole: the name is required and the
  // fields are the page.
  const { applied, declined } = selectChanges(
    changes,
    selection && {
      ...selection,
      fields: Object.keys(
        changes.newContent,
      ) as (keyof ModerationRequestContent)[],
    },
  );

  return db.transaction(async (tx) => {
    const larp = await tx.orm.public.Larp.select("id").create(
      formatDates(contentToLarp(content)),
    );

    if (request.submitterId) {
      await handleRequestSubmitter(
        tx,
        request.action,
        larp.id,
        request.submitterId,
        applied.role,
      );
    }

    await handleLarpLinks(tx, larp.id, applied.addLinks, []);
    await handleLarpTags(tx, larp.id, applied.addTags, []);
    await handleRequestStatusUpdate(
      tx,
      request.id,
      larp.id,
      newStatus,
      resolvedBy,
      reason,
      narrowedRequestColumns(applied, declined),
    );

    return larp;
  });
}

async function handleRequestStatusUpdate(
  tx: Tx,
  requestId: string,
  larpId: string,
  newStatus: "APPROVED" | "AUTO_APPROVED",
  resolvedBy: Pick<User, "id" | "role">,
  reason: string | null,
  changeColumns: Partial<
    Pick<
      Row<"ModerationRequest">,
      Exclude<RequestChangeColumns, "action"> | "oldContent" | "declined"
    >
  > = {},
) {
  // Auto-approved requests are not resolved; they will be post-moderated.
  let resolvedAt: string | null = null;
  let resolvedById: string | null = null;
  let resolvedMessage: string | null = null;
  if (newStatus === "APPROVED") {
    resolvedAt = iso(new Date());
    resolvedById = resolvedBy.id;
    resolvedMessage = reason;
  }

  await tx.orm.public.ModerationRequest.where({ id: requestId }).update({
    ...changeColumns,
    larpId,
    resolvedAt,
    resolvedById,
    resolvedMessage,
    status: newStatus,
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
    | "addRelatedLarps"
    | "removeRelatedLarps"
    | "addTags"
    | "removeTags"
    | "submitterId"
    | "submitterRole"
  >,
  resolvedBy: Pick<User, "id" | "role">,
  reason: string | null,
  newStatus: "APPROVED" | "AUTO_APPROVED",
  selection?: ApprovalSelection,
): Promise<Pick<Larp, "id">> {
  if (request.action !== EditAction.UPDATE) {
    throw new Error(`Not an update larp request: ${request.id}`);
  }

  if (!request.larpId) {
    throw new Error(`Update larp request without larpId: ${request.id}`);
  }

  assertApprovable(request);

  const { applied, declined } = selectChanges(
    parseRequestChanges(request),
    selection,
  );
  const data = formatDates(partialContentToLarp(applied.newContent));
  const larpId = request.larpId;

  return db.transaction(async (tx) => {
    const larp = await tx.orm.public.Larp.first({ id: larpId });

    if (!larp) {
      throw new Error("Larp not found");
    }

    const contentBefore = larpToContent(parseDates(larp));
    const oldContent = Object.fromEntries(
      Object.keys(applied.newContent).map((key) => [
        key,
        contentBefore[key as keyof ModerationRequestContent],
      ]),
    );

    await tx.orm.public.Larp.where({ id: larp.id }).update({
      ...data,
      updateCount: larp.updateCount + 1,
    });

    if (request.submitterId) {
      await handleRequestSubmitter(
        tx,
        request.action,
        larp.id,
        request.submitterId,
        applied.role,
      );
    }

    await handleLarpLinks(tx, larp.id, applied.addLinks, applied.removeLinks);
    await handleLarpTags(tx, larp.id, applied.addTags, applied.removeTags);
    await handleRelatedLarps(
      tx,
      applied.addRelatedLarps,
      applied.removeRelatedLarps,
    );

    await handleRequestStatusUpdate(
      tx,
      request.id,
      larp.id,
      newStatus,
      resolvedBy,
      reason,
      {
        ...narrowedRequestColumns(applied, declined),
        oldContent: toJson(oldContent),
      },
    );

    return { id: larp.id };
  });
}

export async function rejectRequest(
  request: Pick<ModerationRequest, "id" | "action" | "status">,
  resolvedBy: Pick<User, "id" | "role">,
  reason: string | null,
): Promise<void> {
  if (
    request.status === EditStatus.APPROVED ||
    request.status === EditStatus.REJECTED
  ) {
    throw new Error("Request is already resolved");
  }

  await db.orm.public.ModerationRequest.where({ id: request.id }).update({
    status: EditStatus.REJECTED,
    resolvedAt: iso(new Date()),
    resolvedById: resolvedBy.id,
    resolvedMessage: reason,
  });
}

export async function approveDeleteLarpRequest(
  request: Pick<ModerationRequest, "id" | "action" | "status" | "larpId">,
): Promise<Pick<Larp, "id">> {
  if (request.action !== EditAction.DELETE) {
    throw new Error(`Not a delete larp request: ${request.id}`);
  }

  if (!request.larpId) {
    throw new Error(`Delete larp request without larpId: ${request.id}`);
  }

  assertApprovable(request);

  const larpId = request.larpId;

  const larp = await db.orm.public.Larp.select("headerImageId").first({
    id: larpId,
  });

  // The request row cascades away with the larp, taking the resolution with it.
  await db.orm.public.Larp.where({ id: larpId }).delete();

  if (larp?.headerImageId) await deleteHeaderImage(larp.headerImageId);

  return { id: larpId };
}

export async function sendVerificationEmail(
  locale: string,
  request: Pick<
    ModerationRequest,
    "id" | "verificationCode" | "submitterEmail"
  >,
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
      <VerifyRequest locale={locale} verificationCode={verificationCode} />,
    ),
  );
  const text = verifyRequestText(locale, verificationCode);

  await sendEmail(submitterEmail, subject, text, html);
}
