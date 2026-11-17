import { parseDates } from "@/prisma/dates";
import { db } from "@/prisma/db";
import { EditAction, EditStatus, SubmitterRole } from "@/prisma/enums";
import type { ModerationRequest, User } from "@/prisma/models";
import { query, sql } from "@/prisma/sql";
import {
  countChanges,
  type ModerationRequestContent,
  parseRequestChanges,
} from "./ModerationRequest";
import { getDeleteLarpInitialStatusForUser } from "./User";

type Viewer = Pick<User, "role"> | null;

export type OpenStatus =
  typeof EditStatus.VERIFIED | typeof EditStatus.AUTO_APPROVED;

export const openStatuses: OpenStatus[] = [
  EditStatus.VERIFIED,
  EditStatus.AUTO_APPROVED,
];

export const resolvedStatuses: EditStatus[] = [
  EditStatus.APPROVED,
  EditStatus.REJECTED,
  EditStatus.WITHDRAWN,
];

export function isOpenStatus(status: EditStatus): status is OpenStatus {
  return (openStatuses as EditStatus[]).includes(status);
}

/** Requests to delete a larp are handled by admins only, so nobody else sees them listed. */
export function canSeeDeleteRequests(viewer: Viewer): boolean {
  return getDeleteLarpInitialStatusForUser(viewer) === EditStatus.APPROVED;
}

export type ContentFieldKind =
  | "text"
  | "multiline"
  | "enum"
  | "date"
  | "number"
  | "boolean"
  | "municipality";

/** Display order and rendering kind of the larp content fields of a request. */
export const contentFields: {
  key: keyof ModerationRequestContent;
  kind: ContentFieldKind;
}[] = [
  { key: "name", kind: "text" },
  { key: "tagline", kind: "text" },
  { key: "type", kind: "enum" },
  { key: "language", kind: "enum" },
  { key: "openness", kind: "enum" },
  { key: "isCancelled", kind: "boolean" },
  { key: "locationText", kind: "text" },
  { key: "municipality", kind: "municipality" },
  { key: "numPlayerCharacters", kind: "number" },
  { key: "numTotalParticipants", kind: "number" },
  { key: "startsAt", kind: "date" },
  { key: "endsAt", kind: "date" },
  { key: "signupStartsAt", kind: "date" },
  { key: "signupEndsAt", kind: "date" },
  { key: "fluffText", kind: "multiline" },
  { key: "description", kind: "multiline" },
];

/**
 * The content fields a request shows, in display order. A new larp's unset flags are stored as
 * `false`, which says nothing worth listing.
 */
export function shownContentFields(
  action: EditAction,
  content: Partial<ModerationRequestContent>,
) {
  return contentFields.filter(
    ({ key, kind }) =>
      key in content &&
      !(action === EditAction.CREATE && kind === "boolean" && !content[key]),
  );
}

export interface RequestSummary {
  fieldKeys: (keyof ModerationRequestContent)[];
  addsRole: boolean;
  linksAdded: number;
  linksRemoved: number;
  tagsAdded: number;
  tagsRemoved: number;
  relationsAdded: number;
  relationsRemoved: number;
  marksCancelled: boolean;
  total: number;
}

export function summarizeRequest(
  request: Parameters<typeof parseRequestChanges>[0],
): RequestSummary {
  const { action } = request;
  const changes = parseRequestChanges(request, { lenient: true });
  return {
    fieldKeys: shownContentFields(action, changes.newContent).map(
      ({ key }) => key,
    ),
    addsRole: changes.role !== SubmitterRole.NONE,
    linksAdded: changes.addLinks.length,
    linksRemoved: changes.removeLinks.length,
    tagsAdded: changes.addTags.length,
    tagsRemoved: changes.removeTags.length,
    relationsAdded: changes.addRelatedLarps.length,
    relationsRemoved: changes.removeRelatedLarps.length,
    marksCancelled:
      action === EditAction.UPDATE && changes.newContent.isCancelled === true,
    total: countChanges(changes),
  };
}

export async function countOpenRequests(
  viewer: Viewer,
): Promise<Record<OpenStatus, number>> {
  const [counts] = await query<{ verified: string; autoApproved: string }>(sql`
    select
      count(*) filter (where status = ${EditStatus.VERIFIED}) as verified,
      count(*) filter (where status = ${EditStatus.AUTO_APPROVED}) as "autoApproved"
    from moderation_request
    where status in (${EditStatus.VERIFIED}, ${EditStatus.AUTO_APPROVED})
      and (${canSeeDeleteRequests(viewer)}::boolean or action <> ${EditAction.DELETE})
  `);
  return {
    VERIFIED: Number(counts.verified),
    AUTO_APPROVED: Number(counts.autoApproved),
  };
}

export async function countPendingVerification(
  viewer: Viewer,
): Promise<number> {
  const [{ count }] = await query<{ count: string }>(sql`
    select count(*) as count
    from moderation_request
    where status = ${EditStatus.PENDING_VERIFICATION}
      and (${canSeeDeleteRequests(viewer)}::boolean or action <> ${EditAction.DELETE})
  `);
  return Number(count);
}

