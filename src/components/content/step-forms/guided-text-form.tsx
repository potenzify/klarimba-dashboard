"use client";

import { NumberField, TextField } from "../fields";
import type { StepFormProps } from "./types";

/** GUIDED_TEXT / GUIDED_TEXT_EDIT: `GuidedTextContent`. */
export function GuidedTextForm({ content, set, editable }: StepFormProps & { editable?: boolean }) {
  return (
    <>
      <TextField
        label="Título (opcional)"
        value={content.title}
        onChange={(v) => set(["title"], v || undefined)}
        hint="Se muestra encima del campo de respuesta (p. ej. «Meta 1»)."
      />
      <TextField
        label="Pregunta / consigna"
        multiline
        rows={3}
        value={content.description}
        onChange={(v) => set(["description"], v)}
      />
      <TextField
        label="Placeholder del campo"
        multiline
        value={content.placeholder}
        onChange={(v) => set(["placeholder"], v || undefined)}
        hint="Texto de ayuda dentro del campo; suele iniciar la frase del usuario."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField
          label="Mínimo de caracteres"
          value={content.minChars}
          min={0}
          onChange={(v) => set(["minChars"], v)}
        />
        {editable && (
          <NumberField
            label="Step de origen (order)"
            value={content.sourceStep}
            min={1}
            onChange={(v) => set(["sourceStep"], v)}
            hint="Reflexión anterior que se reescribe."
          />
        )}
      </div>
    </>
  );
}
