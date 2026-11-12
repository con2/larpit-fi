import Link from "next/link";

import { privacyPolicyUrl } from "@/config";
import { getTranslations } from "@/translations";

export default function Footer({ locale }: { locale: string }) {
  const t = getTranslations(locale).Footer;
  return (
    <footer className="lf-footer">
      <div className="lf-container">
        <Link href="/" className="lf-logo lf-logo--footer">
          larp<span>.fi</span>
        </Link>
        <a href={privacyPolicyUrl}>{t.privacyPolicy}</a>
        <a href="https://github.com/con2/larpit-fi">{t.source}</a>
        <Link href="/api-docs" prefetch={false}>
          {t.api}
        </Link>
        <span className="lf-footer__note">{t.note}</span>
      </div>
    </footer>
  );
}
