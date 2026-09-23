"use client";

import { FormSection, ListEditor, NumberField, SelectField, TextField, nextId } from "../fields";
import { POLARITY_OPTIONS, PUMPY_OPTIONS } from "@/lib/content/step-types";
import { OutcomeRangesEditor, type OutcomeRange } from "./outcome-ranges";
import type { StepFormProps } from "./types";

type Option = { id: string; text: string; score: number; polarity: string };
type Turn = { id: string; message: string; options: Option[] };

/** ROLE_PLAY_DIALOG (F5): `RolePlayContent` (pumpy, escenario, turnos y tramos de resultado). */
export function RolePlayForm({ content, set }: StepFormProps) {
  const turns: Turn[] = Array.isArray(content.turns) ? content.turns : [];
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField
          label="Pumpy"
          value={content.pumpyName}
          options={PUMPY_OPTIONS}
          onChange={(v) => set(["pumpyName"], v)}
        />
      </div>
      <FormSection title="Escenario" description="Intro del roleplay: título y contexto de la situación.">
        <TextField
          label="Título"
          value={content.scenario?.title}
          onChange={(v) => set(["scenario", "title"], v)}
        />
        <TextField
          label="Descripción"
          multiline
          rows={3}
          value={content.scenario?.description}
          onChange={(v) => set(["scenario", "description"], v)}
        />
      </FormSection>
      <FormSection
        title="Turnos"
        description="El Pumpy dice su mensaje y el usuario elige una respuesta. F5 usa +2 / 0 / −2 por respuesta (5 turnos → −10…+10)."
      >
        <ListEditor<Turn>
          items={turns}
          onChange={(next) => set(["turns"], next)}
          minItems={1}
          addLabel="Añadir turno"
          itemLabel={(i) => `Turno ${i + 1}`}
          createItem={(items) => {
            const id = nextId("t", items);
            return {
              id,
              message: "",
              options: [
                { id: `${id}o1`, text: "", score: 2, polarity: "positive" },
                { id: `${id}o2`, text: "", score: 0, polarity: "neutral" },
                { id: `${id}o3`, text: "", score: -2, polarity: "negative" },
              ],
            };
          }}
          renderItem={(turn, _i, updateTurn) => (
            <div className="flex flex-col gap-3">
              <TextField
                label="Mensaje del Pumpy"
                multiline
                rows={3}
                value={turn.message}
                onChange={(message) => updateTurn({ ...turn, message })}
              />
              <ListEditor<Option>
                items={turn.options ?? []}
                onChange={(options) => updateTurn({ ...turn, options })}
                minItems={1}
                addLabel="Añadir respuesta"
                itemLabel={(j) => `Respuesta ${j + 1}`}
                createItem={(items) => ({
                  id: `${turn.id}o${items.length + 1}`,
                  text: "",
                  score: 0,
                  polarity: "neutral",
                })}
                renderItem={(option, _j, updateOption) => (
                  <div className="grid gap-3 sm:grid-cols-[1fr_100px_150px]">
                    <TextField
                      label="Texto"
                      multiline
                      value={option.text}
                      onChange={(text) => updateOption({ ...option, text })}
                    />
                    <NumberField
                      label="Puntaje"
                      value={option.score}
                      onChange={(score) => updateOption({ ...option, score: score ?? 0 })}
                    />
                    <SelectField
                      label="Polaridad"
                      value={option.polarity}
                      options={POLARITY_OPTIONS}
                      onChange={(polarity) => updateOption({ ...option, polarity: polarity ?? "neutral" })}
                    />
                  </div>
                )}
              />
            </div>
          )}
        />
      </FormSection>
      <FormSection
        title="Resultados por puntaje"
        description="Pantalla de resumen del roleplay. Los rangos son las bandas de F5 y no se editan aquí."
      >
        <OutcomeRangesEditor
          items={Array.isArray(content.outcomeRanges) ? (content.outcomeRanges as OutcomeRange[]) : []}
          onChange={(next) => set(["outcomeRanges"], next)}
          withIds
          fixedBands
        />
      </FormSection>
    </>
  );
}
