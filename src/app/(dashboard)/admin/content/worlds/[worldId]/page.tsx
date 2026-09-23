import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { ContentBreadcrumb } from "@/components/content/content-breadcrumb";
import { RenameForm } from "@/components/content/rename-form";
import { PageHeader } from "@/components/layout/page-header";
import { getContentWorld } from "@/lib/api/content";
import { orNotFound } from "../../not-found-guard";

interface WorldPageProps {
  params: Promise<{ worldId: string }>;
}

export default async function ContentWorldPage({ params }: WorldPageProps) {
  const { worldId } = await params;
  const world = await orNotFound(getContentWorld(worldId));

  return (
    <>
      <ContentBreadcrumb items={[{ label: world.name }]} />
      <PageHeader title={world.name} description={`Mundo ${world.order} · ${world.slug}`} />

      <section className="mb-8">
        <h2 className="mb-3 text-[12px] font-bold tracking-wider text-muted-foreground uppercase">
          Nombre del mundo
        </h2>
        <RenameForm owner="worlds" id={world.id} version={world.version} translations={world.translations} />
      </section>

      <section>
        <h2 className="mb-3 text-[12px] font-bold tracking-wider text-muted-foreground uppercase">
          Mapas ({world.maps?.length ?? 0})
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(world.maps ?? []).map((map) => (
            <Link
              key={map.id}
              href={`/admin/content/maps/${map.id}`}
              className="group flex flex-col gap-1.5 rounded-xl border bg-card p-4 transition-colors hover:border-brand-mid hover:bg-secondary/40"
            >
              <span className="text-[11px] font-semibold text-muted-foreground">Mapa {map.order}</span>
              <h3 className="text-[15px] font-bold tracking-tight">{map.name}</h3>
              <p className="text-[11.5px] text-muted-foreground">
                {map.translations.en?.name ?? "—"} · {map.translations.it?.name ?? "—"}
              </p>
              <div className="mt-2 flex items-center justify-between text-[12px] text-muted-foreground">
                <span>{map.missionsCount} misiones</span>
                <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
