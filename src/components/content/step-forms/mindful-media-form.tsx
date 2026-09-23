"use client";

import { FileField } from "../file-field";
import { NumberField, TextField } from "../fields";
import type { StepFormProps } from "./types";

/**
 * MINDFUL_MEDIA (F6): `MindfulMediaContent`. `mediaId` y `coverImgId` son ids de
 * archivos públicos. Si en/it tenían su propio video (doblado) lo conservan al
 * retraducir; si heredaban el del español, siguen al nuevo.
 */
export function MindfulMediaForm({ content, set, context }: StepFormProps) {
  const media = content.mediaId ? context.files[content.mediaId] : null;
  const cover = content.coverImgId ? context.files[content.coverImgId] : null;
  return (
    <>
      <TextField label="Título" value={content.title} onChange={(v) => set(["title"], v)} />
      <TextField
        label="Descripción"
        multiline
        rows={3}
        value={content.description}
        onChange={(v) => set(["description"], v)}
      />
      <FileField
        label="Video de la práctica"
        kind="video"
        file={media}
        hint="MP4, MOV o WEBM (máx. 600 MB). Al subirlo se rellena la duración."
        onUploaded={(file, { durationSec }) => {
          context.registerFile(file);
          set(["mediaId"], file.id);
          if (durationSec) set(["durationSec"], durationSec);
        }}
      />
      <FileField
        label="Portada"
        kind="image"
        file={cover}
        hint="PNG, JPG, WEBP o GIF (máx. 20 MB)."
        onUploaded={(file) => {
          context.registerFile(file);
          set(["coverImgId"], file.id);
        }}
        onClear={() => set(["coverImgId"], undefined)}
      />
      <NumberField
        label="Duración (segundos)"
        value={content.durationSec}
        min={0}
        onChange={(v) => set(["durationSec"], v)}
        className="max-w-48"
      />
    </>
  );
}