/** Open requests, oldest first, with the larp and its people for the submitter's standing. */
export async function getOpenRequests(viewer: Viewer) {
  let requests = db.orm.public.ModerationRequest.where((r) =>
    r.status.in(openStatuses),
  );
  if (!canSeeDeleteRequests(viewer)) {
    requests = requests.where((r) => r.action.neq(EditAction.DELETE));
  }
  const rows = await requests
    .include("larp", (l) =>
      l
        .select("id", "name", "alias")
        .include("relatedUsers", (u) => u.select("userId", "role")),
    )
    .orderBy((r) => r.id.asc())
    .all();
  return parseDates(rows);
}

export type OpenRequest = Awaited<ReturnType<typeof getOpenRequests>>[number];

export interface QueueNeighbours {
  /** 1-based position among the open requests of the same status. */
  position: number;
  total: number;
  previousId: string | null;
  nextId: string | null;
  /**
   * Where to go once this request is handled: the next one in the queue, or the oldest one
   * left when this was the last.
   */
  afterHandledId: string | null;
}

export async function getQueueNeighbours(
  viewer: Viewer,
  request: Pick<ModerationRequest, "id" | "status">,
): Promise<QueueNeighbours | null> {
  if (!isOpenStatus(request.status)) {
    return null;
  }
  let requests = db.orm.public.ModerationRequest.where({
    status: request.status,
  });
  if (!canSeeDeleteRequests(viewer)) {
    requests = requests.where((r) => r.action.neq(EditAction.DELETE));
  }
  const ids = (
    await requests
      .select("id")
      .orderBy((r) => r.id.asc())
      .all()
  ).map((row) => row.id);

  const index = ids.indexOf(request.id);
  if (index < 0) {
    return null;
  }
  const previousId = ids[index - 1] ?? null;
  const nextId = ids[index + 1] ?? null;
  return {
    position: index + 1,
    total: ids.length,
    previousId,
    nextId,
    afterHandledId: nextId ?? (index > 0 ? ids[0] : null),
  };
}

export interface ResolvedRequestFilters {
  statuses: EditStatus[];
  action: EditAction | null;
}

export interface ResolvedRequestRow {
  id: string;
  status: EditStatus;
  action: EditAction;
  larpId: string | null;
  larpAlias: string | null;
  /** The larp's name, or for a request whose larp was never created, the proposed name. */
  name: string | null;
  submitterName: string;
  resolvedByName: string | null;
  resolvedAt: Date | null;
  resolvedMessage: string | null;
}

/** Requests in the given statuses, most recently resolved first and unresolved ones last. */
export async function getResolvedRequests(
  viewer: Viewer,
  { statuses, action }: ResolvedRequestFilters,
  offset: number,
  limit: number,
): Promise<{ requests: ResolvedRequestRow[]; count: number }> {
  const where = sql`
    where r.status::text = any(${statuses}::text[])
      and (${action}::text is null or r.action::text = ${action}::text)
      and (${canSeeDeleteRequests(viewer)}::boolean or r.action <> ${EditAction.DELETE})
  `;
  const params = where.values;
  const [rows, [{ count }]] = await Promise.all([
    query<ResolvedRequestRow>({
      text: `
        select
          r.id,
          r.status,
          r.action,
          r.larp_id as "larpId",
          l.alias as "larpAlias",
          coalesce(l.name, r.new_content->>'name') as name,
          r.submitter_name as "submitterName",
          u.name as "resolvedByName",
          r.resolved_at as "resolvedAt",
          r.resolved_message as "resolvedMessage"
        from moderation_request r
        left join larp l on l.id = r.larp_id
        left join "user" u on u.id = r.resolved_by_id
        ${where.text}
        order by r.resolved_at desc nulls last, r.id desc
        offset $${params.length + 1}
        limit $${params.length + 2}
      `,
      values: [...params, offset, limit],
    }),
    query<{ count: string }>({
      text: `select count(*) as count from moderation_request r ${where.text}`,
      values: params,
    }),
  ]);
  return { requests: rows, count: Number(count) };
}

export async function getRecentlyResolved(viewer: Viewer, limit: number) {
  const { requests } = await getResolvedRequests(
    viewer,
    { statuses: resolvedStatuses, action: null },
    0,
    limit,
  );
  return requests;
}

export async function getRequestsForLarp(viewer: Viewer, larpId: string) {
  let requests = db.orm.public.ModerationRequest.where({ larpId });
  if (!canSeeDeleteRequests(viewer)) {
    requests = requests.where((r) => r.action.neq(EditAction.DELETE));
  }
  return requests
    .select("id", "status", "action", "submitterName")
    .orderBy((r) => r.id.asc())
    .all();
}

/**
 * How the submitter's other requests have fared, by status. Requests are matched by user when
 * the submitter was signed in, by e-mail address otherwise.
 */
export async function getSubmitterHistory(
  request: Pick<ModerationRequest, "id" | "submitterId" | "submitterEmail">,
): Promise<Partial<Record<EditStatus, number>>> {
  const rows = await query<{ status: EditStatus; count: string }>(sql`
    select status, count(*) as count
    from moderation_request
    where id <> ${request.id}
      and (
        (${request.submitterId}::uuid is not null and submitter_id = ${request.submitterId}::uuid)
        or (${request.submitterId}::uuid is null and submitter_email = ${request.submitterEmail})
      )
    group by status
  `);
  return Object.fromEntries(rows.map((row) => [row.status, Number(row.count)]));
}
