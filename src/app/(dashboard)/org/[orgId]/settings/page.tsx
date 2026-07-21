import { PageHeader } from "@/components/layout/page-header";
import { StatusPill, orgStatusPill } from "@/components/dashboard/status-pill";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { can } from "@/lib/permissions";
import { requireOrgContext } from "@/lib/dashboard-context";
import { modeKicker } from "@/lib/navigation";
import { SettingsForm } from "./settings-form";

interface SettingsPageProps {
  params: Promise<{ orgId: string }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { orgId } = await params;
  const context = await requireOrgContext(orgId, ["company", "portfolio"]);
  const canManage = can(context.role, "MANAGE_ORGANIZATION");
  const status = orgStatusPill(context.org.status);

  return (
    <>
      <PageHeader
        title="Configuración"
        description={`Datos de la organización · ${context.org.name}`}
      />

      <div className="grid max-w-3xl gap-4">
        <SettingsForm
          orgId={orgId}
          currentName={context.org.name}
          canManage={canManage}
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-[13.5px]">Detalles</CardTitle>
          </CardHeader>
          <CardContent className="text-[13px]">
            <dl>
              <div className="flex items-center justify-between border-b py-2.5">
                <dt className="text-muted-foreground">Identificador (slug)</dt>
                <dd className="font-mono text-xs font-semibold">
                  {context.org.slug}
                </dd>
              </div>
              <div className="flex items-center justify-between border-b py-2.5">
                <dt className="text-muted-foreground">Tipo de organización</dt>
                <dd className="font-semibold">{modeKicker(context.mode)}</dd>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-muted-foreground">Estado</dt>
                <dd>
                  <StatusPill tone={status.tone}>{status.label}</StatusPill>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <p className="text-[11.5px] text-muted-foreground">
          Integraciones (SSO, HRIS, importación CSV) y opciones de privacidad
          llegarán en próximas fases.
        </p>
      </div>
    </>
  );
}
