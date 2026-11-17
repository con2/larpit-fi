import Link from "next/link";
import { Button, FormControl, InputGroup } from "react-bootstrap";

import { auth } from "@/auth";
import FilterBar, {
  FilterGroup,
  type FilterOption,
} from "@/components/ui/FilterBar";
import {
  AccessDeniedPage,
  LoginRequiredPage,
  gateActions,
} from "@/components/GatePage";
import { formatDateRange } from "@/helpers/dates";
import { typesetDashes } from "@/helpers/larpName";
import { getLarpHref } from "@/models/Larp";
import { getLarpsForTagging, getTagsWithCounts } from "@/models/Tag";
import { compareTagNames } from "@/models/Tag.client";
import { canModerate, getUserFromSession } from "@/models/User";
import { Language } from "@/prisma/enums";
import { query } from "@/prisma/sql";
import { getTranslations } from "@/translations";

import LarpTagsForm, { type LarpTagsRow } from "./LarpTagsForm";

const pageSize = 20;

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ offset?: string; show?: string; q?: string }>;
}

function pageHref(params: { show: string; q: string; offset?: number }) {
  const search = new URLSearchParams();
  if (params.show === "all") search.set("show", "all");
  if (params.q) search.set("q", params.q);
  if (params.offset) search.set("offset", String(params.offset));
  const queryString = search.toString();
  return queryString ? `/moderate/tags?${queryString}` : "/moderate/tags";
}

export default async function LarpTagsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const translations = getTranslations(locale);
  const gate = gateActions(translations);
  const t = translations.LarpTagsPage;

  const user = await getUserFromSession(await auth());
  if (!user) {
    return (
      <LoginRequiredPage
        messages={translations.LoginRequired}
        actions={[gate.frontPage]}
      />
    );
  }
  if (!canModerate(user)) {
    return (
      <AccessDeniedPage
        messages={translations.ModeratorRequired}
        actions={[gate.frontPage, gate.contact]}
      />
    );
  }

  const search = await searchParams;
  const show = search.show === "all" ? "all" : "untagged";
  const q = search.q?.trim() ?? "";
  const requestedOffset = Number.parseInt(search.offset ?? "");
  const offset = requestedOffset > 0 ? requestedOffset : 0;

  const [{ larps, count }, tags] = await Promise.all([
    getLarpsForTagging(
      { untaggedOnly: show === "untagged", name: q },
      offset,
      pageSize,
    ),
    getTagsWithCounts({ query }),
  ]);
  tags.sort(compareTagNames(locale));

  const rows: LarpTagsRow[] = larps.map((larp) => ({
    id: larp.id,
    name: typesetDashes(larp.name),
    href: getLarpHref(larp),
    dates: formatDateRange(larp.startsAt, larp.endsAt, locale),
    lang: larp.language === Language.OTHER ? undefined : larp.language,
    tagIds: larp.tagIds,
  }));

  const showOptions: FilterOption[] = (["untagged", "all"] as const).map(
    (value) => ({
      title: t.show[value],
      href: pageHref({ show: value, q }),
      current: show === value,
    }),
  );

  return (
    <div className="lf-container">
      <header className="lf-page-header mb-4">
        <h1 className="lf-display-l">{t.title}</h1>
        <p className="lf-muted mb-0">{t.lede(count, show === "untagged")}</p>
      </header>
      <div className="d-flex flex-wrap gap-3 align-items-center mb-4">
        <FilterBar>
          <FilterGroup label={t.show.label} options={showOptions} />
        </FilterBar>
        <form action="/moderate/tags" method="get" role="search">
          {show === "all" && <input type="hidden" name="show" value="all" />}
          <InputGroup size="sm">
            <FormControl
              type="search"
              name="q"
              defaultValue={q}
              placeholder={t.search.placeholder}
              aria-label={t.search.label}
            />
            <Button type="submit" variant="outline-secondary">
              {t.search.submit}
            </Button>
          </InputGroup>
        </form>
      </div>
      {tags.length === 0 ? (
        <p>
          {t.noTags} <Link href="/tag?new=1">{t.createTag}</Link>
        </p>
      ) : (
        rows.length > 0 && (
          <LarpTagsForm
            rows={rows}
            tags={tags}
            locale={locale}
            messages={{
              columns: t.columns,
              save: t.save,
              saved: t.saved,
              field: translations.Tag.field,
            }}
          />
        )
      )}
      <nav className="d-flex gap-3 py-4" aria-label={t.pagination.title}>
        {offset > 0 && (
          <Link
            href={pageHref({ show, q, offset: Math.max(0, offset - pageSize) })}
          >
            ← {t.pagination.previous}
          </Link>
        )}
        {offset + pageSize < count && (
          <Link href={pageHref({ show, q, offset: offset + pageSize })}>
            {t.pagination.next} →
          </Link>
        )}
      </nav>
    </div>
  );
}
