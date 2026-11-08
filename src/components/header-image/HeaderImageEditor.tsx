"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import FormControl from "react-bootstrap/FormControl";
import FormLabel from "react-bootstrap/FormLabel";
import FormText from "react-bootstrap/FormText";
import ProgressBar from "react-bootstrap/ProgressBar";

import {
  bannerAspect,
  type Crop,
  centeredView,
  cropFromView,
  photographerCreditMaxLength,
  type Size,
} from "@/models/HeaderImage.client";
import type { HeaderImageTarget } from "@/models/HeaderImage";
import type { Translations } from "@/translations/en";

import CropFrame from "./CropFrame";
import styles from "./HeaderImage.module.scss";

const acceptedTypes = "image/jpeg,image/png,image/webp,image/avif";

type Messages = Translations["HeaderImage"];
type ErrorCode = keyof Messages["errors"];

type Status =
  | { kind: "idle" }
  | { kind: "uploading"; percent: number }
  | { kind: "processing" }
  | { kind: "error"; code: ErrorCode };

export interface ExistingHeaderImage {
  full: string;
  width: number;
  height: number;
  crop: Crop;
  credit: string;
}

interface Props {
  target: HeaderImageTarget;
  existing: ExistingHeaderImage | null;
  returnHref: string;
  /** Saves credit, treatment and crop of the existing image. */
  saveAction(formData: FormData): Promise<void>;
  removeAction(): Promise<void>;
  /** The page title, previewed over the crop with the chosen text treatment. */
  previewTitle: string;
  messages: Messages;
}

function errorCodeOf(status: number, body: unknown): ErrorCode {
  const code = (body as { error?: string } | null)?.error;
  switch (code) {
    case "tooLarge":
    case "tooManyPixels":
    case "tooSmall":
    case "unsupported":
    case "forbidden":
    case "disabled":
      return code;
  }
  return status === 403 ? "forbidden" : "unknown";
}

async function postJson(
  url: string,
  body: unknown,
): Promise<{ ok: true; data: unknown } | { ok: false; code: ErrorCode }> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => null);
  if (!response) return { ok: false, code: "network" };
  const data = await response.json().catch(() => null);
  if (!response.ok)
    return { ok: false, code: errorCodeOf(response.status, data) };
  return { ok: true, data };
}

function putDirect(
  target: { url: string; headers: Record<string, string> },
  file: File,
  onProgress: (fraction: number) => void,
): Promise<boolean> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", target.url);
    for (const [name, value] of Object.entries(target.headers))
      xhr.setRequestHeader(name, value);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    xhr.onerror = () => resolve(false);
    xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300);
    xhr.send(file);
  });
}

const unitFrame = { width: bannerAspect, height: 1 };

