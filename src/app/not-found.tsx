import Link from "next/link";
import { ErrorState } from "@/components/layout/error-state";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Página no encontrada" };

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center">
      <ErrorState
        title="Esta página no existe"
        description="El enlace puede estar mal escrito o apuntar a algo que ya se eliminó."
        actions={
          <Button asChild>
            <Link href="/">Ir al inicio</Link>
          </Button>
        }
      />
    </main>
  );
}
