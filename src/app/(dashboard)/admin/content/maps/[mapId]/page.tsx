import Link from "next/link";
import { ContentBreadcrumb } from "@/components/content/content-breadcrumb";
import { FormatBadge } from "@/components/content/format-badge";
import { LocalDateTime } from "@/components/content/local-date-time";
import { RenameForm } from "@/components/content/rename-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getContentMap } from "@/lib/api/content";
import { MISSION_TYPE_LABELS } from "@/lib/content/step-types";
import { orNotFound } from "../../not-found-guard";

interface MapPageProps {
  params: Promise<{ mapId: string }>;
}

export default async function ContentMapPage({ params }: MapPageProps) {
  const { mapId } = await params;
  const map = await orNotFound(getContentMap(mapId));

  return (
    <>
      <ContentBreadcrumb
        items={[{ label: map.world.name, href: `/admin/content/worlds/${map.world.id}` }, { label: map.name }]}
      />
      <PageHeader title={map.name} description={`Mapa ${map.order} de ${map.world.name} · ${map.slug}`} />

      <section className="mb-8">
        <h2 className="mb-3 text-[12px] font-bold tracking-wider text-muted-foreground uppercase">
          Nombre del mapa
        </h2>
        <RenameForm owner="maps" id={map.id} version={map.version} translations={map.translations} />
      </section>

      <section>
        <h2 className="mb-3 text-[12px] font-bold tracking-wider text-muted-foreground uppercase">
          Misiones ({map.missions.length})
        </h2>
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Misión</TableHead>
                  <TableHead>Formato</TableHead>
                  <TableHead className="text-right">Steps</TableHead>
                  <TableHead className="text-right">Respuestas</TableHead>
                  <TableHead>Última edición en el panel</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {map.missions.map((mission) => (
                  <TableRow key={mission.id}>
                    <TableCell className="font-semibold text-muted-foreground tabular-nums">{mission.order}</TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/content/missions/${mission.id}`}
                        className="font-semibold hover:text-primary hover:underline"
                      >
                        {mission.name}
                      </Link>
                      <p className="text-[11px] text-muted-foreground">
                        {MISSION_TYPE_LABELS[mission.missionType] ?? mission.missionType} · {mission.slug}
                      </p>
                    </TableCell>
                    <TableCell>
                      <FormatBadge code={mission.formatCode} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{mission.stepsCount}</TableCell>
                    <TableCell className="text-right tabular-nums">{mission.responsesCount}</TableCell>
                    <TableCell className="text-[12px] text-muted-foreground">
                      <LocalDateTime value={mission.lastEditedAt} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
