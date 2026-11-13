import { ReactNode, useId } from "react";

interface Props {
  title: string;
  message: ReactNode;
  /** Wraps the card in the page container, for a gate that is the whole page. */
  container?: boolean;
  /** Actions shown below the message, such as a sign-in button. */
  children?: ReactNode;
}

/** A notice that stands in for a page's content, such as "sign in" or "moderators only". */
export function MessageCard({
  title,
  message,
  container = false,
  children,
}: Props) {
  const titleId = useId();
  const card = (
    <section className="lf-surface mb-4" aria-labelledby={titleId}>
      <h2 className="lf-surface__title" id={titleId}>
        {title}
      </h2>
      <div className="lf-muted">{message}</div>
      {children && <div>{children}</div>}
    </section>
  );

  return container ? <div className="lf-container py-5">{card}</div> : card;
}
