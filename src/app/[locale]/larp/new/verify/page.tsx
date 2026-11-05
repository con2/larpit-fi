import { getTranslations } from "@/translations";
import styles from "@/components/LarpForm.module.scss";

interface Props {
  params: Promise<{
    locale: string;
  }>;
}

export default async function NewLarpVerificationPage({ params }: Props) {
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
          <section className="lf-surface" aria-labelledby="verify-title">
            <h2 className="lf-surface__title" id="verify-title">
              {t.subpages.verificationRequired.title}
            </h2>
            <div className={styles.intro}>
              {t.subpages.verificationRequired.message}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
