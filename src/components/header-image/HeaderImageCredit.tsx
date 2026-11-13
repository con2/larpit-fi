import styles from "./HeaderImage.module.scss";

interface Props {
  credit: string;
  /** "Photo: {credit}" */
  template: string;
  className?: string;
}

function formatCredit(template: string, credit: string): string {
  return template.replace("{credit}", credit);
}

export default function HeaderImageCredit({
  credit,
  template,
  className = styles.credit,
}: Props) {
  return <small className={className}>{formatCredit(template, credit)}</small>;
}
