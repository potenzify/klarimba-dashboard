import type { StepContent, StepType } from "@/lib/api/content-schemas";

/**
 * Metadatos del panel de contenido por tipo de step y formato (client-safe).
 * La forma del contenido de cada tipo sigue los tipos de los seeders del API
 * (`klarimba-api/src/modules/missions/infrastructure/seeds/data/types.ts`).
 */

export interface StepTypeMeta {
  label: string;
  description: string;
}

export const STEP_TYPE_META: Record<StepType, StepTypeMeta> = {
  multiple_choice: {
    label: "Opción múltiple",
    description: "Pregunta con opciones puntuadas.",
  },
  slider_choice: {
    label: "Escala Likert",
    description: "Afirmación con escala fija de 5 posiciones (−2…+2).",
  },
  voice_affirmation: {
    label: "Afirmación en voz alta",
    description: "El usuario lee y graba una afirmación varias veces.",
  },
  audio_review: {
    label: "Repaso de audios",
    description: "Lista de las grabaciones del usuario.",
  },
  guided_text: {
    label: "Reflexión escrita",
    description: "Pregunta abierta que el usuario responde por escrito.",
  },
  text_review: {
    label: "Repaso de reflexiones",
    description: "Lista de las respuestas escritas del usuario.",
  },
  role_play_dialog: {
    label: "Roleplay",
    description: "Conversación por turnos con un Pumpy y resultado por puntaje.",
  },
  outcome_result: {
    label: "Resultado por puntaje",
    description: "Resumen que se muestra según la puntuación total.",
  },
  mindful_media: {
    label: "Video mindful",
    description: "Práctica guiada en video con portada.",
  },
  photo_collect: {
    label: "Recolección de fotos",
    description: "El usuario elige o toma fotos.",
  },
  photo_reflection: {
    label: "Reflexión sobre una foto",
    description: "Pregunta sobre una de las fotos recolectadas.",
  },
  gallery_review: {
    label: "Galería",
    description: "Repaso de las fotos y sus reflexiones (sin textos propios).",
  },
  guided_text_edit: {
    label: "Edición de reflexión",
    description: "Permite reescribir una reflexión anterior.",
  },
  goal_review: {
    label: "Revisión de metas",
    description: "Muestra las metas del usuario (se rellenan en runtime).",
  },
  scenario: {
    label: "Escenario narrativo",
    description: "Texto de contexto (legado de F10).",
  },
  coaching_chat: {
    label: "Sesión con Kika",
    description: "Chat de coaching con Kika.",
  },
};

export const FORMAT_LABELS: Record<string, string> = {
  F1: "Afirmaciones",
  F3: "Test",
  F4: "Reflexión guiada",
  F5: "Roleplay",
  F6: "Mindful",
  F8: "Fotografía",
  F9: "Revisión",
  F10: "Coaching",
};

export const MISSION_TYPE_LABELS: Record<string, string> = {
  mission_0: "Misión 0",
  standard: "Estándar",
  avatar_test: "Test del avatar",
};

export const PUMPY_OPTIONS = [
  { value: "sunny_pumpy", label: "Sunny" },
  { value: "earthy_pumpy", label: "Earthy" },
  { value: "forest_pumpy", label: "Forest" },
  { value: "heart_pumpy", label: "Heart" },
  { value: "ocean_pumpy", label: "Ocean" },
] as const;

export const POLARITY_OPTIONS = [
  { value: "positive", label: "Positiva" },
  { value: "neutral", label: "Neutral" },
  { value: "negative", label: "Negativa" },
] as const;

export const LOCALE_LABELS: Record<string, string> = {
  es: "Español",
  en: "Inglés",
  it: "Italiano",
};

const firstText = (...values: unknown[]): string =>
  (values.find((v) => typeof v === "string" && v.trim()) as string | undefined) ?? "";

