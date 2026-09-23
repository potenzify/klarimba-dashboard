import "server-only";
import { z } from "zod";
import { apiFetch, apiFetchPage, type Page } from "@/lib/api/http";
import {
  contentMapSchema,
  contentMissionSchema,
  contentMissionSummarySchema,
  contentMutationSchema,
  contentRevisionSchema,
  contentWorldSchema,
  missionExportSchema,
  missionImportPlanSchema,
  type ContentEntityType,
  type ContentMap,
  type ContentMission,
  type ContentMissionSummary,
  type ContentMutation,
  type ContentRevision,
  type ContentWorld,
  type MissionExport,
  type MissionImportPlan,
  type MissionTexts,
  type StepContent,
  type StepType,
  type TranslationMode,
} from "@/lib/api/content-schemas";

// Panel de contenido: `/backoffice/content` (`@PlatformRoleProtected(SUPER_ADMIN)`).

interface WriteOptions {
  version?: string;
  translation?: TranslationMode;
}

export async function listContentWorlds(): Promise<ContentWorld[]> {
  return apiFetch("/backoffice/content/worlds", { schema: z.array(contentWorldSchema) });
}

export async function getContentWorld(worldId: string): Promise<ContentWorld> {
  return apiFetch(`/backoffice/content/worlds/${worldId}`, { schema: contentWorldSchema });
}

export async function getContentMap(mapId: string): Promise<ContentMap> {
  return apiFetch(`/backoffice/content/maps/${mapId}`, { schema: contentMapSchema });
}

export async function listUnmappedMissions(): Promise<ContentMissionSummary[]> {
  return apiFetch("/backoffice/content/missions/unmapped", {
    schema: z.array(contentMissionSummarySchema),
  });
}

export async function getContentMission(missionId: string): Promise<ContentMission> {
  return apiFetch(`/backoffice/content/missions/${missionId}`, {
    schema: contentMissionSchema,
  });
}

export async function updateContentName(
  owner: "worlds" | "maps",
  id: string,
  body: { name: string } & WriteOptions,
): Promise<ContentMutation> {
  return apiFetch(`/backoffice/content/${owner}/${id}`, {
    method: "PATCH",
    body,
    schema: contentMutationSchema,
  });
}

export async function updateMissionTexts(
  missionId: string,
  body: { texts: MissionTexts } & WriteOptions,
): Promise<ContentMutation> {
  return apiFetch(`/backoffice/content/missions/${missionId}`, {
    method: "PATCH",
    body,
    schema: contentMutationSchema,
  });
}

export async function updateStep(
  stepId: string,
  body: { content: StepContent; imageId?: string | null } & WriteOptions,
): Promise<ContentMutation> {
  return apiFetch(`/backoffice/content/steps/${stepId}`, {
    method: "PATCH",
    body,
    schema: contentMutationSchema,
  });
}

export async function createStep(
  missionId: string,
  body: {
    stepType: StepType;
    position?: number;
    content: StepContent;
    imageId?: string | null;
    translation?: TranslationMode;
  },
): Promise<ContentMutation> {
  return apiFetch(`/backoffice/content/missions/${missionId}/steps`, {
    method: "POST",
    body,
    schema: contentMutationSchema,
  });
}

export async function deleteStep(stepId: string): Promise<ContentMutation> {
  return apiFetch(`/backoffice/content/steps/${stepId}`, {
    method: "DELETE",
    schema: contentMutationSchema,
  });
}

export async function reorderSteps(
  missionId: string,
  stepIds: string[],
): Promise<ContentMutation> {
  return apiFetch(`/backoffice/content/missions/${missionId}/steps/order`, {
    method: "PUT",
    body: { stepIds },
    schema: contentMutationSchema,
  });
}

export async function exportMission(missionId: string): Promise<MissionExport> {
  return apiFetch(`/backoffice/content/missions/${missionId}/export`, {
    schema: missionExportSchema,
  });
}

export async function importMission(
  missionId: string,
  body: { payload: Record<string, unknown>; dryRun: boolean; translation?: TranslationMode },
): Promise<MissionImportPlan> {
  return apiFetch(`/backoffice/content/missions/${missionId}/import`, {
    method: "POST",
    body,
    schema: missionImportPlanSchema,
  });
}

export async function listContentRevisions(params: {
  missionId?: string;
  entityType?: ContentEntityType;
  entityId?: string;
  limit?: number;
  offset?: number;
}): Promise<Page<ContentRevision>> {
  return apiFetchPage("/backoffice/content/revisions", {
    query: params,
    schema: z.array(contentRevisionSchema),
  });
}

export async function getContentRevision(revisionId: string): Promise<ContentRevision> {
  return apiFetch(`/backoffice/content/revisions/${revisionId}`, {
    schema: contentRevisionSchema,
  });
}

export async function revertContentRevision(revisionId: string): Promise<ContentMutation> {
  return apiFetch(`/backoffice/content/revisions/${revisionId}/revert`, {
    method: "POST",
    schema: contentMutationSchema,
  });
}
