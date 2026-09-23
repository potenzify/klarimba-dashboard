"use client";

import { SelectField, TextField } from "../fields";
import { PUMPY_OPTIONS } from "@/lib/content/step-types";
import type { StepFormProps } from "./types";

/** SLIDER_CHOICE: `SliderContent` (Likert de 5 posiciones con etiquetas fijas en la app). */
export function SliderChoiceForm({ content, set, context }: StepFormProps) {
  const withPumpy = context.missionType === "avatar_test" || Boolean(content.pumpyName);
  return (
    <>
      <TextField
        label="Afirmación"
        multiline
        rows={3}
        value={content.question}
        onChange={(v) => set(["question"], v)}
        hint="Las 5 etiquetas de la escala (−2…+2) las pinta la app; aquí solo va el enunciado."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField
          label="Polaridad"
          value={content.polarity ?? "positive"}
          options={[
            { value: "positive", label: "Positiva (comportamiento deseado)" },
            { value: "negative", label: "Negativa (invierte el puntaje)" },
          ]}
          onChange={(v) => set(["polarity"], v === "positive" ? undefined : v)}
          hint="Negativa: estar «totalmente de acuerdo» resta (−2)."
        />
        {withPumpy && (
          <SelectField
            label="Pumpy"
            value={content.pumpyName}
            emptyLabel="Ninguno"
            options={PUMPY_OPTIONS}
            onChange={(v) => set(["pumpyName"], v)}
            hint="Test del avatar: la posición elegida suma a este Pumpy."
          />
        )}
      </div>
    </>
  );
}
