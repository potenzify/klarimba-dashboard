import { BarChart3, HeartPulse, Lock, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { SeatUsageCards } from "@/components/dashboard/seat-usage-card";
import { StatusPill } from "@/components/dashboard/status-pill";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getOrganizationSummary } from "@/lib/api/organizations";
import type { OrgContext } from "@/lib/dashboard-context";

/** Overview de empresa (Enterprise o People básico): solo bloque de accesos. */
export async function CompanyOverview({ context }: { context: OrgContext }) {
  const { seatUsage } = await getOrganizationSummary(context.org.id);
  const isBasic = context.mode === "peoplebasic";

  return (
    <>
      <PageHeader
        title="Overview"
        description={`Estado de accesos de ${context.org.name} · ${seatUsage.consumedSeats} de ${seatUsage.totalSeats} accesos usados`}
        actions={
          context.hasEnterprise ? (
            <StatusPill tone="purple">
              <Sparkles className="size-3" />
              Enterprise activo
            </StatusPill>
          ) : undefined
        }
      />

      <SeatUsageCards seatUsage={seatUsage} />

      {isBasic && (
        <>
          <div className="mt-7 mb-3 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
            Disponible con Klarimba Enterprise
          </div>
          <div className="grid grid-cols-3 gap-4 max-lg:grid-cols-1">
            {[
              {
                icon: HeartPulse,
                title: "Bienestar agregado",
                desc: "Tendencias por equipo y sede.",
              },
              {
                icon: Sparkles,
                title: "Klarimba Intelligence",
                desc: "Copiloto y programas IA.",
              },
              {
                icon: BarChart3,
                title: "Compliance Evidence",
                desc: "Reportes antes/después.",
              },
            ].map((item) => (
              <Card key={item.title} className="relative opacity-65">
                <Lock className="absolute top-4 right-4 size-4 text-muted-foreground" />
                <CardContent className="py-1">
                  <div className="flex items-center gap-2 text-[13.5px] font-bold">
                    <item.icon className="size-4 text-brand-mid" />
                    {item.title}
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {item.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-dark to-primary p-5 text-white shadow-lg">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase">
              <Sparkles className="size-3.5" />
              Añade Klarimba Enterprise
            </div>
            <p className="mt-3 max-w-xl text-sm font-medium leading-relaxed">
              Desbloquea métricas avanzadas, programas organizacionales,
              Klarimba Intelligence y evidencia de intervención para tu equipo.
            </p>
            <Button
              asChild
              size="sm"
              className="mt-4 bg-white text-brand-dark hover:bg-secondary dark:bg-white dark:text-[#4a2b73]"
            >
              <Link href={`/org/${context.org.id}/enterprise`}>
                Ver cómo activarlo
              </Link>
            </Button>
          </div>
        </>
      )}

      {!isBasic && (
        <p className="mt-5 flex items-center gap-2 text-[11.5px] text-muted-foreground">
          <ShieldCheck className="size-3.5 shrink-0 text-brand-mid" />
          Las métricas de engagement, bienestar y reportes se habilitarán en
          próximas fases. Hoy esta consola gestiona accesos y usuarios.
        </p>
      )}
    </>
  );
}
