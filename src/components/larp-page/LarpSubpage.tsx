import Link from "next/link";
import { ReactNode } from "react";
import styles from "./LarpSubpage.module.scss";
import { typesetDashes } from "@/helpers/larpName";

interface Props {
  title: ReactNode;
  larp?: { id: string; name: string };
  eyebrow?: ReactNode;
  lede?: ReactNode;
  /** Lets the body span the whole container, for pages with a sidebar. */
  wide?: boolean;
  children: ReactNode;
}

/** Page header and body spacing shared by the pages under /larp/[larpId]/. */
export default function LarpSubpage({
  title,
  larp,
  eyebrow,
  lede,
  wide = false,
  children,
}: Props) {
  return (
    <div className={`lf-container ${styles.page}`}>
      <header className="lf-page-header">
        {larp && (
          <Link href={`/larp/${larp.id}`} className="lf-link-quiet">
            ← {typesetDashes(larp.name)}
          </Link>
        )}
        {eyebrow && <p className="lf-eyebrow">{eyebrow}</p>}
        <h1 className="lf-display-l">{title}</h1>
        {lede && <div className="lf-lede">{lede}</div>}
      </header>
      <div className={wide ? styles.wideBody : styles.body}>{children}</div>
    </div>
  );
}
