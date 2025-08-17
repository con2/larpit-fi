import { ReactNode } from "react";
import "./UnrenderedMarkdown.css";

interface Props {
  children: ReactNode;
}

export default function UnrenderedMarkdown({ children }: Props) {
  return <code className="UnrenderedMarkdown">{children}</code>;
}
