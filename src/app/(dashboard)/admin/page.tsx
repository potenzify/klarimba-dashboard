import { Building2, CheckCircle2, Shield, Users2 } from "lucide-react";
import Link from "next/link";
import { StatusPill, orgStatusPill } from "@/components/dashboard/status-pill";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  countBackofficeOrganizations,
  listBackofficeOrganizations,
} from "@/lib/api/backoffice";
import { formatApiDate } from "@/lib/format";
import { CreateClientDialog } from "./create-client-dialog";

export default async function AdminOverviewPage() {
  // KPIs por totales del API (sondas `limit=1`) y altas recientes de la
  // primera página (el listado viene en DESC). Antes se traían 100 filas y se
  // contaba en memoria: con >100 clientes los KPIs mentían en silencio.
  const [{ items: recent }, total, partnerCount, activeCount] =
    await Promise.all([
      listBackofficeOrganizations({ limit: 5 }),
      countBackofficeOrganizations(),
      countBackofficeOrganizations({ type: "PARTNER" }),
      countBackofficeOrganizations({ status: "ACTIVE" }),
    ]);

  const tenantCount =
    total !== null && partnerCount !== null ? total - partnerCount : null;

  const kpis = [
    { label: "Clientes totales", value: total, icon: Users2 },
    { label: "Partners / ARL", value: partnerCount, icon: Shield },
    { label: "Empresas directas", value: tenantCount, icon: Building2 },
    { label: "Activos", value: activeCount, icon: CheckCircle2 },
  ];

  return (
    <>
      <PageHeader
        title="Overview de la plataforma"
        description="Klarimba · operación de clientes, partners y empresas directas"
        actions={<CreateClientDialog />}
      />

      <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-md:grid-cols-1">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="py-1">
              <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-muted-foreground">
                <kpi.icon className="size-3.5 text-brand-mid" />
                {kpi.label}
              </div>
              <div className="mt-2 text-[27px] font-bold leading-none tracking-tight">
                {kpi.value ?? "—"}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-4">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-[13.5px]">Altas recientes</CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/clients">Ver todos los clientes</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="py-6 text-center text-[12.5px] text-muted-foreground">
              Aún no hay organizaciones en la plataforma.
            </p>
          ) : (
            <div>
              {recent.map((org) => {
                const status = orgStatusPill(org.status);
                return (
                  <Link
                    key={org.id}
                    href={`/admin/clients/${org.id}`}
                    className="flex items-center justify-between gap-3 border-b py-2.5 transition-colors last:border-b-0 hover:bg-secondary/50"
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="flex size-8 items-center justify-center rounded-lg bg-secondary text-xs font-bold text-primary">
                        {org.name.charAt(0).toUpperCase()}
                      </span>
                      <span>
                        <span className="block text-[13px] font-semibold">
                          {org.name}
                        </span>
                        <span className="block text-[11.5px] text-muted-foreground">
                          {org.type === "PARTNER" ? "Partner" : "Empresa"} ·
                          creado el {formatApiDate(org.createdAt)}
                        </span>
                      </span>
                    </span>
                    <StatusPill tone={status.tone}>{status.label}</StatusPill>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="mt-4 text-[11.5px] text-muted-foreground">
        Toda acción del backoffice queda registrada en la auditoría de cada
        organización.
      </p>
    </>
  );
}
