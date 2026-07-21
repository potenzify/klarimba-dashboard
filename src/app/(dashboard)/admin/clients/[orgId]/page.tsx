import { ScrollText } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SeatUsageCards } from "@/components/dashboard/seat-usage-card";
import {
  StatusPill,
  orgStatusPill,
  seatGrantStatusPill,
} from "@/components/dashboard/status-pill";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getBackofficeOrganization,
  listBackofficeAuditLog,
  listBackofficeSeatGrants,
} from "@/lib/api/backoffice";
import { ApiError } from "@/lib/api/http";
import { getOrganizationEntitlements } from "@/lib/api/organizations";
import { formatApiDate } from "@/lib/format";
import {
  BootstrapAdminCard,
  EditClientDialog,
  EnterpriseCard,
  GrantSeatsDialog,
  RevokeGrantButton,
} from "./client-detail-panels";

interface ClientDetailPageProps {
  params: Promise<{ orgId: string }>;
}

const AUDIT_LABELS: Record<string, string> = {
  ORGANIZATION_CREATED: "Organización creada",
  ORGANIZATION_UPDATED: "Organización actualizada",
  SEAT_GRANT_CREATED: "Grant de accesos creado",
  SEAT_GRANT_UPDATED: "Grant de accesos actualizado",
  SEAT_GRANT_REVOKED: "Grant de accesos revocado",
  SEAT_GRANT_EXPIRED: "Grant de accesos expirado",
  SEATS_ALLOCATED_TO_CHILD: "Accesos asignados a empresa hija",
  INVITATION_CREATED: "Invitación creada",
  INVITATION_RESENT: "Invitación reenviada",
  INVITATION_REVOKED: "Invitación revocada",
  INVITATION_REDEEMED: "Invitación canjeada",
  INVITATION_EXPIRED: "Invitación expirada",
  ENTITLEMENT_GRANTED: "Add-on activado",
  ENTITLEMENT_REVOKED: "Add-on revocado",
  MEMBERSHIP_CREATED: "Membresía creada",
  MEMBERSHIP_UPDATED: "Membresía actualizada",
  MEMBERSHIP_SUSPENDED: "Membresía suspendida",
  MEMBERSHIP_REVOKED: "Membresía revocada",
};

export default async function ClientDetailPage({
  params,
}: ClientDetailPageProps) {
  const { orgId } = await params;

  let summary;
  try {
    summary = await getBackofficeOrganization(orgId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const [grants, entitlements, auditLog] = await Promise.all([
    listBackofficeSeatGrants(orgId, { limit: 50 }),
    getOrganizationEntitlements(orgId).catch(() => []),
    listBackofficeAuditLog(orgId, { limit: 30 }),
  ]);

  const { organization, seatUsage } = summary;
  const status = orgStatusPill(organization.status);
  const isPartner = organization.type === "PARTNER";

  return (
    <>
      <div className="mb-4 text-[12.5px] text-muted-foreground">
        <Link href="/admin/clients" className="hover:text-primary">
          Clientes
        </Link>{" "}
        · <b className="text-foreground">{organization.name}</b>
      </div>
      <PageHeader
        title={organization.name}
        description={
          <span className="flex items-center gap-2">
            <StatusPill tone={isPartner ? "purple" : "green"}>
              {isPartner ? "Partner" : "Empresa"}
            </StatusPill>
            <StatusPill tone={status.tone}>{status.label}</StatusPill>
            <span className="font-mono text-xs">{organization.slug}</span>
          </span>
        }
        actions={
          <EditClientDialog
            orgId={orgId}
            currentName={organization.name}
            currentStatus={organization.status}
          />
        }
      />

      <SeatUsageCards seatUsage={seatUsage} showChildren={isPartner} />

      <div className="mt-4 grid grid-cols-[1.5fr_1fr] items-start gap-4 max-lg:grid-cols-1">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-[13.5px]">Grants de accesos</CardTitle>
            <GrantSeatsDialog orgId={orgId} />
          </CardHeader>
          <CardContent>
            {grants.length === 0 ? (
              <p className="py-6 text-center text-[12.5px] text-muted-foreground">
                Sin grants. Crea uno para dar accesos a este cliente.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Accesos</TableHead>
                    <TableHead>Vigencia</TableHead>
                    <TableHead>Origen</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grants.map((grant) => {
                    const grantStatus = seatGrantStatusPill(grant.status);
                    return (
                      <TableRow key={grant.id}>
                        <TableCell className="font-semibold tabular-nums">
                          {grant.totalSeats.toLocaleString("es-CO")}
                        </TableCell>
                        <TableCell className="text-[12.5px] text-muted-foreground">
                          {formatApiDate(grant.validFrom)}
                          {" → "}
                          {grant.validUntil
                            ? formatApiDate(grant.validUntil)
                            : "sin expiración"}
                        </TableCell>
                        <TableCell className="text-[12.5px]">
                          {grant.grantorOrganizationId ? "Partner" : "Klarimba"}
                        </TableCell>
                        <TableCell>
                          <StatusPill tone={grantStatus.tone}>
                            {grantStatus.label}
                          </StatusPill>
                        </TableCell>
                        <TableCell>
                          {grant.status === "ACTIVE" && (
                            <RevokeGrantButton
                              orgId={orgId}
                              grantId={grant.id}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <EnterpriseCard orgId={orgId} entitlements={entitlements} />
          <BootstrapAdminCard orgId={orgId} />
        </div>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[13.5px]">
            <ScrollText className="size-4 text-brand-mid" />
            Auditoría
          </CardTitle>
        </CardHeader>
        <CardContent>
          {auditLog.length === 0 ? (
            <p className="py-6 text-center text-[12.5px] text-muted-foreground">
              Sin eventos registrados.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evento</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Detalle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLog.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-[12.5px] font-semibold">
                      {AUDIT_LABELS[entry.eventType] ?? entry.eventType}
                    </TableCell>
                    <TableCell className="text-[12.5px] text-muted-foreground">
                      {formatApiDate(entry.createdAt)}
                    </TableCell>
                    <TableCell className="max-w-md truncate font-mono text-[11px] text-muted-foreground">
                      {entry.metadata ? JSON.stringify(entry.metadata) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
