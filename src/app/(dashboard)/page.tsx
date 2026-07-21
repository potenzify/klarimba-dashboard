import { Inbox } from "lucide-react";
import { redirect } from "next/navigation";
import { getDashboardContexts } from "@/lib/dashboard-context";

/** Entrada del dashboard: redirige al primer contexto disponible. */
export default async function DashboardHome() {
  const contexts = await getDashboardContexts();

  if (contexts.orgs.length > 0) {
    redirect(`/org/${contexts.orgs[0].org.id}`);
  }
  if (contexts.superAdmin) {
    redirect("/admin");
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <Inbox className="mb-3 size-10 text-brand-mid" />
      <h1 className="text-sm font-bold">No tienes consolas asignadas</h1>
      <p className="mt-1 max-w-xs text-[12.5px] leading-relaxed text-muted-foreground">
        Tu cuenta no administra ninguna organización. Si crees que es un
        error, contacta a tu administrador o al equipo de Klarimba.
      </p>
    </div>
  );
}
