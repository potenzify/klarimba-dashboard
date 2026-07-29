"use client";

import { RotateCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { ErrorState } from "@/components/layout/error-state";
import { Button } from "@/components/ui/button";

/**
 * Boundary de todas las vistas del dashboard. Cubre los fallos de los `page.tsx`
 * (API caído, SchemaMismatch, 5xx); los del propio `layout.tsx` de este segmento
 * suben a `global-error.tsx`.
 */
export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard] error boundary", error);
  }, [error]);

  return (
    <ErrorState
      title="No pudimos cargar esta vista"
      description="Puede ser un problema temporal del API de Klarimba. Reintenta; si sigue fallando, avisa al equipo con la referencia de abajo."
      digest={error.digest}
      actions={
        <>
          <Button onClick={() => unstable_retry()}>
            <RotateCw />
            Reintentar
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Ir al inicio</Link>
          </Button>
        </>
      }
    />
  );
}
