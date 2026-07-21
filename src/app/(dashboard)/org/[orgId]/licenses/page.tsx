import { Info } from "lucide-react";
import {
  SeatUsageBar,
  SeatUsageCards,
} from "@/components/dashboard/seat-usage-card";
import { StatusPill, orgStatusPill } from "@/components/dashboard/status-pill";
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
import { getOrganizationSummary } from "@/lib/api/organizations";
import { requireOrgContext } from "@/lib/dashboard-context";
import { OrgMark } from "../portfolio-overview";
import { loadChildrenWithUsage } from "../portfolio-data";
import { AllocateSeatsDialog } from "../companies/allocate-seats-dialog";

interface LicensesPageProps {
  params: Promise<{ orgId: string }>;
}

/** Bolsa del partner y reparto de licencias por empresa hija. */
export default async function LicensesPage({ params }: LicensesPageProps) {
  const { orgId } = await params;
  const context = await requireOrgContext(orgId, ["portfolio"]);

  const [{ seatUsage }, children] = await Promise.all([
    getOrganizationSummary(orgId),
    loadChildrenWithUsage(orgId),
  ]);

  return (
    <>
      <PageHeader
        title="Licencias y accesos"
        description={`${context.org.name} · bolsa de accesos del contrato partner`}
      />

      <SeatUsageCards seatUsage={seatUsage} showChildren />

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-[13.5px]">Reparto por empresa</CardTitle>
        </CardHeader>
        <CardContent>
          {children.length === 0 ? (
            <p className="py-6 text-center text-[12.5px] text-muted-foreground">
              Crea empresas en tu portfolio para repartir accesos.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Usados / asignados</TableHead>
                  <TableHead>Disponibles</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-36" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {children.map(({ org, seatUsage: usage }) => {
                  const status = orgStatusPill(org.status);
                  return (
                    <TableRow key={org.id}>
                      <TableCell className="font-semibold">
                        <span className="flex items-center gap-2.5">
                          <OrgMark name={org.name} />
                          {org.name}
                        </span>
                      </TableCell>
                      <TableCell>
                        {usage ? (
                          <SeatUsageBar
                            used={usage.consumedSeats}
                            total={usage.totalSeats}
                          />
                        ) : (
                          <span className="text-[12.5px] text-muted-foreground">
                            Sin accesos asignados
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-[12.5px] tabular-nums">
                        {usage ? usage.availableSeats.toLocaleString("es-CO") : "—"}
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
            El reparto es a nivel de empresa completa y descuenta de tu bolsa.
            El API valida el cupo disponible al asignar.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
