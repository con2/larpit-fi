import Link from "next/link";
import { ReactNode } from "react";

interface Props {
  href: string;
  date: ReactNode;
  name: ReactNode;
  sub?: ReactNode;
  cancelled?: boolean;
  lang?: string;
}

/** Mono date, name and an optional one-line sub. Recent changes, This week, Other events. */
export default function CompactRow({
  href,
  date,
  name,
  sub,
  cancelled,
  lang,
}: Props) {
  return (
    <Link
      href={href}
      className={`lf-compact-row${cancelled ? " lf-compact-row--cancelled" : ""}`}
      lang={lang}
    >
      <span className="lf-compact-row__date">{date}</span>
      <span className="lf-compact-row__main">
        <span className="lf-compact-row__name">{name}</span>
        {sub && <span className="lf-compact-row__sub">{sub}</span>}
      </span>
    </Link>
  );
}
