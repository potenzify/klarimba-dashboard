import { Lock } from "lucide-react";
import { TruncationNotice } from "@/components/dashboard/truncation-notice";
import { PageHeader } from "@/components/layout/page-header";
import { listOrganizationUsers } from "@/lib/api/organizations";
import {
  organizationUserStatusSchema,
  type OrganizationUserStatus,
} from "@/lib/api/schemas";
import { requireOrgContext } from "@/lib/dashboard-context";
import { InviteDialog } from "./invite-dialog";
import { UsersTable } from "./users-table";

interface UsersPageProps {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{ status?: string }>;
}

export default async function UsersPage({
  params,
  searchParams,
}: UsersPageProps) {
  const [{ orgId }, { status }] = await Promise.all([params, searchParams]);
  const context = await requireOrgContext(orgId, ["company", "peoplebasic"]);

  const statusFilter: OrganizationUserStatus | undefined =
    organizationUserStatusSchema.safeParse(status).data;

  // Traemos el listado completo (hasta 100) para poder mostrar los contadores
  // por estado; el filtro activo se aplica en memoria.
  const users = await listOrganizationUsers(orgId, { limit: 100 });
  const visible = statusFilter
    ? users.filter((u) => u.status === statusFilter)
    : users;

  const activeCount = users.filter((u) => u.status === "ACTIVE").length;

  return (
    <>
      <PageHeader
        title="Usuarios"
        description={`Personas de ${context.org.name} con acceso a Klarimba People · ${activeCount} ${activeCount === 1 ? "activo" : "activos"}`}
        actions={<InviteDialog orgId={orgId} />}
      />
      <UsersTable
        orgId={orgId}
        users={visible}
        allUsers={users}
        activeFilter={statusFilter}
      />
      <TruncationNotice count={users.length} limit={100} noun="personas" />
      <p className="mt-3 flex items-center gap-2 text-[11.5px] text-muted-foreground">
        <Lock className="size-3.5 shrink-0 text-brand-mid" />A nivel individual
        solo se ve el estado operativo: rol, acceso y licencia. Nunca diario,
        respuestas ni resultados emocionales.
      </p>
    </>
  );
}
