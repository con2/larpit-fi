import { notFound } from "next/navigation";

/** Routes every unmatched path to `[locale]/not-found.tsx`, inside the site layout. */
export default function UnmatchedPage() {
  notFound();
}
