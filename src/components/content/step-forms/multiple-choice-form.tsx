"use client";

import { FormSection, ListEditor, NumberField, SelectField, TextField, nextId } from "../fields";
import { PUMPY_OPTIONS } from "@/lib/content/step-types";
import type { StepFormProps } from "./types";

type Option = { id: string; text: string; score: number; pumpyName?: string };

/** MULTIPLE_CHOICE: `MultipleChoiceContent` (question + options id/text/score, pumpyName en el test del avatar). */
export function MultipleChoiceForm({ content, set, context }: StepFormProps) {
  const options: Option[] = Array.isArray(content.options) ? content.options : [];
  const withPumpy = context.missionType === "avatar_test" || options.some((o) => o.pumpyName);
  return (
    <>
      <TextField
        label="Pregunta"
        multiline
        rows={3}
        value={content.question}
        onChange={(v) => set(["question"], v)}
      />
      <FormSection
        title="Opciones"
        description={
          withPumpy
            ? "Cada opción suma su puntaje al Pumpy indicado (test del avatar)."
            : "En los tests F3 el manual usa +2 / 0 / −2: cambiar puntajes altera las bandas de resultado."
        }
      >
        <ListEditor<Option>
          items={options}
          onChange={(next) => set(["options"], next)}
          minItems={1}
          addLabel="Añadir opción"
          itemLabel={(i) => `Opción ${i + 1}`}
          createItem={(items) => ({ id: nextId("opt", items), text: "", score: 0 })}
          renderItem={(option, _i, update) => (
            <div className="grid gap-3 sm:grid-cols-[1fr_110px]">
              <TextField
                label="Texto"
                multiline
                value={option.text}
                onChange={(text) => update({ ...option, text })}
              />
              <NumberField
                label="Puntaje"
                value={option.score}
                step={1}
                onChange={(score) => update({ ...option, score: score ?? 0 })}
              />
              {withPumpy && (
                <SelectField
                  label="Pumpy"
                  value={option.pumpyName}
                  emptyLabel="Ninguno"
                  options={PUMPY_OPTIONS}
                  onChange={(pumpyName) => update({ ...option, pumpyName })}
                  className="sm:col-span-2"
                />
              )}
            </div>
          )}
        />
      </FormSection>
    </>
  );
}
