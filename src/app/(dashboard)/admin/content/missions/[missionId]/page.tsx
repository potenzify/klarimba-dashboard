import { ContentBreadcrumb, type Crumb } from "@/components/content/content-breadcrumb";
import { FormatBadge } from "@/components/content/format-badge";
import { LocalDateTime } from "@/components/content/local-date-time";
import { MissionEditor } from "@/components/content/mission-editor";
import { ExportMissionButton, ImportMissionDialog } from "@/components/content/mission-transfer";
import { PageHeader } from "@/components/layout/page-header";
import { getContentMission, listContentRevisions } from "@/lib/api/content";
import { MISSION_TYPE_LABELS } from "@/lib/content/step-types";
import { orNotFound } from "../../not-found-guard";

interface MissionPageProps {
  params: Promise<{ missionId: string }>;
}

export default async function ContentMissionPage({ params }: MissionPageProps) {
  const { missionId } = await params;
  const [mission, revisions] = await Promise.all([
    orNotFound(getContentMission(missionId)),
    listContentRevisions({ missionId, limit: 20 }),
  ]);

  const crumbs: Crumb[] = mission.map
    ? [
        { label: mission.map.world.name, href: `/admin/content/worlds/${mission.map.world.id}` },
        { label: mission.map.name, href: `/admin/content/maps/${mission.map.id}` },
        { label: `Misión ${mission.order}` },
      ]
    : [{ label: MISSION_TYPE_LABELS[mission.missionType] ?? mission.slug }];
  const name = mission.texts.translations.es?.name ?? mission.slug;

  return (
    <>
      <ContentBreadcrumb items={crumbs} />
      <PageHeader
        title={name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <FormatBadge code={mission.format.code} />
            <span>{MISSION_TYPE_LABELS[mission.missionType] ?? mission.missionType}</span>
            <span>·</span>
            <code className="text-[12px]">{mission.slug}</code>
            {mission.lastEditedAt && (
              <>
                <span>·</span>
                <span>
                  <LocalDateTime value={mission.lastEditedAt} prefix="editada en el panel el " />
                </span>
              </>
            )}
          </span>
        }
        actions={
          <>
            <ExportMissionButton missionId={mission.id} slug={mission.slug} />
            <ImportMissionDialog missionId={mission.id} />
          </>
        }
      />
      <MissionEditor
        mission={mission}
        revisions={{ items: revisions.items, total: revisions.pagination?.total ?? null }}
      />
    </>
  );
}
