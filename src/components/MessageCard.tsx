import { ReactNode, useId } from "react";

interface Props {
  title: string;
  message: ReactNode;
  /** Actions shown below the message, such as a sign-in button. */
  children?: ReactNode;
}

/** A notice in place of one section of a page. Whole pages use the pages in `GatePage.tsx`. */
export function MessageCard({ title, message, children }: Props) {
  const titleId = useId();
  return (
    <section className="lf-surface mb-4" aria-labelledby={titleId}>
      <h2 className="lf-surface__title" id={titleId}>
        {title}
      </h2>
      <div className="lf-muted">{message}</div>
      {children && <div>{children}</div>}
    </section>
  );
}
