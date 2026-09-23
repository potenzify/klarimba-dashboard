"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { toActionError, type ActionResult } from "@/lib/action-result";
import {
  createStep,
  deleteStep,
  exportMission,
  getContentRevision,
  importMission,
  listContentRevisions,
  reorderSteps,
  revertContentRevision,
  updateContentName,
  updateMissionTexts,
  updateStep,
} from "@/lib/api/content";
import {
  contentEntityTypeSchema,
  missionTextsSchema,
  stepContentSchema,
  stepTypeSchema,
  translationModeSchema,
  type ContentMutation,
  type ContentRevision,
  type MissionExport,
  type MissionImportPlan,
} from "@/lib/api/content-schemas";

const id = z.string().uuid();
const writeOptions = {
  version: z.string().optional(),
  translation: translationModeSchema.optional(),
};

function invalid(parsed: { error: z.ZodError }): ActionResult<never> {
  return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
}

function refresh() {
  revalidatePath("/admin/content", "layout");
}

// --- Mundos y mapas ------------------------------------------------------------

const renameSchema = z.object({
  owner: z.enum(["worlds", "maps"]),
  id,
  name: z.string().trim().min(1, "El nombre no puede ir vacío").max(100, "Máximo 100 caracteres"),
  ...writeOptions,
});

export async function renameContentAction(
  input: z.infer<typeof renameSchema>,
): Promise<ActionResult<ContentMutation>> {
  const parsed = renameSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed);
  const { owner, id: ownerId, ...body } = parsed.data;
  try {
    const data = await updateContentName(owner, ownerId, body);
    refresh();
    return { ok: true, data };
  } catch (error) {
    return toActionError(error);
  }
}

// --- Misiones --------------------------------------------------------------------

const missionTextsInput = z.object({
  missionId: id,
  texts: missionTextsSchema,
  ...writeOptions,
});

export async function updateMissionTextsAction(
  input: z.infer<typeof missionTextsInput>,
): Promise<ActionResult<ContentMutation>> {
  const parsed = missionTextsInput.safeParse(input);
  if (!parsed.success) return invalid(parsed);
  const { missionId, ...body } = parsed.data;
  try {
    const data = await updateMissionTexts(missionId, body);
    refresh();
    return { ok: true, data };
  } catch (error) {
    return toActionError(error);
  }
}

// --- Steps -----------------------------------------------------------------------

const updateStepInput = z.object({
  stepId: id,
  content: stepContentSchema,
  imageId: z.string().uuid().nullable().optional(),
  ...writeOptions,
});

export async function updateStepAction(
  input: z.infer<typeof updateStepInput>,
): Promise<ActionResult<ContentMutation>> {
  const parsed = updateStepInput.safeParse(input);
  if (!parsed.success) return invalid(parsed);
  const { stepId, ...body } = parsed.data;
  try {
    const data = await updateStep(stepId, body);
    refresh();
    return { ok: true, data };
  } catch (error) {
    return toActionError(error);
  }
}

const createStepInput = z.object({
  missionId: id,
  stepType: stepTypeSchema,
  position: z.number().int().min(1).optional(),
  content: stepContentSchema,
  imageId: z.string().uuid().nullable().optional(),
  translation: translationModeSchema.optional(),
});

export async function createStepAction(
  input: z.infer<typeof createStepInput>,
): Promise<ActionResult<ContentMutation>> {
  const parsed = createStepInput.safeParse(input);
  if (!parsed.success) return invalid(parsed);
  const { missionId, ...body } = parsed.data;
  try {
    const data = await createStep(missionId, body);
    refresh();
    return { ok: true, data };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteStepAction(stepId: string): Promise<ActionResult<ContentMutation>> {
  if (!id.safeParse(stepId).success) return { ok: false, error: "Step inválido" };
  try {
    const data = await deleteStep(stepId);
    refresh();
    return { ok: true, data };
  } catch (error) {
    return toActionError(error);
  }
}

const reorderInput = z.object({ missionId: id, stepIds: z.array(id).min(1) });

export async function reorderStepsAction(
  input: z.infer<typeof reorderInput>,
): Promise<ActionResult<ContentMutation>> {
  const parsed = reorderInput.safeParse(input);
  if (!parsed.success) return invalid(parsed);
  try {
    const data = await reorderSteps(parsed.data.missionId, parsed.data.stepIds);
    refresh();
    return { ok: true, data };
  } catch (error) {
    return toActionError(error);
  }
}

// --- Export / import -------------------------------------------------------------

export async function exportMissionAction(
  missionId: string,
): Promise<ActionResult<MissionExport>> {
  if (!id.safeParse(missionId).success) return { ok: false, error: "Misión inválida" };
  try {
    return { ok: true, data: await exportMission(missionId) };
  } catch (error) {
    return toActionError(error);
  }
}

const importInput = z.object({
  missionId: id,
  payload: z.record(z.string(), z.unknown()),
  dryRun: z.boolean(),
  translation: translationModeSchema.optional(),
});

export async function importMissionAction(
  input: z.infer<typeof importInput>,
): Promise<ActionResult<MissionImportPlan>> {
  const parsed = importInput.safeParse(input);
  if (!parsed.success) return invalid(parsed);
  const { missionId, ...body } = parsed.data;
  try {
    const data = await importMission(missionId, body);
    if (!body.dryRun) refresh();
    return { ok: true, data };
  } catch (error) {
    return toActionError(error);
  }
}

// --- Historial -------------------------------------------------------------------

const revisionsQuery = z.object({
  missionId: id.optional(),
  entityType: contentEntityTypeSchema.optional(),
  entityId: id.optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
});

export async function listRevisionsAction(
  input: z.infer<typeof revisionsQuery>,
): Promise<ActionResult<{ items: ContentRevision[]; total: number | null }>> {
  const parsed = revisionsQuery.safeParse(input);
  if (!parsed.success) return invalid(parsed);
  try {
    const page = await listContentRevisions(parsed.data);
    return { ok: true, data: { items: page.items, total: page.pagination?.total ?? null } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function getRevisionAction(
  revisionId: string,
): Promise<ActionResult<ContentRevision>> {
  if (!id.safeParse(revisionId).success) return { ok: false, error: "Revisión inválida" };
  try {
    return { ok: true, data: await getContentRevision(revisionId) };
  } catch (error) {
    return toActionError(error);
  }
}

export async function revertRevisionAction(
  revisionId: string,
): Promise<ActionResult<ContentMutation>> {
  if (!id.safeParse(revisionId).success) return { ok: false, error: "Revisión inválida" };
  try {
    const data = await revertContentRevision(revisionId);
    refresh();
    return { ok: true, data };
  } catch (error) {
    return toActionError(error);
  }
}
