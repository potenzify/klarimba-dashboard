import { Lock } from "lucide-react";
import {
  TablePagination,
  parsePageParam,
} from "@/components/dashboard/table-pagination";
import { PageHeader } from "@/components/layout/page-header";
import { countInvitations, listInvitations } from "@/lib/api/organizations";
import {
  invitationStatusSchema,
  type InvitationStatus,
} from "@/lib/api/schemas";
import { requireOrgContext } from "@/lib/dashboard-context";
import { InviteDialog } from "../users/invite-dialog";
import {
  InvitationsTable,
  type InvitationStatusCounts,
} from "./invitations-table";

const PAGE_SIZE = 20;

interface InvitationsPageProps {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{ status?: string; page?: string }>;
}

/**
 * Todas las invitaciones de la organización: personales con destinatario (las
 * mismas que aparecen como "Invitado" en Usuarios), códigos "al portador" y
 * compartidos — estos dos últimos no tienen otra pantalla donde verse.
 */
export default async function InvitationsPage({
  params,
  searchParams,
}: InvitationsPageProps) {
  const [{ orgId }, { status, page: rawPage }] = await Promise.all([
    params,
    searchParams,
  ]);
  const context = await requireOrgContext(orgId, ["company", "peoplebasic"]);

  const statusFilter: InvitationStatus | undefined =
    invitationStatusSchema.safeParse(status).data;
  const page = parsePageParam(rawPage);

  // Página + contadores por estado (sondas `limit=1`), igual que en Usuarios.
  const [pageResult, all, active, exhausted, expired, revoked] =
    await Promise.all([
      listInvitations(orgId, {
        status: statusFilter,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      }),
      countInvitations(orgId),
      countInvitations(orgId, "ACTIVE"),
      countInvitations(orgId, "EXHAUSTED"),
      countInvitations(orgId, "EXPIRED"),
      countInvitations(orgId, "REVOKED"),
    ]);

  const counts: InvitationStatusCounts = {
    ALL: all,
    ACTIVE: active,
    EXHAUSTED: exhausted,
    EXPIRED: expired,
    REVOKED: revoked,
  };

  return (
    <>
      <PageHeader
        title="Invitaciones"
        description={`Códigos de acceso emitidos por ${context.org.name}${active !== null ? ` · ${active} ${active === 1 ? "activo" : "activos"}` : ""}`}
        actions={<InviteDialog orgId={orgId} defaultTab="codes" />}
      />
      <InvitationsTable
        orgId={orgId}
        invitations={pageResult.items}
        counts={counts}
        activeFilter={statusFilter}
      />
      <TablePagination
        pagination={pageResult.pagination}
        count={pageResult.items.length}
        basePath={`/org/${orgId}/invitations`}
        params={{ status: statusFilter }}
        noun="invitaciones"
      />
      <p className="mt-3 flex items-center gap-2 text-[11.5px] text-muted-foreground">
        <Lock className="size-3.5 shrink-0 text-brand-mid" />
        Un código canjeado consume un acceso de la organización. Revocar un
        código no afecta a quien ya lo canjeó: eso se gestiona en Usuarios.
      </p>
    </>
  );
}
