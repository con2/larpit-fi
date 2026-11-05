import Link from "next/link";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  count?: number;
  link?: { href: string; title: ReactNode };
  as?: "h1" | "h2" | "h3";
  id?: string;
}

export default function SectionHeading({
  children,
  count,
  link,
  as: Heading = "h2",
  id,
}: Props) {
  return (
    <div className="lf-section-heading">
      <Heading className="lf-heading" id={id}>
        {children}
        {count !== undefined && (
          <>
            {" "}
            <span className="lf-count">{count}</span>
          </>
        )}
      </Heading>
      {link && (
        <Link href={link.href} className="lf-link-quiet small">
          {link.title} →
        </Link>
      )}
    </div>
  );
}

export function YearHeading({
  year,
  count,
  id,
}: {
  year: ReactNode;
  count?: ReactNode;
  id?: string;
}) {
  return (
    <div className="lf-year-heading">
      <h2 className="lf-year" id={id}>
        {year}
      </h2>
      {count !== undefined && <span className="lf-data">{count}</span>}
    </div>
  );
}
