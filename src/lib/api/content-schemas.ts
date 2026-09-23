import { z } from "zod";

/**
 * Schemas del panel de contenido (`/backoffice/content` del API, módulo
 * `content-admin`). Client-safe: los usan tanto los wrappers server-only
 * (`content.ts`) como los componentes del editor para tipar.
 *
 * El contenido de los steps es JSON libre por tipo (forma de
 * `seeds/data/types.ts` del API): aquí se valida solo que sea un objeto; el
 * contrato por tipo lo valida el API al guardar.
 */

export const stepTypeSchema = z.enum([
  "multiple_choice",
  "slider_choice",
  "voice_affirmation",
  "audio_review",
  "guided_text",
  "text_review",
  "role_play_dialog",
  "outcome_result",
  "mindful_media",
  "photo_collect",
  "photo_reflection",
  "gallery_review",
  "guided_text_edit",
  "goal_review",
  "scenario",
  "coaching_chat",
]);
export type StepType = z.infer<typeof stepTypeSchema>;

export const translationModeSchema = z.enum(["AUTO", "SKIP"]);
export type TranslationMode = z.infer<typeof translationModeSchema>;

export const contentEntityTypeSchema = z.enum(["WORLD", "MAP", "MISSION", "STEP"]);
export type ContentEntityType = z.infer<typeof contentEntityTypeSchema>;

export const contentRevisionActionSchema = z.enum([
  "UPDATE",
  "CREATE",
  "DELETE",
  "REORDER",
  "IMPORT",
  "REVERT",
]);
export type ContentRevisionAction = z.infer<typeof contentRevisionActionSchema>;

/** Contenido JSON de un step en un idioma. */
export const stepContentSchema = z.record(z.string(), z.any());
export type StepContent = z.infer<typeof stepContentSchema>;

const nameTranslationsSchema = z.record(z.string(), z.object({ name: z.string() }));

export const contentFileSchema = z.object({
  id: z.string(),
  url: z.string().nullable(),
  name: z.string(),
  originalName: z.string(),
  mimeType: z.string(),
  size: z.number(),
  isPlaceholder: z.boolean(),
});
export type ContentFile = z.infer<typeof contentFileSchema>;

export const contentMapSummarySchema = z.object({
  id: z.string(),
  slug: z.string(),
  order: z.number(),
  enabled: z.boolean(),
  name: z.string(),
  translations: nameTranslationsSchema,
  version: z.string(),
  missionsCount: z.number(),
});
export type ContentMapSummary = z.infer<typeof contentMapSummarySchema>;

export const contentWorldSchema = z.object({
  id: z.string(),
  slug: z.string(),
  order: z.number(),
  enabled: z.boolean(),
  name: z.string(),
  translations: nameTranslationsSchema,
  version: z.string(),
  mapsCount: z.number(),
  maps: z.array(contentMapSummarySchema).optional(),
});
export type ContentWorld = z.infer<typeof contentWorldSchema>;

export const contentMissionSummarySchema = z.object({
  id: z.string(),
  slug: z.string(),
  order: z.number(),
  missionType: z.string(),
  enabled: z.boolean(),
  formatCode: z.string(),
  formatTitle: z.string(),
  name: z.string(),
  stepsCount: z.number(),
  responsesCount: z.number(),
  lastEditedAt: z.string().nullable(),
});
export type ContentMissionSummary = z.infer<typeof contentMissionSummarySchema>;

export const contentMapSchema = contentMapSummarySchema.extend({
  world: z.object({ id: z.string(), slug: z.string(), name: z.string() }),
  missions: z.array(contentMissionSummarySchema),
});
export type ContentMap = z.infer<typeof contentMapSchema>;

const celebrationTextSchema = z.object({ mainText: z.string(), subText: z.string() });

/** Textos de una misión: forma `MissionTranslationData` de los seeds. */
export const missionTextsSchema = z.object({
  name: z.string(),
  loadingText: z.string(),
  low: celebrationTextSchema,
  medium: celebrationTextSchema,
  high: celebrationTextSchema,
});
export type MissionTexts = z.infer<typeof missionTextsSchema>;

export const contentStepSchema = z.object({
  id: z.string(),
  order: z.number(),
  stepType: stepTypeSchema,
  supportsImage: z.boolean(),
  image: contentFileSchema.nullable(),
  responsesCount: z.number(),
  translations: z.record(z.string(), stepContentSchema),
  issues: z.array(z.string()),
  version: z.string(),
});
export type ContentStep = z.infer<typeof contentStepSchema>;

