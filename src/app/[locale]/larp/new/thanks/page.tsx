import { getTranslations } from "@/translations";
import styles from "@/components/LarpForm.module.scss";
import Link from "next/link";

interface Props {
  params: Promise<{
    locale: string;
  }>;
}

export default async function NewLarpThanksPage({ params }: Props) {
  const { locale } = await params;

  const translations = getTranslations(locale);
  const t = translations.NewLarpPage;

  return (
    <>
      <header className="lf-container lf-page-header">
        <p className="lf-eyebrow">{t.eyebrow}</p>
        <h1 className="lf-display-l">{t.title}</h1>
      </header>
      <div className="lf-container">
        <div className={styles.narrow}>
          <section className="lf-surface" aria-labelledby="thanks-title">
            <h2 className="lf-surface__title" id="thanks-title">
              {t.subpages.thanks.title}
            </h2>
            <div className={styles.intro}>{t.subpages.thanks.message}</div>
            <div>
              <Link className="btn btn-primary" href="/">
                {t.subpages.thanks.backToFrontPage}
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
