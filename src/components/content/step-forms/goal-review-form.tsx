"use client";

import { NumberField, TextField } from "../fields";
import type { StepFormProps } from "./types";

/**
 * GOAL_REVIEW (F9): `GoalReviewContent`. Las metas NO se siembran: en runtime
 * se rellenan con las respuestas GUIDED_TEXT de la misión `sourceMissionOrder`
 * (la F4 de plan, order 5 en los seeds).
 */
export function GoalReviewForm({ content, set }: StepFormProps) {
  return (
    <>
      <TextField label="Título" value={content.title} onChange={(v) => set(["title"], v)} />
      <TextField label="Subtítulo" value={content.subtitle} onChange={(v) => set(["subtitle"], v)} />
      <NumberField
        label="Misión fuente de las metas (order en el mapa)"
        value={content.sourceMissionOrder}
        min={0}
        onChange={(v) => set(["sourceMissionOrder"], v)}
        hint="Debe ser una misión F4 del mismo mapa (los seeds usan 5). Si no lo es, la app cae a la F4 anterior más cercana."
        className="max-w-md"
      />
      <p className="rounded-lg border border-dashed bg-card p-3 text-[12px] text-muted-foreground">
        Las metas se rellenan solas con las respuestas del usuario; por eso la lista de metas va
        siempre vacía y no se edita aquí.
      </p>
    </>
  );
}
