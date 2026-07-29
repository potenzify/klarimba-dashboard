import Link from "next/link";
import { ErrorState } from "@/components/layout/error-state";
import { Button } from "@/components/ui/button";

export const metadata = { title: "No encontrado" };

/**
 * Destino del `notFound()` que lanza `requireOrgContext` cuando la organización
 * no existe, no es tuya o no corresponde al modo de la vista. Se renderiza
 * dentro del layout del dashboard para no perder el sidebar ni el switcher.
 */
export default function DashboardNotFound() {
  return (
    <ErrorState
      title="No encontramos esto"
      description="La organización no existe, ya no tienes acceso o esta vista no aplica a tu tipo de cuenta. Usa el selector de la barra lateral para cambiar de contexto."
      actions={
        <Button asChild>
          <Link href="/">Ir al inicio</Link>
        </Button>
      }
    />
  );
}