/** Texto corto que identifica un step en la lista. */
export function stepPreview(stepType: StepType, content: StepContent | undefined): string {
  const c = content ?? {};
  switch (stepType) {
    case "multiple_choice":
    case "slider_choice":
    case "photo_reflection":
      return firstText(c.question);
    case "voice_affirmation":
      return firstText(c.prompt, c.textBubble);
    case "guided_text":
    case "guided_text_edit":
      return firstText(c.description, c.title, c.placeholder);
    case "role_play_dialog":
      return firstText(c.scenario?.title, c.scenario?.description);
    case "outcome_result":
      return `${Array.isArray(c.outcomes) ? c.outcomes.length : 0} tramos de resultado`;
    case "mindful_media":
    case "goal_review":
    case "coaching_chat":
      return firstText(c.title, c.description, c.textBubble);
    case "photo_collect":
      return firstText(c.instruction);
    case "scenario":
      return firstText(c.title, c.description);
    case "audio_review":
    case "text_review":
      return c.render?.itemTitlePrefix ? `Ítems: «${c.render.itemTitlePrefix}»` : "Repaso";
    case "gallery_review":
      return "Galería de fotos";
    default:
      return "";
  }
}

/** Tramos de resultado por formato (bandas del manual técnico; `formats/domain/constants/score-bands.ts`). */
export const SCORE_BANDS: Record<string, Array<{ min: number; max: number; polarity: string }>> = {
  F3: [
    { min: -18, max: -7, polarity: "negative" },
    { min: -6, max: 11, polarity: "neutral" },
    { min: 12, max: 18, polarity: "positive" },
  ],
  F5: [
    { min: -10, max: -4, polarity: "negative" },
    { min: -3, max: 3, polarity: "neutral" },
    { min: 4, max: 10, polarity: "positive" },
  ],
};

const emptyOutcome = (band: { min: number; max: number; polarity: string }) => ({
  ...band,
  badge: "",
  headline: "",
  message: "",
  suggestedAction: "",
});

const review = (itemTitlePrefix: string) => ({
  render: { numbered: true, itemTitlePrefix, allowEdit: false },
  allowSaveToJournal: true,
  defaultSaveToJournal: false,
});

/** Contenido inicial de un step nuevo (con la forma de los builders de seeds). */
export function newStepTemplate(stepType: StepType, formatCode: string): StepContent {
  switch (stepType) {
    case "multiple_choice":
      return {
        question: "",
        options: [
          { id: "opt1", text: "", score: 2 },
          { id: "opt2", text: "", score: 0 },
          { id: "opt3", text: "", score: -2 },
        ],
      };
    case "slider_choice":
      return { question: "" };
    case "voice_affirmation":
      return {
        textBubble: "",
        textBubbles: ["", "", ""],
        prompt: "",
        repeatsRequired: 3,
        minDuration: 1,
        maxDuration: 5,
      };
    case "audio_review":
      return review("Afirmación");
    case "text_review":
      return review("Reflexión");
    case "guided_text":
    case "guided_text_edit":
      return { description: "", placeholder: "", minChars: 10 };
    case "role_play_dialog":
      return {
        pumpyName: "sunny_pumpy",
        scenario: { title: "", description: "" },
        turns: [1, 2, 3, 4, 5].map((n) => ({
          id: `t${n}`,
          message: "",
          options: [
            { id: `t${n}o1`, text: "", score: 2, polarity: "positive" },
            { id: `t${n}o2`, text: "", score: 0, polarity: "neutral" },
            { id: `t${n}o3`, text: "", score: -2, polarity: "negative" },
          ],
        })),
        outcomeRanges: SCORE_BANDS.F5.map((band, i) => ({ id: `r${i + 1}`, ...emptyOutcome(band) })),
      };
    case "outcome_result":
      return { outcomes: (SCORE_BANDS[formatCode] ?? SCORE_BANDS.F3).map(emptyOutcome) };
    case "mindful_media":
      return { title: "", description: "", mediaId: "", durationSec: 0 };
    case "photo_collect":
      return { instruction: "", minCount: 3, maxCount: 3 };
    case "photo_reflection":
      return { question: "", photoIndex: 0, placeholder: "" };
    case "goal_review":
      return { title: "", subtitle: "", goals: [], sourceMissionOrder: 5 };
    case "scenario":
      return { title: "", description: "" };
    case "coaching_chat":
      return { title: "Sesión de coaching", textBubble: "Tu coach personal", minExchanges: 3, maxExchanges: 3 };
    case "gallery_review":
    default:
      return {};
  }
}
