"use client";

import {
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import {
  coverScale,
  type Crop,
  cropFromView,
  cropWidthPixels,
  maxZoom,
  minZoom,
  panView,
  recommendedCropWidth,
  type Size,
  viewFromCrop,
  zoomView,
} from "@/models/HeaderImage.client";

import styles from "./HeaderImage.module.scss";

const nudgePixels = 10;

interface Props {
  src: string;
  crop: Crop | null;
  onCropChange(crop: Crop): void;
  /**
   * Reports the picture's natural size once it has loaded. Browsers apply EXIF orientation to
   * `<img>` by default, so this is the rotated size, the same that sharp's `autoOrient()` gives.
   */
  onImageLoad(size: Size): void;
  /** Size of the original the crop is applied to, for the resolution warning. */
  originalSize: Size | null;
  /** Shown over the picture to preview the text treatment. */
  overlay?: ReactNode;
  treatment: string;
  messages: { label: string; zoom: string; dragHint: string; tooSmall: string };
}

export default function CropFrame({
  src,
  crop,
  onCropChange,
  onImageLoad,
  originalSize,
  overlay,
  treatment,
  messages,
}: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const [frame, setFrame] = useState<Size | null>(null);
  const [image, setImage] = useState<Size | null>(null);

  useLayoutEffect(() => {
    const element = frameRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setFrame({ width, height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  function handleLoad(element: HTMLImageElement) {
    const size = { width: element.naturalWidth, height: element.naturalHeight };
    setImage(size);
    onImageLoad(size);
  }

  // A server-rendered picture can finish loading before hydration, when no onLoad fires.
  useLayoutEffect(() => {
    const element = imageRef.current;
    if (element?.complete && element.naturalWidth) handleLoad(element);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  const view = frame && image && crop ? viewFromCrop(crop, frame, image) : null;

  function update(next: typeof view) {
    if (next && frame && image) onCropChange(cropFromView(next, frame, image));
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY };
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const last = dragRef.current;
    if (!last || !view || !frame || !image) return;
    dragRef.current = { x: event.clientX, y: event.clientY };
    update(
      panView(
        view,
        event.clientX - last.x,
        event.clientY - last.y,
        frame,
        image,
      ),
    );
  }

  function onPointerUp() {
    dragRef.current = null;
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!view || !frame || !image) return;
    const delta: Record<string, [number, number]> = {
      ArrowLeft: [nudgePixels, 0],
      ArrowRight: [-nudgePixels, 0],
      ArrowUp: [0, nudgePixels],
      ArrowDown: [0, -nudgePixels],
    };
    const move = delta[event.key];
    if (!move) return;
    event.preventDefault();
    update(panView(view, move[0], move[1], frame, image));
  }

  const scale =
    view && frame && image ? coverScale(frame, image) * view.zoom : 0;
  const widthPixels =
    crop && originalSize ? cropWidthPixels(crop, originalSize) : null;

  return (
    <div>
      <div
        ref={frameRef}
        className={styles.cropFrame}
        data-treatment={treatment}
        role="group"
        aria-label={messages.label}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imageRef}
          src={src}
          alt=""
          className={styles.cropImage}
          draggable={false}
          onLoad={(event) => handleLoad(event.currentTarget)}
          style={
            view && image
              ? {
                  left: view.offsetX,
                  top: view.offsetY,
                  width: image.width * scale,
                  height: image.height * scale,
                }
              : { visibility: "hidden" }
          }
        />
        {overlay && <div className={styles.cropPreview}>{overlay}</div>}
      </div>
      <div className={styles.cropControls}>
        <label htmlFor="HeaderImageEditor-zoom" className="form-label m-0">
          {messages.zoom}
        </label>
        <input
          id="HeaderImageEditor-zoom"
          type="range"
          className="form-range"
          min={minZoom}
          max={maxZoom}
          step={0.01}
          value={view?.zoom ?? minZoom}
          disabled={!view}
          onChange={(event) =>
            view &&
            frame &&
            image &&
            update(zoomView(view, Number(event.target.value), frame, image))
          }
        />
        {widthPixels !== null && (
          <span
            className={`small font-monospace ${widthPixels < recommendedCropWidth ? "text-warning-emphasis" : "lf-muted"}`}
          >
            {widthPixels < recommendedCropWidth
              ? messages.tooSmall.replace("{width}", String(widthPixels))
              : `${widthPixels} px`}
          </span>
        )}
      </div>
      <p className="form-text">{messages.dragHint}</p>
    </div>
  );
}
