import { UnrenderedMarkdown } from "@con2/components";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import z from "zod";

import { FormattedDateTime } from "@/components/FormattedDates";
import ModerationRequestChanges, {
  ChangeItem,
} from "@/components/ModerationRequestChanges";
import { submitterStanding } from "@/components/moderation/ModerationQueueRow";
import {
  DotSeparated,
  requestCreatedAt,
  requestLarpName,
  StatusPill,
  SummaryChips,
} from "@/components/moderation/requestDisplay";
import { typesetDashes } from "@/helpers/larpName";
import { getLarpHref } from "@/models/Larp.client";
import {
  canSeeDeleteRequests,
  getQueueNeighbours,
  getRequestsForLarp,
  getSubmitterHistory,
  summarizeRequest,
} from "@/models/ModerationQueue";
import {
  larpToContent,
  type ModerationRequestContent,
  parsePartialContent,
  parseRequestChanges,
  type RequestChanges,
} from "@/models/ModerationRequest";
import { tagName } from "@/models/Tag.client";
import { parseDates } from "@/prisma/dates";
import { db } from "@/prisma/db";
import {
  EditAction,
  EditStatus,
  RelatedUserRole,
  SubmitterRole,
} from "@/prisma/enums";
import { getTranslations } from "@/translations";

import HandledNotice from "../HandledNotice";
import { requireModerator } from "../requireModerator";
import { markChecked, resolveRequest } from "./actions";
import ApproveButton from "./ApproveButton";

interface Props {
  params: Promise<{ locale: string; requestId: string }>;
  searchParams: Promise<{ handled?: string }>;
}

const decisionFormId = "ModerationRequestPage-decision";

const unresolvedStatuses: EditStatus[] = [
  EditStatus.PENDING_VERIFICATION,
  EditStatus.VERIFIED,
  EditStatus.AUTO_APPROVED,
];

const DeclinedChanges = z
  .object({
    newContent: z.unknown(),
    addLinks: z.unknown(),
    removeLinks: z.unknown(),
    addTags: z.unknown(),
    removeTags: z.unknown(),
    addRelatedLarps: z.unknown(),
    removeRelatedLarps: z.unknown(),
    role: z.enum(SubmitterRole).catch(SubmitterRole.NONE),
  })
  .partial();

function parseDeclined(
  action: EditAction,
  declined: unknown,
): RequestChanges | null {
  if (!declined) return null;
  const parsed = DeclinedChanges.safeParse(declined);
  if (!parsed.success) return null;
  const raw = parsed.data;
  return parseRequestChanges(
    {
      action,
      newContent: raw.newContent ?? {},
      addLinks: raw.addLinks ?? [],
      removeLinks: raw.removeLinks ?? [],
      addTags: raw.addTags ?? [],
      removeTags: raw.removeTags ?? [],
      addRelatedLarps: raw.addRelatedLarps ?? [],
      removeRelatedLarps: raw.removeRelatedLarps ?? [],
      submitterRole: raw.role ?? SubmitterRole.NONE,
    } as Parameters<typeof parseRequestChanges>[0],
    { lenient: true },
  );
}

