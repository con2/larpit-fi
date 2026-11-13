import Link from "next/link";
import {
  AccessDeniedPage,
  LoginRequiredPage,
  gateActions,
} from "@/components/GatePage";
import { notFound } from "next/navigation";
import { validate as validateUuid } from "uuid";

import { auth } from "@/auth";
import LarpSubpage from "@/components/larp-page/LarpSubpage";
import SelectLarpCombobox from "@/components/related/SelectLarpCombobox";
import { formatDate, formatDateRange } from "@/helpers/dates";
import { typesetDashes } from "@/helpers/larpName";
import { compareDescNullsLast } from "@/helpers/sort";
import { headerImageViewOrNull } from "@/models/HeaderImage";
import { getLarpHref, larpIdOrAliasFilter } from "@/models/Larp";
import {
  findMergeCandidates,
  getMergePreview,
  type MergePreview,
} from "@/models/LarpMerge";
import type { MergeableField } from "@/models/LarpMerge.client";
import { canModerate, getUserFromSession } from "@/models/User";
import { db } from "@/prisma/db";
import { getTranslations, toSupportedLanguage } from "@/translations";

import MergeForm, {
  type MergeFormCombinedRow,
  type MergeFormField,
  type MergeFormValue,
} from "./MergeForm";

interface Props {
  params: Promise<{ locale: string; larpId: string }>;
  searchParams: Promise<{ with?: string }>;
}

type Translations = ReturnType<typeof getTranslations>;

