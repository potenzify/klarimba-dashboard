import { ContentBreadcrumb } from "@/components/content/content-breadcrumb";
import { RevisionHistory } from "@/components/content/revision-history";
import { PageHeader } from "@/components/layout/page-header";
import { listContentRevisions } from "@/lib/api/content";

const PAGE_SIZE = 30;

export default async function ContentHistoryPage() {
  const revisions = await listContentRevisions({ limit: PAGE_SIZE });
  return (
    <>
      <ContentBreadcrumb items={[{ label: "Historial" }]} />
      <PageHeader
        title="Historial de cambios"
        description="Todo lo que se ha cambiado desde el panel (mundos, mapas, misiones y steps). Cada cambio se puede revertir."
      />
      <RevisionHistory
        key={`${revisions.items[0]?.id ?? "empty"}-${revisions.pagination?.total}`}
        initial={revisions.items}
        total={revisions.pagination?.total ?? null}
        filters={{}}
        pageSize={PAGE_SIZE}
        linkMissions
      />
    </>
  );
}
