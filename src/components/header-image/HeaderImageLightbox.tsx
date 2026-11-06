"use client";

import { useState } from "react";
import Modal from "react-bootstrap/Modal";

import { ZoomIcon } from "../ui/icons";
import styles from "./HeaderImage.module.scss";
import HeaderImageCredit from "./HeaderImageCredit";

interface Props {
  src: string;
  credit: string;
  messages: {
    credit: string;
    actions: { openLightbox: string; closeLightbox: string };
  };
}

export default function HeaderImageLightbox({ src, credit, messages }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className={styles.zoomButton}
        aria-label={messages.actions.openLightbox}
        title={messages.actions.openLightbox}
        onClick={() => setOpen(true)}
      >
        <ZoomIcon size={18} />
      </button>
      <Modal
        show={open}
        onHide={() => setOpen(false)}
        fullscreen
        centered
        aria-label={messages.actions.openLightbox}
      >
        <Modal.Header closeButton closeLabel={messages.actions.closeLightbox} />
        <Modal.Body className={styles.lightboxBody}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" className={styles.lightboxImage} />
          <HeaderImageCredit
            credit={credit}
            template={messages.credit}
            className={styles.lightboxCaption}
          />
        </Modal.Body>
      </Modal>
    </>
  );
}
