import { ReactNode } from "react";

export default function MainHeading({ children }: { children: ReactNode }) {
  return <h2 className="text-center mt-5 mb-4">{children}</h2>;
}
