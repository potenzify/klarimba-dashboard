"use client";

import { RotateCw } from "lucide-react";
import { useEffect } from "react";
import { ErrorState } from "@/components/layout/error-state";
import { Button } from "@/components/ui/button";

/**
 * Boundary del segmento raíz. Cubre lo que los `error.tsx` hijos no pueden: los
 * fallos de sus propios `layout.tsx` — en la práctica, el layout del dashboard
 * cuando el API no responde al resolver sesión y contextos.
 *
 * Existe además de `global-error.tsx` porque este sí se renderiza en el
 * servidor, dentro del layout raíz: el usuario ve la pantalla ya en el HTML
 * inicial, con las fuentes y estilos de la app. `global-error` solo monta en
 * cliente tras hidratar, y queda para el caso extremo de que falle el layout
 * raíz.
 */
export default function RootError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[root] error boundary", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center">
      <ErrorState
        title="No pudimos cargar la consola"
        description="No hay respuesta del API de Klarimba. Suele ser temporal: reintenta en unos segundos."
        digest={error.digest}
        actions={
          <>
            <Button onClick={() => unstable_retry()}>
              <RotateCw />
              Reintentar
            </Button>
            <Button variant="outline" asChild>
              <a href="/login">Iniciar sesión</a>
            </Button>
          </>
        }
      />
    </main>
  );
}
