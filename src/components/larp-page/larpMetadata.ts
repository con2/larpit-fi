import type { Metadata } from "next";

import {
  type HeaderImageRow,
  headerImageSocialPreviewOrNull,
} from "@/models/HeaderImage";
import { getTranslations } from "@/translations";

export function larpMetadata(
  larp: {
    name: string;
    tagline: string | null;
    headerImage: HeaderImageRow | null;
  },
  locale: string,
  alternates?: Metadata["alternates"],
): Metadata {
  const translations = getTranslations(locale);
  const title = `${larp.name} – ${translations.title}`;
  const description = larp.tagline ?? undefined;
  const image = headerImageSocialPreviewOrNull(larp.headerImage);
  const images = image ? [{ ...image, alt: larp.name }] : undefined;

  return {
    title,
    description,
    alternates,
    openGraph: {
      type: "website",
      siteName: translations.title,
      title: larp.name,
      description,
      images,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: larp.name,
      description,
      images,
    },
  };
}
