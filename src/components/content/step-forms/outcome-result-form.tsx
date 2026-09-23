"use client";

import { FormSection } from "../fields";
import { SCORE_BANDS } from "@/lib/content/step-types";
import { OutcomeRangesEditor, type OutcomeRange } from "./outcome-ranges";
import type { StepFormProps } from "./types";

/** OUTCOME_RESULT: `OutcomeResultContent` (resumen por puntaje; F3 usa las bandas del formato). */
export function OutcomeResultForm({ content, set, context }: StepFormProps) {
  const banded = Boolean(SCORE_BANDS[context.formatCode]) && context.missionType !== "avatar_test";
  return (
    <FormSection
      title="Tramos de resultado"
      description={
        banded
          ? `Los rangos son las bandas de ${context.formatCode} (manual técnico) y no se editan aquí; sí sus textos.`
          : "Cada tramo se muestra cuando el puntaje total cae en su rango."
      }
    >
      <OutcomeRangesEditor
        items={Array.isArray(content.outcomes) ? (content.outcomes as OutcomeRange[]) : []}
        onChange={(next) => set(["outcomes"], next)}
        fixedBands={banded}
      />
    </FormSection>
  );
}
