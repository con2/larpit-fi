import type { HeaderImageView } from "@/models/HeaderImage";
import type { Translations } from "@/translations/en";

import styles from "./HeaderImage.module.scss";
import HeaderImageCredit from "./HeaderImageCredit";
import HeaderImageLightbox from "./HeaderImageLightbox";

export const heroWithImageClassName = styles.heroWithImage;
/** Marks the block of hero text that the uploader's text treatment applies to. */
export const heroTextClassName = styles.text;

/** Attributes for the hero `section` that a header image is rendered in. */
export function heroImageProps(view: HeaderImageView | null) {
  return view ? { "data-treatment": view.treatment } : {};
}

interface Props {
  view: HeaderImageView;
  messages: Translations["HeaderImage"];
}

/** The picture, scrim, lightbox button and credit; the first child of a hero `section`. */
export default function HeaderImageBackdrop({ view, messages }: Props) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={styles.backdrop}
        src={view.banner.src}
        srcSet={view.banner.srcSet}
        sizes="100vw"
        fetchPriority="high"
        alt=""
      />
      <div className={styles.scrim} />
      <HeaderImageLightbox
        src={view.full}
        credit={view.credit}
        messages={{ credit: messages.credit, actions: messages.actions }}
      />
      <HeaderImageCredit credit={view.credit} template={messages.credit} />
    </>
  );
}
