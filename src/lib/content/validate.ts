import type { StepContent, StepType } from "@/lib/api/content-schemas";

/**
 * Validación previa en el navegador de lo que el API exigirá (DTOs de contenido
 * por tipo). Solo da feedback inmediato: la autoridad es el API, que responde
 * 422 con el detalle si algo no cuadra.
 */
export function validateStepContent(stepType: StepType, c: StepContent): string[] {
  const errors: string[] = [];
  const text = (value: unknown, label: string, { max }: { max?: number } = {}) => {
    if (typeof value !== "string" || !value.trim()) errors.push(`${label}: obligatorio`);
    else if (max && value.length > max) errors.push(`${label}: máximo ${max} caracteres`);
  };
  const num = (value: unknown, label: string, { min, max }: { min?: number; max?: number } = {}) => {
    if (typeof value !== "number" || Number.isNaN(value)) errors.push(`${label}: debe ser un número`);
    else if (min !== undefined && value < min) errors.push(`${label}: mínimo ${min}`);
    else if (max !== undefined && value > max) errors.push(`${label}: máximo ${max}`);
  };
  const optionalNum = (value: unknown, label: string, bounds?: { min?: number; max?: number }) => {
    if (value !== undefined && value !== null && value !== "") num(value, label, bounds);
  };
  const ranges = (items: unknown, label: string) => {
    if (!Array.isArray(items) || items.length === 0) {
      errors.push(`${label}: añade al menos un tramo`);
      return;
    }
    items.forEach((item, i) => {
      const n = `${label} ${i + 1}`;
      num(item?.min, `${n} · mínimo`);
      num(item?.max, `${n} · máximo`);
      if (typeof item?.min === "number" && typeof item?.max === "number" && item.min > item.max) {
        errors.push(`${n}: el mínimo no puede ser mayor que el máximo`);
      }
      text(item?.badge, `${n} · etiqueta`);
      text(item?.headline, `${n} · titular`);
      text(item?.message, `${n} · mensaje`);
      text(item?.suggestedAction, `${n} · acción sugerida`);
    });
  };

  switch (stepType) {
    case "multiple_choice":
      text(c.question, "Pregunta");
      if (!Array.isArray(c.options) || c.options.length === 0) errors.push("Añade al menos una opción");
      (c.options ?? []).forEach((o: StepContent, i: number) => {
        text(o?.id, `Opción ${i + 1} · id`);
        text(o?.text, `Opción ${i + 1} · texto`);
        num(o?.score, `Opción ${i + 1} · puntaje`);
      });
      break;
    case "slider_choice":
    case "photo_reflection":
      text(c.question, stepType === "slider_choice" ? "Afirmación" : "Pregunta");
      break;
    case "voice_affirmation":
      text(c.textBubble, "Burbuja de texto", { max: 140 });
      text(c.prompt, "Afirmación", { max: 140 });
      (c.textBubbles ?? []).forEach((b: unknown, i: number) =>
        text(b, `Burbuja de la repetición ${i + 1}`, { max: 140 }),
      );
      num(c.repeatsRequired, "Repeticiones", { min: 1, max: 10 });
      num(c.minDuration, "Duración mínima", { min: 1, max: 60 });
      num(c.maxDuration, "Duración máxima", { min: 1, max: 120 });
      if (c.minDuration > c.maxDuration) errors.push("La duración mínima no puede superar la máxima");
      break;
    case "role_play_dialog":
      text(c.pumpyName, "Pumpy");
      text(c.scenario?.title, "Escenario · título");
      text(c.scenario?.description, "Escenario · descripción");
      if (!Array.isArray(c.turns) || c.turns.length === 0) errors.push("Añade al menos un turno");
      (c.turns ?? []).forEach((t: StepContent, i: number) => {
        text(t?.id, `Turno ${i + 1} · id`);
        text(t?.message, `Turno ${i + 1} · mensaje del Pumpy`);
        if (!Array.isArray(t?.options) || t.options.length === 0) {
          errors.push(`Turno ${i + 1}: añade al menos una respuesta`);
        }
        (t?.options ?? []).forEach((o: StepContent, j: number) => {
          text(o?.id, `Turno ${i + 1} · respuesta ${j + 1} · id`);
          text(o?.text, `Turno ${i + 1} · respuesta ${j + 1}`);
          num(o?.score, `Turno ${i + 1} · respuesta ${j + 1} · puntaje`);
        });
      });
      ranges(c.outcomeRanges, "Resultado");
      break;
    case "outcome_result":
      ranges(c.outcomes, "Tramo");
      break;
    case "mindful_media":
      if (!c.mediaId) errors.push("Video: sube el archivo de la práctica");
      optionalNum(c.durationSec, "Duración (s)", { min: 0 });
      break;
    case "photo_collect":
      text(c.instruction, "Instrucción");
      optionalNum(c.minCount, "Mínimo de fotos", { min: 0 });
      optionalNum(c.maxCount, "Máximo de fotos", { min: 0 });
      if (typeof c.minCount === "number" && typeof c.maxCount === "number" && c.minCount > c.maxCount) {
        errors.push("El mínimo de fotos no puede superar el máximo");
      }
      break;
    case "goal_review":
      text(c.title, "Título");
      text(c.subtitle, "Subtítulo");
      optionalNum(c.sourceMissionOrder, "Misión fuente de metas", { min: 0 });
      break;
    case "scenario":
      text(c.description, "Descripción");
      break;
    case "coaching_chat":
      optionalNum(c.minExchanges, "Intercambios mínimos", { min: 1 });
      optionalNum(c.maxExchanges, "Intercambios máximos", { min: 1 });
      break;
    case "guided_text":
    case "guided_text_edit":
      optionalNum(c.minChars, "Mínimo de caracteres", { min: 0 });
      break;
    default:
      break;
  }
  return errors;
}
