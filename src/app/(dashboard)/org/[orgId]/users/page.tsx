import { Lock } from "lucide-react";
import {
  TablePagination,
  parsePageParam,
} from "@/components/dashboard/table-pagination";
import { PageHeader } from "@/components/layout/page-header";
import {
  countOrganizationUsers,
  listOrganizationUsers,
} from "@/lib/api/organizations";
import {
  organizationUserStatusSchema,
  type OrganizationUserStatus,
} from "@/lib/api/schemas";
import { requireOrgContext } from "@/lib/dashboard-context";
import { InviteDialog } from "./invite-dialog";
import { UsersTable, type UserStatusCounts } from "./users-table";

const PAGE_SIZE = 20;

interface UsersPageProps {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{ status?: string; page?: string }>;
}

export default async function UsersPage({
  params,
  searchParams,
}: UsersPageProps) {
  const [{ orgId }, { status, page: rawPage }] = await Promise.all([
    params,
    searchParams,
  ]);
  const context = await requireOrgContext(orgId, ["company", "peoplebasic"]);

  const statusFilter: OrganizationUserStatus | undefined =
    organizationUserStatusSchema.safeParse(status).data;
  const page = parsePageParam(rawPage);

  // Página de servidor + contadores de los chips. Los contadores son sondas
  // `limit=1` que solo leen `pagination.total` — cinco counts indexados, en
  // paralelo con la página; antes se traían 100 filas y se contaba en memoria,
  // lo que truncaba en silencio pasado el límite.
  const [pageResult, all, active, invited, suspended, revoked] =
    await Promise.all([
      listOrganizationUsers(orgId, {
        status: statusFilter,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      }),
      countOrganizationUsers(orgId),
      countOrganizationUsers(orgId, "ACTIVE"),
      countOrganizationUsers(orgId, "INVITED"),
      countOrganizationUsers(orgId, "SUSPENDED"),
      countOrganizationUsers(orgId, "REVOKED"),
    ]);

  const counts: UserStatusCounts = {
    ALL: all,
    ACTIVE: active,
    INVITED: invited,
    SUSPENDED: suspended,
    REVOKED: revoked,
  };

  return (
    <>
      <PageHeader
        title="Usuarios"
        description={`Personas de ${context.org.name} con acceso a Klarimba People${active !== null ? ` · ${active} ${active === 1 ? "activo" : "activos"}` : ""}`}
        actions={<InviteDialog orgId={orgId} />}
      />
      <UsersTable
        orgId={orgId}
        users={pageResult.items}
        counts={counts}
        activeFilter={statusFilter}
      />
      <TablePagination
        pagination={pageResult.pagination}
        count={pageResult.items.length}
        basePath={`/org/${orgId}/users`}
        params={{ status: statusFilter }}
        noun="personas"
      />
      <p className="mt-3 flex items-center gap-2 text-[11.5px] text-muted-foreground">
        <Lock className="size-3.5 shrink-0 text-brand-mid" />A nivel individual
        solo se ve el estado operativo: rol, acceso y licencia. Nunca diario,
        respuestas ni resultados emocionales.
      </p>
    </>
  );
}