const scoreRangeSchema = z.object({ min: z.number(), max: z.number() });

export const scoringReportSchema = z.object({
  formatCode: z.string(),
  bands: z.array(scoreRangeSchema.extend({ band: z.string() })),
  reachable: scoreRangeSchema,
  outcomeRanges: z.array(scoreRangeSchema).nullable(),
  ok: z.boolean(),
  issues: z.array(z.string()),
});
export type ScoringReport = z.infer<typeof scoringReportSchema>;

export const contentMissionSchema = z.object({
  id: z.string(),
  slug: z.string(),
  order: z.number(),
  missionType: z.string(),
  enabled: z.boolean(),
  format: z.object({
    code: z.string(),
    title: z.string(),
    allowedStepTypes: z.array(stepTypeSchema),
    fixedCelebration: z.boolean(),
    catalogCelebration: z
      .object({ title: z.string(), description: z.string() })
      .nullable(),
  }),
  map: z
    .object({
      id: z.string(),
      slug: z.string(),
      name: z.string(),
      world: z.object({ id: z.string(), slug: z.string(), name: z.string() }),
    })
    .nullable(),
  locales: z.array(z.string()),
  texts: z.object({
    translations: z.record(z.string(), missionTextsSchema),
    version: z.string(),
  }),
  steps: z.array(contentStepSchema),
  files: z.record(z.string(), contentFileSchema),
  scoring: scoringReportSchema.nullable(),
  lastEditedAt: z.string().nullable(),
});
export type ContentMission = z.infer<typeof contentMissionSchema>;

export const localeTranslationReportSchema = z.object({
  locale: z.string(),
  status: z.enum(["TRANSLATED", "UNCHANGED", "COPIED", "NOT_CREATED"]),
  translated: z.number(),
  reused: z.number(),
  copied: z.number(),
});
export type LocaleTranslationReport = z.infer<typeof localeTranslationReportSchema>;

export const contentMutationSchema = z.object({
  entityType: contentEntityTypeSchema,
  entityId: z.string(),
  revisionId: z.string().nullable(),
  translation: z.array(localeTranslationReportSchema),
  warnings: z.array(z.string()),
});
export type ContentMutation = z.infer<typeof contentMutationSchema>;

export const contentRevisionSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  entityType: contentEntityTypeSchema,
  entityId: z.string(),
  missionId: z.string().nullable(),
  action: contentRevisionActionSchema,
  summary: z.string().nullable(),
  actor: z
    .object({ id: z.string(), email: z.string().nullable(), name: z.string().nullable() })
    .nullable(),
  revertedRevisionId: z.string().nullable(),
  revertible: z.boolean(),
  before: z.unknown().optional(),
  after: z.unknown().optional(),
});
export type ContentRevision = z.infer<typeof contentRevisionSchema>;

/** Export de misión: `MissionData` de los seeds + manifiesto de archivos. */
export const missionExportSchema = z.object({
  schemaVersion: z.number(),
  exportedAt: z.string(),
  source: z.object({ apiUrl: z.string().nullable() }),
  context: z.object({
    missionId: z.string(),
    worldSlug: z.string().nullable(),
    mapSlug: z.string().nullable(),
  }),
  mission: z.record(z.string(), z.any()),
  files: z.record(z.string(), z.any()),
});
export type MissionExport = z.infer<typeof missionExportSchema>;

export const importStepPlanSchema = z.object({
  position: z.number(),
  action: z.enum(["UNCHANGED", "UPDATE", "CREATE", "DELETE", "REPLACE"]),
  stepType: stepTypeSchema.nullable(),
  currentStepType: stepTypeSchema.nullable(),
  responsesCount: z.number(),
  blocked: z.string().nullable(),
});
export type ImportStepPlan = z.infer<typeof importStepPlanSchema>;

export const missionImportPlanSchema = z.object({
  canApply: z.boolean(),
  errors: z.array(z.string()),
  warnings: z.array(z.string()),
  textsChanged: z.boolean(),
  steps: z.array(importStepPlanSchema),
  files: z.array(
    z.object({
      ref: z.string(),
      status: z.enum(["FOUND", "DOWNLOAD", "MISSING"]),
      fileId: z.string().nullable(),
    }),
  ),
  revisionId: z.string().nullable().optional(),
});
export type MissionImportPlan = z.infer<typeof missionImportPlanSchema>;
