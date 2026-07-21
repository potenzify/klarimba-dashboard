import { Building2, Info } from "lucide-react";
import { SeatUsageBar } from "@/components/dashboard/seat-usage-card";
import { StatusPill, orgStatusPill } from "@/components/dashboard/status-pill";
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
import { requireOrgContext } from "@/lib/dashboard-context";
import { OrgMark } from "../portfolio-overview";
import { loadChildrenWithUsage } from "../portfolio-data";
import { AllocateSeatsDialog } from "./allocate-seats-dialog";
import { CreateCompanyDialog } from "./create-company-dialog";

interface CompaniesPageProps {
  params: Promise<{ orgId: string }>;
}

export default async function CompaniesPage({ params }: CompaniesPageProps) {
  const { orgId } = await params;
  const context = await requireOrgContext(orgId, ["portfolio"]);
  const children = await loadChildrenWithUsage(orgId);

  return (
    <>
      <PageHeader
        title="Empresas"
        description={`${context.org.name} · gestiona las empresas cliente de tu portfolio`}
        actions={<CreateCompanyDialog parentOrgId={orgId} />}
      />

      <Card>
        <CardContent>
          {children.length === 0 ? (
            <div className="py-10 text-center">
              <Building2 className="mx-auto mb-3 size-10 text-brand-mid" />
              <p className="text-sm font-bold">Aún no hay empresas afiliadas</p>
              <p className="mx-auto mt-1 max-w-xs text-[12.5px] text-muted-foreground">
                Da de alta la primera organización cliente de tu portfolio.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Identificador</TableHead>
                  <TableHead>Licencias (usadas / asignadas)</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-36" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {children.map(({ org, seatUsage }) => {
                  const status = orgStatusPill(org.status);
                  return (
                    <TableRow key={org.id}>
                      <TableCell className="font-semibold">
                        <span className="flex items-center gap-2.5">
                          <OrgMark name={org.name} />
                          {org.name}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {org.slug}
                      </TableCell>
                      <TableCell>
                        {seatUsage ? (
                          <SeatUsageBar
                            used={seatUsage.consumedSeats}
                            total={seatUsage.totalSeats}
                          />
                        ) : (
                          <span className="text-[12.5px] text-muted-foreground">
                            Sin accesos asignados
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusPill tone={status.tone}>{status.label}</StatusPill>
                      </TableCell>
                      <TableCell>
                        <AllocateSeatsDialog
                          parentOrgId={orgId}
                          childOrgId={org.id}
                          childName={org.name}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          <p className="mt-3 flex items-center gap-2 text-[11.5px] text-muted-foreground">
            <Info className="size-3.5 shrink-0 text-brand-mid" />
            El primer administrador de cada empresa lo activa hoy el equipo de
            Klarimba (backoffice). Tú gestionas estructura y licencias.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
