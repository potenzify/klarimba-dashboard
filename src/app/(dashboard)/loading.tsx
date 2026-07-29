import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Fallback de navegación para todas las vistas del dashboard. Neutro a
 * propósito (cabecera + tarjetas + bloque de contenido): sirve igual a las
 * vistas de tarjetas que a las de tabla, sin prometer una estructura que la
 * página luego no tenga.
 *
 * Solo aparece al navegar entre vistas; en la primera carga el `layout.tsx` de
 * este segmento resuelve sesión y contextos antes, y Next no muestra fallback
 * para el layout del propio segmento.
 */
export default function DashboardLoading() {
  return (
    <div aria-busy="true" aria-label="Cargando">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-52" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="space-y-2.5">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-7 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="space-y-3">
          <Skeleton className="h-8 w-full" />
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-11 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
