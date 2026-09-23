"use client";

import { SwitchField, TextField } from "../fields";
import type { StepFormProps } from "./types";

/** TEXT_REVIEW / AUDIO_REVIEW: `TextReviewContent` / `AudioReviewContent`. */
export function ReviewForm({ content, set }: StepFormProps) {
  const render = content.render ?? {};
  return (
    <>
      <TextField
        label="Prefijo de cada ítem"
        value={render.itemTitlePrefix}
        onChange={(v) => set(["render", "itemTitlePrefix"], v)}
        hint="Se numera: «Reflexión 1», «Reflexión 2»…"
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <SwitchField
          label="Numerar ítems"
          checked={Boolean(render.numbered)}
          onChange={(v) => set(["render", "numbered"], v)}
        />
        <SwitchField
          label="Permitir editar"
          checked={Boolean(render.allowEdit)}
          onChange={(v) => set(["render", "allowEdit"], v)}
        />
        <SwitchField
          label="Se puede guardar en el diario"
          checked={Boolean(content.allowSaveToJournal)}
          onChange={(v) => set(["allowSaveToJournal"], v)}
        />
        <SwitchField
          label="Guardar en el diario por defecto"
          checked={Boolean(content.defaultSaveToJournal)}
          onChange={(v) => set(["defaultSaveToJournal"], v)}
        />
      </div>
    </>
  );
}
