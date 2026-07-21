import { Building2, Lock } from "lucide-react";
import Link from "next/link";
import {
  SeatUsageBar,
  SeatUsageCards,
} from "@/components/dashboard/seat-usage-card";
import { StatusPill, orgStatusPill } from "@/components/dashboard/status-pill";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
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
import type { OrgContext } from "@/lib/dashboard-context";
import { loadChildrenWithUsage } from "./portfolio-data";

/** Overview del partner: empresas del portfolio y licencias. */
export async function PortfolioOverview({ context }: { context: OrgContext }) {
  const [{ seatUsage }, children] = await Promise.all([
    getOrganizationSummary(context.org.id),
    loadChildrenWithUsage(context.org.id),
  ]);

  return (
    <>
      <PageHeader
        title="Overview del portfolio"
        description={`${context.org.name} · ${children.length} ${children.length === 1 ? "empresa afiliada" : "empresas afiliadas"}`}
      />

      <SeatUsageCards seatUsage={seatUsage} showChildren />

      <Card className="mt-4">
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle className="text-[13.5px]">
              Empresas del portfolio
            </CardTitle>
            <p className="mt-0.5 text-[11.5px] font-medium text-muted-foreground">
              Licencias asignadas y uso por empresa
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/org/${context.org.id}/companies`}>
              <Building2 />
              Gestionar empresas
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {children.length === 0 ? (
            <div className="py-10 text-center">
              <Building2 className="mx-auto mb-3 size-10 text-brand-mid" />
              <p className="text-sm font-bold">Aún no hay empresas</p>
              <p className="mx-auto mt-1 max-w-xs text-[12.5px] text-muted-foreground">
                Crea la primera empresa cliente de tu portfolio y asígnale
                licencias de tu bolsa.
              </p>
              <Button asChild size="sm" className="mt-4">
                <Link href={`/org/${context.org.id}/companies`}>
                  Crear empresa cliente
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Licencias (usadas / asignadas)</TableHead>
                  <TableHead>Estado</TableHead>
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
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusPill tone={status.tone}>{status.label}</StatusPill>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          <p className="mt-3 flex items-center gap-2 text-[11.5px] text-muted-foreground">
            <Lock className="size-3.5 shrink-0 text-brand-mid" />
            Como partner no accedes a miembros, equipos ni datos individuales
            de las empresas: solo estructura y licencias.
          </p>
        </CardContent>
      </Card>
    </>
  );
}

export function OrgMark({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
      {initial}
    </span>
  );
}
