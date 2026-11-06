import type { Metadata } from "next";

import {
  type HeaderImageRow,
  headerImageSocialPreviewOrNull,
} from "@/models/HeaderImage";
import { getTranslations } from "@/translations";
import { typesetDashes } from "@/helpers/larpName";

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
  const name = typesetDashes(larp.name);
  const title = `${name} – ${translations.title}`;
  const description = larp.tagline ?? undefined;
  const image = headerImageSocialPreviewOrNull(larp.headerImage);
  const images = image ? [{ ...image, alt: name }] : undefined;

  return {
    title,
    description,
    alternates,
    openGraph: {
      type: "website",
      siteName: translations.title,
      title: name,
      description,
      images,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: name,
      description,
      images,
    },
  };
}
