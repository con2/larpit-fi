import { resolvedStatuses } from "@/models/ModerationQueue";
import { getTranslations } from "@/translations";

import ModerationRequestList from "../ModerationRequestList";
import { requireModerator } from "../requireModerator";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string; action?: string; offset?: string }>;
}

export default async function ResolvedRequestsPage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  const translations = getTranslations(locale);
  const moderator = await requireModerator(translations);
  if (!moderator.ok) return moderator.gate;

  return (
    <ModerationRequestList
      tab="resolved"
      title={translations.ModerationRequest.resolvedTitle}
      statuses={resolvedStatuses}
      searchParams={await searchParams}
      viewer={moderator.user}
      locale={locale}
      messages={translations.ModerationRequest}
    />
  );
}
