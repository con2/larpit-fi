import Link from "next/link";
import { PropsWithChildren } from "react";

interface Props {
  href: string;
  className?: string;
}

export default function MaybeExternalLink({
  href,
  className,
  children,
}: PropsWithChildren<Props>) {
  if (href.startsWith("/")) {
    return (
      <Link className={className} href={href}>
        {children}
      </Link>
    );
  } else {
    return (
      <a
        className={className}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  }
}
