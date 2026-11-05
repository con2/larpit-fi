import Link from "next/link";
import { ReactNode } from "react";
import styles from "./LarpSubpage.module.scss";

interface Props {
  title: ReactNode;
  larp?: { id: string; name: string };
  lede?: ReactNode;
  children: ReactNode;
}

/** Page header and body spacing shared by the pages under /larp/[larpId]/. */
export default function LarpSubpage({ title, larp, lede, children }: Props) {
  return (
    <div className={`lf-container ${styles.page}`}>
      <header className="lf-page-header">
        {larp && (
          <Link href={`/larp/${larp.id}`} className="lf-link-quiet">
            ← {larp.name}
          </Link>
        )}
        <h1 className="lf-display-l">{title}</h1>
        {lede && <div className="lf-lede">{lede}</div>}
      </header>
      <div className={styles.body}>{children}</div>
    </div>
  );
}
