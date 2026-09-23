"use client";

import { NumberField, TextField } from "../fields";
import type { StepFormProps } from "./types";

/** PHOTO_COLLECT (F8): `PhotoCollectContent`. */
export function PhotoCollectForm({ content, set }: StepFormProps) {
  return (
    <>
      <TextField
        label="Instrucción"
        multiline
        rows={2}
        value={content.instruction}
        onChange={(v) => set(["instruction"], v)}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField
          label="Mínimo de fotos"
          value={content.minCount}
          min={0}
          onChange={(v) => set(["minCount"], v)}
        />
        <NumberField
          label="Máximo de fotos"
          value={content.maxCount}
          min={0}
          onChange={(v) => set(["maxCount"], v)}
          hint="F8 usa 3 fotos, una reflexión por foto."
        />
      </div>
    </>
  );
}

/** PHOTO_REFLECTION (F8): `PhotoReflectionContent` (una por foto, `photoIndex` 0..n). */
export function PhotoReflectionForm({ content, set }: StepFormProps) {
  return (
    <>
      <TextField
        label="Pregunta"
        multiline
        rows={2}
        value={content.question}
        onChange={(v) => set(["question"], v)}
      />
      <TextField
        label="Placeholder del campo"
        multiline
        value={content.placeholder}
        onChange={(v) => set(["placeholder"], v || undefined)}
      />
      <NumberField
        label="Foto (índice)"
        value={content.photoIndex}
        min={0}
        onChange={(v) => set(["photoIndex"], v)}
        hint="0 = primera foto, 1 = segunda…"
        className="max-w-48"
      />
    </>
  );
}

/** GALLERY_REVIEW (F8): sin textos propios en los seeds. */
export function GalleryReviewForm() {
  return (
    <p className="rounded-lg border border-dashed bg-card p-4 text-[12.5px] text-muted-foreground">
      La galería muestra las fotos y reflexiones del usuario; no tiene textos que editar. Si hace
      falta ajustar algún campo técnico, usa la vista JSON avanzada.
    </p>
  );
}
