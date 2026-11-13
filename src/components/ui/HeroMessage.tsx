import { ReactNode } from "react";

import Aurora, { nightSkyProps } from "./Aurora";
import styles from "./HeroMessage.module.scss";

/** Classes for the links and buttons in a hero message's action row, in falling emphasis. */
export const heroActionClasses = {
  primary: "btn btn-primary",
  secondary: `btn btn-outline-secondary ${styles.secondary}`,
  quiet: `lf-link-quiet ${styles.quietAction}`,
};

interface Props {
  eyebrow: string;
  title: string;
  lede: ReactNode;
  /** The action row; style each action with `heroActionClasses`. */
  children: ReactNode;
}

/** A whole page that only says one thing under the night sky, such as "not found". */
export default function HeroMessage({ eyebrow, title, lede, children }: Props) {
  return (
    <section {...nightSkyProps(styles.hero)}>
      <Aurora variant="larp" />
      <div className={`lf-container ${styles.heroInner}`}>
        <p className="lf-eyebrow">{eyebrow}</p>
        <h1 className="lf-display-xl">{title}</h1>
        <p className="lf-lede">{lede}</p>
        <div className={styles.actions}>{children}</div>
      </div>
    </section>
  );
}
