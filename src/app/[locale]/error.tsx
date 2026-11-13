"use client";

import { unstable_isUnrecognizedActionError } from "next/navigation";

import { useNewVersionNotice } from "@/components/NewVersionNotice";

/**
 * After a deploy, a page loaded from the previous version calls server actions that the new
 * version no longer has. Saving a form then fails, and reloading the page is the way out.
 */
export default function Error({ error }: { error: unknown }) {
  const notice = useNewVersionNotice();
  if (unstable_isUnrecognizedActionError(error) && notice) return notice;
  // Anything else goes on to Next.js' own error page.
  throw error;
}
