import { Check, Mail, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOrganizationSummary } from "@/lib/api/organizations";
import { requireOrgContext } from "@/lib/dashboard-context";

const BENEFITS = [
  "Métricas avanzadas de bienestar agregado",
  "Sedes, áreas y managers con scope",
  "Klarimba Intelligence y programas organizacionales",
  "Compliance Evidence y reportes antes/después",
  "Roles operativos con scope incluidos por volumen",
];

/**
 * Upsell de Enterprise (People básico). No hay checkout self-service:
 * la activación es manual vía backoffice → CTA de contacto con ventas.
 */
export default async function EnterpriseUpsellPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  await requireOrgContext(orgId, ["peoplebasic"]);
  const { seatUsage } = await getOrganizationSummary(orgId);

  return (
    <>
      <PageHeader
        title="Añadir Klarimba Enterprise"
        description="Convierte tu consola básica en una plataforma organizacional completa"
      />
      <div className="grid max-w-4xl grid-cols-2 items-start gap-4 max-lg:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle className="text-[13.5px]">Qué desbloqueas</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col">
              {BENEFITS.map((benefit) => (
                <li
                  key={benefit}
                  className="flex items-center gap-2.5 py-2 text-[13px]"
                >
                  <Check className="size-4 shrink-0 text-success" />
                  {benefit}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-[13.5px]">
              Tu situación
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                add-on
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between border-b py-2.5 text-[13px]">
              <span className="text-muted-foreground">Accesos contratados</span>
              <b>{seatUsage.totalSeats.toLocaleString("es-CO")}</b>
            </div>
            <div className="flex items-center justify-between border-b py-2.5 text-[13px]">
              <span className="text-muted-foreground">Accesos en uso</span>
              <b>{seatUsage.consumedSeats.toLocaleString("es-CO")}</b>
            </div>
            <div className="flex items-center justify-between py-2.5 text-[13px]">
              <span className="text-muted-foreground">Enterprise</span>
              <b>No activo</b>
            </div>
            <Button asChild className="mt-3 w-full">
              <a href="mailto:ventas@klarimba.com?subject=Activar%20Klarimba%20Enterprise">
                <Mail />
                Contactar a ventas
              </a>
            </Button>
            <p className="mt-3 flex items-start gap-2 text-[11.5px] leading-relaxed text-muted-foreground">
              <Sparkles className="mt-0.5 size-3.5 shrink-0 text-brand-mid" />
              La activación del add-on la realiza el equipo de Klarimba. Al
              activarse, esta consola se convierte automáticamente en la
              versión Enterprise.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
