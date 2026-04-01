import { Larp, Municipality } from "@/generated/prisma/client";
import { getLarpUrl } from "@/models/Larp";

type LarpJsonLdInput = Pick<
  Larp,
  | "id"
  | "alias"
  | "name"
  | "tagline"
  | "startsAt"
  | "endsAt"
  | "locationText"
  | "language"
  | "isCancelled"
> & {
  municipality: Pick<
    Municipality,
    "nameFi" | "nameOther" | "nameOtherLanguageCode"
  > | null;
};

function larpToJsonLd(larp: LarpJsonLdInput) {
  // TODO: eventAttendanceMode (add isOnline to Larp model)
  // TODO: hard-coded country in address (there is Country model but we don't yet support municipalities outside Finland)
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    eventStatus: larp.isCancelled
      ? "https://schema.org/EventCancelled"
      : "https://schema.org/EventScheduled",
    url: getLarpUrl(larp),
    name: larp.name,
    ...(larp.tagline && { description: larp.tagline }),
    ...(larp.startsAt && { startDate: larp.startsAt.toISOString() }),
    ...(larp.endsAt && { endDate: larp.endsAt.toISOString() }),
    ...((larp.locationText || larp.municipality?.nameFi) && {
      location: {
        "@type": "Place",
        name: larp.locationText || larp.municipality!.nameFi,
        ...(larp.municipality?.nameFi && {
          address: {
            "@type": "PostalAddress",
            addressLocality: larp.municipality.nameFi,
            addressCountry: "FI",
          },
        }),
      },
    }),
  };
}

/// This component can be used to add JSON-LD structured data for a larp,
/// which can help search engines understand the content of the page and improve SEO.
/// https://developers.google.com/search/docs/appearance/structured-data/event
/// https://schema.org/Event
export default function LarpJsonLd({ larp }: { larp: LarpJsonLdInput }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(larpToJsonLd(larp)) }}
    />
  );
}
