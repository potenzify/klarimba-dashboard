import { ChevronRight, History, Layers, Map as MapIcon } from "lucide-react";
import Link from "next/link";
import { FormatBadge } from "@/components/content/format-badge";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { listContentWorlds, listUnmappedMissions } from "@/lib/api/content";
import { MISSION_TYPE_LABELS } from "@/lib/content/step-types";

export default async function ContentHomePage() {
  const [worlds, unmapped] = await Promise.all([listContentWorlds(), listUnmappedMissions()]);

  return (
    <>
      <PageHeader
        title="Contenido"
        description="Edita en caliente el contenido de las misiones: la base de datos manda y los cambios llegan a la app al instante, sin resetear nada."
        actions={
          <Button variant="outline" asChild>
            <Link href="/admin/content/history">
              <History />
              Historial de cambios
            </Link>
          </Button>
        }
      />

      <section className="mb-8">
        <h2 className="mb-3 text-[12px] font-bold tracking-wider text-muted-foreground uppercase">Mundos</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {worlds.map((world) => (
            <Link
              key={world.id}
              href={`/admin/content/worlds/${world.id}`}
              className="group flex flex-col gap-2 rounded-xl border bg-card p-4 transition-colors hover:border-brand-mid hover:bg-secondary/40"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-primary">
                  <Layers className="size-4.5" />
                </span>
                <span className="text-[11px] font-semibold text-muted-foreground">Mundo {world.order}</span>
              </div>
              <div>
                <h3 className="text-[15px] font-bold tracking-tight">{world.name}</h3>
                <p className="text-[11.5px] text-muted-foreground">
                  {world.translations.en?.name ?? "—"} · {world.translations.it?.name ?? "—"}
                </p>
              </div>
              <div className="mt-auto flex items-center justify-between pt-1 text-[12px] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <MapIcon className="size-3.5" />
                  {world.mapsCount} mapas
                </span>
                <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {unmapped.length > 0 && (
        <section>
          <h2 className="mb-1 text-[12px] font-bold tracking-wider text-muted-foreground uppercase">
            Misiones sin mapa
          </h2>
          <p className="mb-3 text-[12.5px] text-muted-foreground">
            No cuelgan de ningún mundo (hoy, el test del avatar).
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {unmapped.map((mission) => (
              <Link
                key={mission.id}
                href={`/admin/content/missions/${mission.id}`}
                className="flex flex-col gap-2 rounded-xl border bg-card p-4 transition-colors hover:border-brand-mid hover:bg-secondary/40"
              >
                <div className="flex items-center gap-2">
                  <FormatBadge code={mission.formatCode} />
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {MISSION_TYPE_LABELS[mission.missionType] ?? mission.missionType}
                  </span>
                </div>
                <h3 className="text-[14px] font-bold">{mission.name}</h3>
                <p className="text-[12px] text-muted-foreground">{mission.stepsCount} steps</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
