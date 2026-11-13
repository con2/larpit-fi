import Link from "next/link";
import { getLocale } from "next-intl/server";

import HeroMessage, { heroActionClasses } from "@/components/ui/HeroMessage";
import { getTranslations } from "@/translations";

import SearchLarpsButton from "./_home/SearchLarpsButton";

export default async function NotFound() {
  const translations = getTranslations(await getLocale());
  const t = translations.NotFoundPage;

  return (
    <HeroMessage eyebrow={t.eyebrow} title={t.title} lede={t.lede}>
      <Link href="/" className={heroActionClasses.primary}>
        {t.frontPage}
      </Link>
      <SearchLarpsButton
        label={translations.Navigation.actions.search}
        className={heroActionClasses.secondary}
      />
      <Link href="/calendar" className={heroActionClasses.quiet}>
        {translations.CalendarPage.title} →
      </Link>
    </HeroMessage>
  );
}
