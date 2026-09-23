"use client";

import { FormSection, ListEditor, NumberField, TextField } from "../fields";
import type { StepFormProps } from "./types";

/** VOICE_AFFIRMATION (F1): `VoiceAffirmationContentDto`. */
export function VoiceAffirmationForm({ content, set }: StepFormProps) {
  const bubbles: string[] = Array.isArray(content.textBubbles) ? content.textBubbles : [];
  return (
    <>
      <TextField
        label="Afirmación (lo que el usuario lee en voz alta)"
        multiline
        maxLength={140}
        value={content.prompt}
        onChange={(v) => set(["prompt"], v)}
      />
      <TextField
        label="Burbuja de texto (por defecto)"
        multiline
        maxLength={140}
        value={content.textBubble}
        onChange={(v) => set(["textBubble"], v)}
        hint="Se muestra cuando no hay burbuja específica para la repetición."
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <NumberField
          label="Repeticiones"
          value={content.repeatsRequired}
          min={1}
          max={10}
          onChange={(v) => set(["repeatsRequired"], v)}
        />
        <NumberField
          label="Duración mínima (s)"
          value={content.minDuration}
          min={1}
          max={60}
          onChange={(v) => set(["minDuration"], v)}
        />
        <NumberField
          label="Duración máxima (s)"
          value={content.maxDuration}
          min={1}
          max={120}
          onChange={(v) => set(["maxDuration"], v)}
        />
      </div>
      <FormSection
        title="Burbujas por repetición"
        description="Una por repetición (la app muestra textBubbles[n] y, si falta, la burbuja por defecto)."
      >
        <ListEditor<string>
          items={bubbles}
          onChange={(next) => set(["textBubbles"], next.length ? next : undefined)}
          addLabel="Añadir burbuja"
          itemLabel={(i) => `Repetición ${i + 1}`}
          createItem={() => ""}
          renderItem={(bubble, _i, update) => (
            <TextField label="Texto" multiline maxLength={140} value={bubble} onChange={update} />
          )}
        />
      </FormSection>
    </>
  );
}
