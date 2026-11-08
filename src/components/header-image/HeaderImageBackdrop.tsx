import type { HeaderImageView } from "@/models/HeaderImage";
import type { Translations } from "@/translations/en";

import styles from "./HeaderImage.module.scss";
import HeaderImageCredit from "./HeaderImageCredit";
import HeaderImageLightbox from "./HeaderImageLightbox";

export const heroWithImageClassName = styles.heroWithImage;
/** Marks a block of hero text that gets an opaque background over a header image. */
export const heroTextClassName = styles.text;

interface Props {
  view: HeaderImageView;
  messages: Translations["HeaderImage"];
}

/** The picture, lightbox button and credit; the first child of a hero `section`. */
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
      <HeaderImageLightbox
        src={view.full}
        credit={view.credit}
        messages={{ credit: messages.credit, actions: messages.actions }}
      />
      <HeaderImageCredit credit={view.credit} template={messages.credit} />
    </>
  );
}