export default async function ModerationRequestPage({
  params,
  searchParams,
}: Props) {
  const { locale, requestId } = await params;
  const { handled } = await searchParams;
  const translations = getTranslations(locale);
  const t = translations.ModerationRequest;
  const detailT = t.detail;
  const larpT = translations.Larp;
  const tagT = translations.Tag.moderation;

  const moderator = await requireModerator(translations);
  if (!moderator.ok) return moderator.gate;
  const { user } = moderator;

  if (!z.uuid().safeParse(requestId).success) notFound();

  const requestRow = await db.orm.public.ModerationRequest.include(
    "resolvedBy",
    (u) => u.select("id", "name"),
  )
    .include("larp", (l) =>
      l.include("relatedUsers", (r) => r.select("userId", "role")),
    )
    .first({ id: requestId });
  if (!requestRow) notFound();
  const request = parseDates(requestRow);
  const larp = request.larp && parseDates(request.larp);

  const [neighbours, submitterHistory, larpRequests] = await Promise.all([
    getQueueNeighbours(user, request),
    getSubmitterHistory(request),
    request.larpId ? getRequestsForLarp(user, request.larpId) : [],
  ]);

  const changes = parseRequestChanges(request, { lenient: true });
  const declined = parseDeclined(request.action, request.declined);
  const summary = summarizeRequest(request);
  const isCreate = request.action === EditAction.CREATE;
  const isOpenForDecision = request.status === EditStatus.VERIFIED;
  const canDecide =
    request.action !== EditAction.DELETE || canSeeDeleteRequests(user);
  const selectFormId =
    isOpenForDecision && canDecide && request.action !== EditAction.DELETE
      ? decisionFormId
      : null;

  // Before/after for the content fields: the live larp while the edit is still to be decided,
  // the stored pre-edit values once it has been applied.
  let before: Partial<ModerationRequestContent> | null = null;
  let columns = {
    before: detailT.columns.before,
    after: detailT.columns.after,
  };
  if (!isCreate) {
    if (
      larp &&
      (request.status === EditStatus.VERIFIED ||
        request.status === EditStatus.PENDING_VERIFICATION)
    ) {
      before = larpToContent(larp);
      columns = {
        before: detailT.columns.now,
        after: detailT.columns.afterApproval,
      };
    } else if (request.oldContent) {
      before = parsePartialContent(request.oldContent);
      if (request.status === EditStatus.AUTO_APPROVED) {
        columns = {
          before: detailT.columns.beforeEdit,
          after: detailT.columns.liveNow,
        };
      }
    }
  }

  const allChanges = declined ? [changes, declined] : [changes];

  const municipalityIds = [
    before?.municipality,
    ...allChanges.map((c) => c.newContent.municipality),
  ].filter((id): id is string => typeof id === "string" && !!id);
  const tagIds = allChanges.flatMap((c) => [...c.addTags, ...c.removeTags]);
  const relatedLarpIds = allChanges
    .flatMap((c) => [...c.addRelatedLarps, ...c.removeRelatedLarps])
    .flatMap((r) => [r.leftId, r.rightId])
    .filter((id) => id !== request.larpId);

  const [municipalities, tags, relatedLarps] = await Promise.all([
    municipalityIds.length > 0
      ? db.orm.public.Municipality.where((m) => m.id.in(municipalityIds))
          .select("id", "nameFi", "nameSv", "nameOther")
          .all()
      : [],
    tagIds.length > 0
      ? db.orm.public.Tag.where((tag) => tag.id.in(tagIds))
          .select("id", "slug", "nameFi", "nameEn")
          .all()
      : [],
    relatedLarpIds.length > 0
      ? db.orm.public.Larp.where((l) => l.id.in(relatedLarpIds))
          .select("id", "alias", "name")
          .all()
      : [],
  ]);
  const municipalityNames = Object.fromEntries(
    municipalities.map((m) => [
      m.id,
      (locale === "sv" ? m.nameSv : null) ??
        m.nameFi ??
        m.nameSv ??
        m.nameOther ??
        m.id,
    ]),
  );
  const tagById = new Map(tags.map((tag) => [tag.id, tag]));
  const larpById = new Map(relatedLarps.map((l) => [l.id, l]));

  const olderOpenCount = larpRequests.filter(
    (other) =>
      other.id < request.id && unresolvedStatuses.includes(other.status),
  ).length;

  const name = requestLarpName(request);
  const displayName = name ? typesetDashes(name) : detailT.unknownLarp;
  const standing = submitterStanding(request);
  const roleAlreadyHeld =
    changes.role !== SubmitterRole.NONE &&
    !!larp?.relatedUsers.some(
      (related) =>
        related.userId === request.submitterId &&
        related.role === (changes.role as RelatedUserRole),
    );

  function Section({
    id,
    title,
    children,
  }: {
    id: string;
    title: string;
    children: ReactNode;
  }) {
    const headingId = `ModerationRequestPage-${id}`;
    return (
      <section
        className="lf-section lf-mod-section"
        id={id}
        aria-labelledby={headingId}
      >
        <h2 className="lf-label lf-mod-section__title" id={headingId}>
          {title}
        </h2>
        {children}
      </section>
    );
  }

  function otherLarp(relation: { leftId: string; rightId: string }) {
    const otherId =
      relation.leftId === request.larpId ? relation.rightId : relation.leftId;
    const other = larpById.get(otherId);
    return other ? (
      <Link href={getLarpHref(other)}>{typesetDashes(other.name)}</Link>
    ) : (
      otherId
    );
  }

  function relationLabel(relation: {
    leftId: string;
    type: keyof typeof larpT.attributes.leftRelatedLarps.types;
  }) {
    return relation.leftId === request.larpId
      ? larpT.attributes.leftRelatedLarps.types[relation.type]
      : larpT.attributes.rightRelatedLarps.types[relation.type];
  }

  /** The role, link, tag and related-larp changes, selectable when `formId` is given. */
  function listSections(
    listChanges: RequestChanges,
    formId: string | null,
    idPrefix: string,
  ) {
    const hasLinks =
      listChanges.addLinks.length + listChanges.removeLinks.length > 0;
    const hasTags =
      listChanges.addTags.length + listChanges.removeTags.length > 0;
    const hasRelated =
      listChanges.addRelatedLarps.length +
        listChanges.removeRelatedLarps.length >
      0;

    return (
      <>
        {listChanges.role !== SubmitterRole.NONE && (
          <Section id={`${idPrefix}role`} title={detailT.sections.role}>
            <ul className="lf-mod-items">
              <ChangeItem selectFormId={formId} value="role">
                {detailT.becomes(
                  request.submitterName,
                  t.attributes.submitterRole.choices[listChanges.role].title,
                )}
                {roleAlreadyHeld && (
                  <span className="lf-help d-block">
                    {detailT.alreadyHasRole}
                  </span>
                )}
              </ChangeItem>
            </ul>
          </Section>
        )}

        {hasLinks && (
          <Section id={`${idPrefix}links`} title={detailT.sections.links}>
            <ul className="lf-mod-items">
              {listChanges.addLinks.map((link, index) => (
                <ChangeItem
                  key={`add-${index}`}
                  selectFormId={formId}
                  value={`addLinks:${index}`}
                  verb={detailT.addLink}
                >
                  <span className="lf-dim">
                    {larpT.attributes.links.types[link.type].title}:{" "}
                  </span>
                  <a href={link.href} target="_blank" rel="noopener noreferrer">
                    {link.href}
                  </a>
                  {link.title && <> — {link.title}</>}
                </ChangeItem>
              ))}
              {listChanges.removeLinks.map((link, index) => (
                <ChangeItem
                  key={`remove-${index}`}
                  selectFormId={formId}
                  value={`removeLinks:${index}`}
                  verb={detailT.removeLink}
                >
                  <span className="lf-dim">
                    {larpT.attributes.links.types[link.type].title}:{" "}
                  </span>
                  <s>{link.href}</s>
                  {link.title && <> — {link.title}</>}
                </ChangeItem>
              ))}
            </ul>
          </Section>
        )}

        {hasTags && (
          <Section id={`${idPrefix}tags`} title={detailT.sections.tags}>
            <ul className="lf-mod-items">
              {(
                [
                  ["addTags", detailT.addTag],
                  ["removeTags", detailT.removeTag],
                ] as const
              ).flatMap(([key, verb]) =>
                listChanges[key].map((tagId, index) => {
                  const tag = tagById.get(tagId);
                  return (
                    <ChangeItem
                      key={`${key}-${index}`}
                      selectFormId={formId}
                      value={`${key}:${index}`}
                      verb={verb}
                    >
                      {tag ? (
                        <Link href={`/tag/${tag.slug}`}>
                          {tagName(tag, locale)}
                        </Link>
                      ) : (
                        <em className="lf-dim">{tagT.deletedTag}</em>
                      )}
                    </ChangeItem>
                  );
                }),
              )}
            </ul>
          </Section>
        )}

        {hasRelated && (
          <Section id={`${idPrefix}related`} title={detailT.sections.related}>
            <ul className="lf-mod-items">
              {(
                [
                  ["addRelatedLarps", detailT.addRelation],
                  ["removeRelatedLarps", detailT.removeRelation],
                ] as const
              ).flatMap(([key, verb]) =>
                listChanges[key].map((relation, index) => (
                  <ChangeItem
                    key={`${key}-${index}`}
                    selectFormId={formId}
                    value={`${key}:${index}`}
                    verb={verb}
                  >
                    <span className="lf-dim">
                      {relationLabel(relation) || relation.type}:{" "}
                    </span>
                    {otherLarp(relation)}
                  </ChangeItem>
                )),
              )}
            </ul>
          </Section>
        )}
      </>
    );
  }

  const selectableCount = selectFormId
    ? summary.total - (isCreate ? Object.keys(changes.newContent).length : 0)
    : 0;

  return (
    <div className="lf-container">
      <header className="lf-page-header lf-mod-header">
        <nav className="lf-mod-header__nav">
          <Link href="/moderate" className="lf-link-quiet">
            ← {detailT.back}
          </Link>
          {neighbours && (
            <span className="lf-mod-header__position">
              {neighbours.previousId && (
                <Link
                  href={`/moderate/${neighbours.previousId}`}
                  className="lf-link-quiet"
                  rel="prev"
                >
                  ← {detailT.previous}
                </Link>
              )}
              <span className="lf-data lf-dim">
                {detailT.position(neighbours.position, neighbours.total)}
              </span>
              {neighbours.nextId && (
                <Link
                  href={`/moderate/${neighbours.nextId}`}
                  className="lf-link-quiet"
                  rel="next"
                >
                  {detailT.next} →
                </Link>
              )}
            </span>
          )}
        </nav>
        <HandledNotice requestId={handled} messages={t} />
        <p className="lf-eyebrow">
          <StatusPill status={request.status} messages={t} />{" "}
          {t.actionLabels[request.action]}
        </p>
        <h1 className="lf-display-l">
          {detailT.titles[request.action](displayName)}
        </h1>
        <p className="lf-muted mb-0">
          <DotSeparated>
            {[
              request.submitterName,
              <FormattedDateTime
                key="created"
                locale={locale}
                value={requestCreatedAt(request.id)}
              />,
              standing && larpT.clientAttributes.role.choices[standing],
              larp && (
                <Link key="larp" href={getLarpHref(larp)}>
                  {detailT.openLarp}
                </Link>
              ),
            ]}
          </DotSeparated>
        </p>
        <SummaryChips summary={summary} messages={t.chips} linkToSections />
      </header>

      <div className="lf-main-aside">
        <div>
          {request.message && (
            <Section id="message" title={detailT.sections.message}>
              <blockquote className="lf-mod-message">
                <UnrenderedMarkdown>{request.message}</UnrenderedMarkdown>
              </blockquote>
            </Section>
          )}

          {(summary.fieldKeys.length > 0 ||
            request.action !== EditAction.DELETE) && (
            <Section id="details" title={detailT.sections.details}>
              <ModerationRequestChanges
                action={request.action}
                changes={changes.newContent}
                before={before}
                columns={columns}
                selectFormId={isCreate ? null : selectFormId}
                larpT={larpT}
                changesT={t.changes}
                detailT={detailT}
                locale={locale}
                municipalityNames={municipalityNames}
              />
            </Section>
          )}

          {listSections(changes, selectFormId, "")}

          {declined && (
            <section
              className="lf-section lf-mod-declined"
              aria-labelledby="ModerationRequestPage-notApplied"
            >
              <div className="lf-section-heading">
                <h2
                  className="lf-heading"
                  id="ModerationRequestPage-notApplied"
                >
                  {detailT.sections.notApplied}
                </h2>
              </div>
              <p className="lf-help mt-2">{detailT.notAppliedHelp}</p>
              {Object.keys(declined.newContent).length > 0 && (
                <ModerationRequestChanges
                  action={request.action}
                  changes={declined.newContent}
                  before={null}
                  columns={columns}
                  selectFormId={null}
                  larpT={larpT}
                  changesT={t.changes}
                  detailT={detailT}
                  locale={locale}
                  municipalityNames={municipalityNames}
                />
              )}
              {listSections(declined, null, "declined-")}
            </section>
          )}
        </div>

        <aside>
          {isOpenForDecision && !canDecide && (
            <p className="lf-notice mb-0">{t.actions.deleteAdminOnly}</p>
          )}

          {isOpenForDecision && canDecide && (
            <form
              id={decisionFormId}
              action={resolveRequest.bind(null, locale, request.id)}
              className="lf-surface lf-mod-card lf-mod-card--decision"
            >
              <h2 className="lf-surface__title">{detailT.decision.title}</h2>
              <p className="lf-muted">
                {detailT.decision.changes(summary.total)}
              </p>
              {olderOpenCount > 0 && (
                <p className="lf-mod-warning">
                  {t.changes.olderPendingWarning(olderOpenCount)}
                </p>
              )}
              {selectableCount > 0 && (
                <p className="lf-help">{detailT.decision.untickHelp}</p>
              )}
              <div>
                <label
                  htmlFor="ModerationRequestPage-reason"
                  className="form-label"
                >
                  {t.attributes.resolvedMessage.label}
                </label>
                <textarea
                  id="ModerationRequestPage-reason"
                  name="reason"
                  rows={4}
                  className="form-control"
                />
                <p className="lf-help mt-1 mb-0">
                  {t.attributes.resolvedMessage.helpText}
                </p>
              </div>
              <div className="lf-mod-card__actions">
                {request.action === EditAction.DELETE ? (
                  <button
                    type="submit"
                    name="resolution"
                    value="APPROVED"
                    className="btn btn-danger"
                  >
                    {detailT.decision.approveDelete}
                  </button>
                ) : isCreate ? (
                  <ApproveButton
                    formId={decisionFormId}
                    total={selectableCount}
                    allLabel={detailT.decision.approveCreate}
                    someLabel={detailT.decision.approveCreate}
                    allowNone
                  />
                ) : (
                  <ApproveButton
                    formId={decisionFormId}
                    total={selectableCount}
                    allLabel={
                      selectableCount > 1
                        ? detailT.decision.approveAll
                        : detailT.decision.approve
                    }
                    someLabel={detailT.decision.approveSome}
                  />
                )}
                <button
                  type="submit"
                  name="resolution"
                  value="REJECTED"
                  className="btn btn-outline-danger"
                >
                  {detailT.decision.reject}
                </button>
              </div>
            </form>
          )}

          {request.status === EditStatus.AUTO_APPROVED && (
            <form
              action={markChecked.bind(null, locale, request.id)}
              className="lf-surface lf-mod-card lf-mod-card--check"
            >
              <h2 className="lf-surface__title">{detailT.check.title}</h2>
              <p className="lf-muted">{detailT.check.description}</p>
              <div>
                <label
                  htmlFor="ModerationRequestPage-note"
                  className="form-label"
                >
                  {t.attributes.resolvedMessage.label}
                </label>
                <textarea
                  id="ModerationRequestPage-note"
                  name="reason"
                  rows={3}
                  className="form-control"
                />
              </div>
              <div className="lf-mod-card__actions">
                <button type="submit" className="btn btn-primary">
                  {detailT.check.submit}
                </button>
                {request.larpId && (
                  <Link
                    href={`/larp/${request.larpId}/edit`}
                    className="btn btn-outline-secondary"
                  >
                    {detailT.check.fix}
                  </Link>
                )}
              </div>
            </form>
          )}

          {request.status === EditStatus.PENDING_VERIFICATION && (
            <p className="lf-notice mb-0">{detailT.pendingVerification}</p>
          )}

          {!unresolvedStatuses.includes(request.status) && (
            <section className="lf-surface lf-surface--compact lf-mod-card">
              <h2 className="lf-surface__title">{detailT.outcome.title}</h2>
              <p>
                <StatusPill status={request.status} messages={t} />
              </p>
              <dl className="lf-mod-facts">
                <dt>{detailT.outcome.resolvedBy}</dt>
                <dd>
                  {request.resolvedBy?.name ?? (
                    <em className="lf-dim">{detailT.outcome.notResolved}</em>
                  )}
                </dd>
                {request.resolvedAt && (
                  <>
                    <dt>{detailT.outcome.resolvedAt}</dt>
                    <dd>
                      <FormattedDateTime
                        locale={locale}
                        value={request.resolvedAt}
                      />
                    </dd>
                  </>
                )}
                {request.resolvedMessage && (
                  <>
                    <dt>{detailT.outcome.reason}</dt>
                    <dd>
                      <UnrenderedMarkdown>
                        {request.resolvedMessage}
                      </UnrenderedMarkdown>
                    </dd>
                  </>
                )}
              </dl>
            </section>
          )}

          <section className="lf-surface lf-surface--compact lf-mod-card">
            <h2 className="lf-surface__title">{detailT.submitter.title}</h2>
            <dl className="lf-mod-facts">
              <dt>{t.attributes.submitterName.title}</dt>
              <dd>{request.submitterName}</dd>
              <dt>{t.attributes.submitterEmail.title}</dt>
              <dd>
                <a href={`mailto:${request.submitterEmail}`}>
                  {request.submitterEmail}
                </a>
              </dd>
              <dt>{t.attributes.submitterRole.title}</dt>
              <dd>
                {
                  t.attributes.submitterRole.choices[request.submitterRole]
                    .title
                }
              </dd>
            </dl>
            <p className="lf-help mb-0">
              {request.submitterId
                ? detailT.submitter.signedIn
                : detailT.submitter.notSignedIn}
            </p>
            <div>
              <h3 className="lf-label mb-2">{detailT.submitter.history}</h3>
              {Object.keys(submitterHistory).length === 0 ? (
                <p className="lf-help mb-0">{detailT.submitter.noHistory}</p>
              ) : (
                <div className="lf-tags">
                  {Object.values(EditStatus).flatMap((status) => {
                    const count = submitterHistory[status];
                    return count ? (
                      <span key={status} className="lf-mod-history">
                        <StatusPill status={status} messages={t} />
                        <span className="lf-data">{count}</span>
                      </span>
                    ) : (
                      []
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {larpRequests.length > 1 && (
            <section aria-labelledby="ModerationRequestPage-larpRequests">
              <h2
                id="ModerationRequestPage-larpRequests"
                className="lf-label lf-sidebar-heading"
              >
                {detailT.larpRequests.title}
              </h2>
              <ul className="lf-mod-larp-requests">
                {larpRequests.map((other) => (
                  <li key={other.id}>
                    <Link
                      href={`/moderate/${other.id}`}
                      aria-current={
                        other.id === request.id ? "page" : undefined
                      }
                    >
                      <StatusPill status={other.status} messages={t} />
                      <span>
                        {t.actionLabels[other.action]} · {other.submitterName}
                        {other.id === request.id && (
                          <span className="lf-dim">
                            {" "}
                            ({detailT.larpRequests.current})
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
