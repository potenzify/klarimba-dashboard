import { KeyRound, UserCheck, Users2, Warehouse } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { SeatUsage } from "@/lib/api/schemas";
import { cn } from "@/lib/utils";

interface SeatUsageCardsProps {
  seatUsage: SeatUsage;
  /** Muestra la fila "Asignados a empresas" (solo tiene sentido en partners). */
  showChildren?: boolean;
}

/** Bloque de accesos del Overview (único KPI con respaldo en fase 1). */
export function SeatUsageCards({ seatUsage, showChildren }: SeatUsageCardsProps) {
  const kpis = [
    {
      label: "Accesos contratados",
      value: seatUsage.totalSeats,
      icon: KeyRound,
      hint: "bolsa activa",
    },
    {
      label: "Accesos usados",
      value: seatUsage.consumedSeats,
      icon: UserCheck,
      hint: pct(seatUsage.consumedSeats, seatUsage.totalSeats),
    },
    ...(showChildren
      ? [
          {
            label: "Asignados a empresas",
            value: seatUsage.allocatedToChildren,
            icon: Warehouse,
            hint: pct(seatUsage.allocatedToChildren, seatUsage.totalSeats),
          },
        ]
      : []),
    {
      label: "Disponibles",
      value: seatUsage.availableSeats,
      icon: Users2,
      hint: "por asignar",
    },
  ];

  return (
    <div
      className={cn(
        "grid gap-4 max-md:grid-cols-1",
        kpis.length === 4 ? "grid-cols-4 max-lg:grid-cols-2" : "grid-cols-3 max-lg:grid-cols-2",
      )}
    >
      {kpis.map((kpi) => (
        <Card key={kpi.label}>
          <CardContent className="px-4.5 py-1">
            <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-muted-foreground">
              <kpi.icon className="size-3.5 text-brand-mid" />
              {kpi.label}
            </div>
            <div className="mt-2 text-[27px] font-bold leading-none tracking-tight">
              {kpi.value.toLocaleString("es-CO")}
            </div>
            <div className="mt-1.5 text-[11.5px] font-semibold text-muted-foreground">
              {kpi.hint}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function pct(value: number, total: number): string {
  if (total <= 0) return "—";
  return `${Math.round((value / total) * 100)}% del total`;
}

/** Barra fina de progreso de uso (estilo mini-track del mockup). */
export function SeatUsageBar({
  used,
  total,
  className,
}: {
  used: number;
  total: number;
  className?: string;
}) {
  const ratio = total > 0 ? Math.min(used / total, 1) : 0;
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="inline-block h-1.5 w-[70px] overflow-hidden rounded-full bg-secondary align-middle">
        <span
          className="block h-full rounded-full bg-gradient-to-r from-brand-mid to-primary"
          style={{ width: `${ratio * 100}%` }}
        />
      </span>
      <span className="text-[12.5px] tabular-nums">
        {used.toLocaleString("es-CO")} / {total.toLocaleString("es-CO")}
      </span>
    </span>
  );
}
