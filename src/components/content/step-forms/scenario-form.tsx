"use client";

import { TextField } from "../fields";
import type { StepFormProps } from "./types";

/** SCENARIO (legado F10): título opcional + descripción narrativa. */
export function ScenarioForm({ content, set }: StepFormProps) {
  return (
    <>
      <TextField
        label="Título (opcional)"
        value={content.title}
        onChange={(v) => set(["title"], v || undefined)}
      />
      <TextField
        label="Descripción"
        multiline
        rows={4}
        value={content.description}
        onChange={(v) => set(["description"], v)}
      />
    </>
  );
}
