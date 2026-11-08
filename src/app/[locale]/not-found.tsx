import Link from "next/link";
import { getLocale } from "next-intl/server";

import Aurora, { nightSkyProps } from "@/components/ui/Aurora";
import { getTranslations } from "@/translations";

import SearchLarpsButton from "./_home/SearchLarpsButton";
import styles from "./not-found.module.scss";

export default async function NotFound() {
  const translations = getTranslations(await getLocale());
  const t = translations.NotFoundPage;

  return (
    <section {...nightSkyProps(styles.hero)}>
      <Aurora variant="larp" />
      <div className={`lf-container ${styles.heroInner}`}>
        <p className="lf-eyebrow">{t.eyebrow}</p>
        <h1 className="lf-display-xl">{t.title}</h1>
        <p className="lf-lede">{t.lede}</p>
        <div className={styles.actions}>
          <Link href="/" className="btn btn-primary">
            {t.frontPage}
          </Link>
          <SearchLarpsButton
            label={translations.Navigation.actions.search}
            className={`btn btn-outline-secondary ${styles.secondary}`}
          />
          <Link
            href="/calendar"
            className={`lf-link-quiet ${styles.quietAction}`}
          >
            {translations.CalendarPage.title} →
          </Link>
        </div>
      </div>
    </section>
  );
}