export default function HeaderImageEditor({
  target,
  existing,
  returnHref,
  saveAction,
  removeAction,
  previewTitle,
  messages: t,
}: Props) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState<Size | null>(null);
  const [crop, setCrop] = useState<Crop | null>(existing?.crop ?? null);
  const [credit, setCredit] = useState(existing?.credit ?? "");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [pending, startTransition] = useTransition();

  useEffect(
    () => () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    },
    [objectUrl],
  );

  const src = objectUrl ?? existing?.full ?? null;
  // A picked file is cropped in its own pixels; the existing image's preview may be downscaled,
  // so the original's size from the server is what the resolution warning needs.
  const originalSize = file
    ? naturalSize
    : existing
      ? { width: existing.width, height: existing.height }
      : null;
  const busy =
    pending || status.kind === "uploading" || status.kind === "processing";

  function pick(picked: File | null) {
    // `accept` only filters the file dialog; a dropped file of another type gets here too.
    if (picked && !acceptedTypes.split(",").includes(picked.type)) {
      setStatus({ kind: "error", code: "unsupported" });
      return;
    }
    setFile(picked);
    setNaturalSize(null);
    setCrop(picked ? null : (existing?.crop ?? null));
    setObjectUrl(picked ? URL.createObjectURL(picked) : null);
    setStatus({ kind: "idle" });
  }

  function onImageLoad(size: Size) {
    setNaturalSize(size);
    setCrop(
      (current) =>
        current ?? cropFromView(centeredView(unitFrame, size), unitFrame, size),
    );
  }

  async function upload(picked: File, chosenCrop: Crop) {
    const presign = await postJson("/api/header-image/presign", {
      target,
      filename: picked.name,
      contentType: picked.type,
      size: picked.size,
    });
    if (!presign.ok) return setStatus({ kind: "error", code: presign.code });
    const presigned = presign.data as {
      uploadKey: string;
      url: string;
      headers: Record<string, string>;
    };

    setStatus({ kind: "uploading", percent: 0 });
    const put = await putDirect(presigned, picked, (fraction) =>
      setStatus({ kind: "uploading", percent: Math.round(fraction * 100) }),
    );
    if (!put) return setStatus({ kind: "error", code: "network" });

    setStatus({ kind: "processing" });
    const complete = await postJson("/api/header-image/complete", {
      target,
      uploadKey: presigned.uploadKey,
      crop: chosenCrop,
      photographerCredit: credit,
    });
    if (!complete.ok) return setStatus({ kind: "error", code: complete.code });

    router.push(returnHref);
    router.refresh();
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!crop || busy) return;
    if (file) {
      void upload(file, crop);
      return;
    }
    const formData = new FormData();
    formData.set("photographerCredit", credit);
    formData.set("cropX", String(crop.x));
    formData.set("cropY", String(crop.y));
    formData.set("cropW", String(crop.w));
    formData.set("cropH", String(crop.h));
    startTransition(() => saveAction(formData));
  }

  function onRemove() {
    if (!window.confirm(t.actions.removeConfirm)) return;
    startTransition(() => removeAction());
  }

  return (
    <form onSubmit={onSubmit} className="d-flex flex-column gap-4">
      <div>
        <FormLabel htmlFor="HeaderImageEditor-file">
          {existing ? t.actions.replace : t.fields.file.label}
        </FormLabel>
        <FormControl
          id="HeaderImageEditor-file"
          type="file"
          accept={acceptedTypes}
          disabled={busy}
          required={!existing}
          onChange={(event) =>
            pick((event.target as HTMLInputElement).files?.[0] ?? null)
          }
        />
        <FormText>{t.fields.file.help}</FormText>
      </div>

      {src && (
        <div>
          <FormLabel as="div">{t.fields.crop.label}</FormLabel>
          <CropFrame
            key={src}
            src={src}
            crop={crop}
            onCropChange={setCrop}
            onImageLoad={onImageLoad}
            originalSize={originalSize}
            overlay={
              <div className={styles.text}>
                <h2 className="lf-display-l">{previewTitle}</h2>
              </div>
            }
            messages={t.fields.crop}
          />
        </div>
      )}

      <div>
        <FormLabel htmlFor="HeaderImageEditor-credit">
          {t.fields.photographerCredit.label}*
        </FormLabel>
        <FormControl
          id="HeaderImageEditor-credit"
          value={credit}
          onChange={(event) => setCredit(event.target.value)}
          required
          maxLength={photographerCreditMaxLength}
          disabled={busy}
        />
        <FormText>{t.fields.photographerCredit.help}</FormText>
      </div>

      {status.kind === "uploading" && (
        <div>
          <ProgressBar now={status.percent} />
          <FormText>
            {t.status.uploading.replace("{percent}", String(status.percent))}
          </FormText>
        </div>
      )}
      {status.kind === "processing" && (
        <Alert variant="info" className="m-0">
          {t.status.processing}
        </Alert>
      )}
      {status.kind === "error" && (
        <Alert variant="danger" className="m-0">
          {t.errors[status.code]}
        </Alert>
      )}

      <div className="d-flex flex-wrap gap-2">
        <Button type="submit" disabled={busy || !crop || (!file && !existing)}>
          {file ? t.actions.upload : t.actions.save}
        </Button>
        <Link href={returnHref} className="btn btn-outline-secondary">
          {t.actions.cancel}
        </Link>
        {existing && (
          <Button
            type="button"
            variant="outline-danger"
            className="ms-auto"
            disabled={busy}
            onClick={onRemove}
          >
            {t.actions.remove}
          </Button>
        )}
      </div>
    </form>
  );
}