function fill(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

async function loadSummary(id: string) {
  return db.orm.public.Larp.select(
    "id",
    "name",
    "alias",
    "type",
    "startsAt",
    "endsAt",
    "locationText",
  )
    .include("municipality", (m) => m.select("nameFi", "nameSv", "nameOther"))
    .include("links", (l) => l.select("id"))
    .first({ id });
}

type LarpSummary = NonNullable<Awaited<ReturnType<typeof loadSummary>>>;

function municipalityName(
  municipality: {
    nameFi: string | null;
    nameSv: string | null;
    nameOther: string | null;
  } | null,
  locale: string,
): string | null {
  if (!municipality) return null;
  return (
    (locale === "sv" ? municipality.nameSv : null) ??
    municipality.nameFi ??
    municipality.nameSv ??
    municipality.nameOther
  );
}

function SummaryCard({
  tag,
  note,
  larp,
  locale,
  translations,
  children,
}: {
  tag: string;
  note: string;
  larp?: LarpSummary;
  locale: string;
  translations: Translations;
  children?: React.ReactNode;
}) {
  const place = larp
    ? [municipalityName(larp.municipality, locale), larp.locationText]
        .filter(Boolean)
        .join(" · ")
    : "";
  return (
    <section className="lf-surface lf-merge-side">
      <div className="lf-merge-side__header">
        <span className="lf-tag">{tag}</span>
        <span className="lf-muted">{note}</span>
      </div>
      {larp && (
        <>
          <Link href={getLarpHref(larp)} className="lf-surface__title">
            {typesetDashes(larp.name)}
          </Link>
          <p className="lf-muted mb-0">
            {[
              translations.Larp.attributes.type.choices[larp.type].title,
              formatDateRange(larp.startsAt, larp.endsAt, locale),
              place,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <p className="lf-data mb-0">{getLarpHref(larp)}</p>
        </>
      )}
      {children}
    </section>
  );
}

async function buildFormFields(
  preview: MergePreview,
  locale: string,
  translations: Translations,
): Promise<MergeFormField[]> {
  const larpT = translations.Larp.attributes;
  const t = translations.MergeLarpPage.form;
  const { a, b } = preview;

  const municipalityIds = [a.municipalityId, b.municipalityId].filter(
    (id): id is string => !!id,
  );
  const headerImageIds = [a.headerImageId, b.headerImageId].filter(
    (id): id is string => !!id,
  );
  const [municipalities, headerImages] = await Promise.all([
    municipalityIds.length > 0
      ? db.orm.public.Municipality.select("id", "nameFi", "nameSv", "nameOther")
          .where((m) => m.id.in(municipalityIds))
          .all()
      : [],
    headerImageIds.length > 0
      ? db.orm.public.HeaderImage.where((h) => h.id.in(headerImageIds)).all()
      : [],
  ]);

  function text(field: MergeableField, raw: string | number | null) {
    if (raw === null || raw === "") return null;
    switch (field) {
      case "type":
        return larpT.type.choices[raw as keyof typeof larpT.type.choices].title;
      case "language":
        return larpT.language.choices[
          raw as keyof typeof larpT.language.choices
        ];
      case "openness":
        return larpT.openness.choices[
          raw as keyof typeof larpT.openness.choices
        ].title;
      case "municipalityId":
        return (
          municipalityName(
            municipalities.find((m) => m.id === raw) ?? null,
            locale,
          ) ?? String(raw)
        );
      case "startsAt":
      case "endsAt":
      case "signupStartsAt":
      case "signupEndsAt":
        return formatDate(String(raw), locale);
      case "alias":
        return `/${raw}`;
      case "name":
      case "tagline":
        return typesetDashes(String(raw));
      default:
        return String(raw);
    }
  }

  function value(
    field: MergeableField,
    raw: string | number | null,
  ): MergeFormValue {
    if (field === "cancelledAt") {
      return { raw, text: raw === null ? t.no : t.yes };
    }
    if (field === "headerImageId" && raw !== null) {
      const row = headerImages.find((h) => h.id === raw);
      const view = headerImageViewOrNull(row);
      return {
        raw,
        text: row ? row.photographerCredit || String(raw) : String(raw),
        imageSrc: view?.banner.src ?? null,
      };
    }
    return { raw, text: text(field, raw) };
  }

  return preview.diff.map(({ field, status, defaultSide }) => ({
    field,
    status,
    defaultSide,
    a: value(field, a[field]),
    b: value(field, b[field]),
  }));
}

export default async function MergeLarpPage({ params, searchParams }: Props) {
  const resolvedParams = await params;
  const locale = toSupportedLanguage(resolvedParams.locale);
  const translations = getTranslations(locale);
  const gate = gateActions(translations);
  const t = translations.MergeLarpPage;
  const aId = resolvedParams.larpId;

  if (!validateUuid(aId)) notFound();

  const user = await getUserFromSession(await auth());
  if (!user) {
    return (
      <LoginRequiredPage
        messages={translations.LoginRequired}
        actions={[gate.larp(aId)]}
      />
    );
  }
  if (!canModerate(user)) {
    return (
      <AccessDeniedPage
        messages={translations.ModeratorRequired}
        actions={[gate.larp(aId), gate.contact]}
      />
    );
  }

  const a = await loadSummary(aId);
  if (!a) notFound();

  const withKey = (await searchParams).with;
  const bFilter = withKey ? larpIdOrAliasFilter(withKey) : null;
  const bRow = bFilter
    ? await db.orm.public.Larp.select("id").first(bFilter)
    : null;
  const [b, preview] =
    bRow && bRow.id !== a.id
      ? await Promise.all([
          loadSummary(bRow.id),
          getMergePreview(a.id, bRow.id),
        ])
      : [undefined, null];

  const header = {
    title: t.title,
    eyebrow: t.eyebrow,
    lede: t.lede,
    larp: a,
  };
  const sideCards = (bCard: React.ReactNode) => (
    <div className="lf-merge-sides">
      <SummaryCard
        tag={t.sides.a.tag}
        note={t.sides.a.note}
        larp={a}
        locale={locale}
        translations={translations}
      />
      {bCard}
    </div>
  );

  if (!b || !preview) {
    const [candidates, larpRows] = await Promise.all([
      findMergeCandidates(a),
      db.orm.public.Larp.select("id", "name", "type", "startsAt", "endsAt")
        .where((l) => l.id.neq(a.id))
        .orderBy((l) => l.name.asc())
        .all(),
    ]);
    const larps = larpRows.sort(
      (x, y) =>
        x.name.localeCompare(y.name, "fi") ||
        compareDescNullsLast(x.startsAt, y.startsAt),
    );
    const larpTypeChoices = Object.fromEntries(
      Object.entries(translations.Larp.attributes.type.choices).map(
        ([k, v]) => [k, v.title],
      ),
    );

    return (
      <LarpSubpage {...header} wide>
        {sideCards(
          <SummaryCard
            tag={t.sides.b.tag}
            note={t.sides.b.note}
            locale={locale}
            translations={translations}
          >
            {withKey && <p className="text-danger mb-0">{t.notFound}</p>}
            <div>
              <h2 className="lf-label">{t.pick.suggestions}</h2>
              {candidates.length > 0 ? (
                <ul className="lf-merge-candidates">
                  {candidates.map((candidate) => (
                    <li key={candidate.id}>
                      <Link
                        href={`/larp/${a.id}/merge?with=${candidate.id}`}
                        className="lf-chip"
                      >
                        {typesetDashes(candidate.name)}
                        {candidate.startsAt && (
                          <span className="lf-data">
                            {formatDateRange(
                              candidate.startsAt,
                              candidate.endsAt,
                              locale,
                            )}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="lf-empty mb-0">{t.pick.noSuggestions}</p>
              )}
            </div>
            <form action={`/larp/${a.id}/merge`} method="get">
              <SelectLarpCombobox
                name="with"
                title={t.pick.label}
                larps={larps}
                locale={locale}
                larpTypeChoices={larpTypeChoices}
              />
              <button type="submit" className="btn btn-primary">
                {t.pick.submit}
              </button>
            </form>
          </SummaryCard>,
        )}
      </LarpSubpage>
    );
  }

  const fields = await buildFormFields(preview, locale, translations);
  const formT = t.form;
  const { counts } = preview;
  const combined: MergeFormCombinedRow[] = [
    {
      label: formT.combined.people,
      value: fill(formT.combined.peopleValue, counts.relatedUsers),
      note: formT.combined.peopleNote,
    },
    {
      label: formT.combined.relatedLarps,
      value: fill(formT.combined.relatedLarpsValue, counts.relatedLarps),
    },
    {
      label: formT.combined.history,
      value: fill(formT.combined.historyValue, counts.requests),
    },
    {
      label: formT.combined.signups,
      value: fill(formT.combined.signupsValue, counts.signups),
    },
    {
      label: formT.combined.addresses,
      value: fill(formT.combined.addressesValue, {
        count: counts.aliasRedirects,
      }),
    },
  ];

  return (
    <LarpSubpage {...header} wide>
      {sideCards(
        <SummaryCard
          tag={t.sides.b.tag}
          note={t.sides.b.note}
          larp={b}
          locale={locale}
          translations={translations}
        >
          <div className="lf-merge-side__actions">
            <Link href={`/larp/${a.id}/merge`}>{t.change}</Link>
            <Link href={`/larp/${b.id}/merge?with=${a.id}`}>{t.swap}</Link>
          </div>
        </SummaryCard>,
      )}
      <MergeForm
        aId={a.id}
        bId={b.id}
        tokens={{
          aUpdateCount: preview.a.updateCount,
          bUpdateCount: preview.b.updateCount,
          aUpdatedAt: preview.a.updatedAt,
          bUpdatedAt: preview.b.updatedAt,
        }}
        fields={fields}
        links={preview.links.map((link) => ({
          id: link.id,
          typeLabel:
            translations.Larp.attributes.links.types[
              link.type as keyof typeof translations.Larp.attributes.links.types
            ].title,
          href: link.href,
          title: link.title,
          origin: link.origin,
        }))}
        combined={combined}
        locale={locale}
        messages={{
          sideTags: { a: "A", b: "B" },
          identical: formT.identical,
          differ: formT.differ,
          progress: formT.progress,
          status: formT.status,
          writeOwn: formT.writeOwn,
          empty: formT.empty,
          showMore: formT.showMore,
          fields: formT.fields,
          fieldNotes: formT.fieldNotes,
          links: formT.links,
          combinedTitle: formT.combined.title,
          result: formT.result,
          errors: formT.errors,
        }}
      />
    </LarpSubpage>
  );
}
