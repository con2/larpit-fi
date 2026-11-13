import { MessageCard } from "@/components/MessageCard";
import Link from "next/link";

import { auth } from "@/auth";
import { LoginRequiredCard } from "@/components/LoginRequiredCard";
import { suggestLarpAlias } from "@/helpers/larpAlias";
import { typesetDashes } from "@/helpers/larpName";
import { formatDateRange } from "@/helpers/dates";
import {
  getLarpHref,
  getLarpsWithoutAlias,
  larpAliasMaxLength,
} from "@/models/Larp";
import { canModerate, getUserFromSession } from "@/models/User";
import { Language } from "@/prisma/enums";
import { getTranslations } from "@/translations";

import LarpAliasesForm, { type LarpAliasesRow } from "./LarpAliasesForm";

const pageSize = 20;

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ offset?: string }>;
}

export default async function LarpAliasesPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const translations = getTranslations(locale);
  const t = translations.LarpAliasesPage;

  const user = await getUserFromSession(await auth());
  if (!user) {
    return (
      <LoginRequiredCard messages={translations.LoginRequired} container />
    );
  }
  if (!canModerate(user)) {
    return (
      <MessageCard
        title={translations.ModeratorRequired.title}
        message={translations.ModeratorRequired.message}
        container
      />
    );
  }

  const requestedOffset = Number.parseInt((await searchParams).offset ?? "");
  const offset = requestedOffset > 0 ? requestedOffset : 0;
  const { larps, count } = await getLarpsWithoutAlias(offset, pageSize);

  const rows: LarpAliasesRow[] = larps.map((larp) => ({
    id: larp.id,
    name: typesetDashes(larp.name),
    href: getLarpHref({ id: larp.id, alias: null }),
    dates: formatDateRange(larp.startsAt, larp.endsAt, locale),
    lang: larp.language === Language.OTHER ? undefined : larp.language,
    suggestion:
      suggestLarpAlias(larp.name, larp.language, larpAliasMaxLength) ?? "",
  }));
  const aliasErrors = translations.LarpAliasPage.errors;

  return (
    <div className="lf-container">
      <header className="lf-page-header mb-4">
        <h1 className="lf-display-l">{t.title}</h1>
        <p className="lf-muted mb-0">{t.lede(count)}</p>
      </header>
      {rows.length > 0 && (
        <LarpAliasesForm
          rows={rows}
          maxLength={larpAliasMaxLength}
          messages={{
            columns: t.columns,
            save: t.save,
            saved: t.saved,
            errors: {
              ...aliasErrors,
              tooLong: aliasErrors.tooLong(larpAliasMaxLength),
            },
          }}
        />
      )}
      <nav className="d-flex gap-3 py-4" aria-label={t.pagination.title}>
        {offset > 0 && (
          <Link
            href={`/moderate/aliases?offset=${Math.max(0, offset - pageSize)}`}
          >
            ← {t.pagination.previous}
          </Link>
        )}
        {offset + pageSize < count && (
          <Link href={`/moderate/aliases?offset=${offset + pageSize}`}>
            {t.pagination.next} →
          </Link>
        )}
      </nav>
    </div>
  );
}
