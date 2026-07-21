import Link from "next/link";
import { StatusPill, orgStatusPill } from "@/components/dashboard/status-pill";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listBackofficeOrganizations } from "@/lib/api/backoffice";
import { formatApiDate } from "@/lib/format";
import { CreateClientDialog } from "../create-client-dialog";

export default async function PartnersPage() {
  const partners = await listBackofficeOrganizations({
    type: "PARTNER",
    limit: 100,
  });

  return (
    <>
      <PageHeader
        title="Partners"
        description="ARL, aseguradoras y cajas de compensación"
        actions={<CreateClientDialog fixedType="PARTNER" />}
      />
      <Card>
        <CardContent>
          {partners.length === 0 ? (
            <p className="py-8 text-center text-[12.5px] text-muted-foreground">
              Aún no hay partners registrados.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner</TableHead>
                  <TableHead>Identificador</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partners.map((org) => {
                  const status = orgStatusPill(org.status);
                  return (
                    <TableRow key={org.id} className="relative">
                      <TableCell className="font-semibold">
                        <Link
                          href={`/admin/clients/${org.id}`}
                          className="flex items-center gap-2.5 after:absolute after:inset-0"
                        >
                          <span className="flex size-7 items-center justify-center rounded-lg bg-brand-dark text-xs font-bold text-primary-foreground">
                            {org.name.charAt(0).toUpperCase()}
                          </span>
                          {org.name}
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {org.slug}
                      </TableCell>
                      <TableCell className="text-[12.5px] text-muted-foreground">
                        {formatApiDate(org.createdAt)}
                      </TableCell>
                      <TableCell>
                        <StatusPill tone={status.tone}>{status.label}</StatusPill>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          <p className="mt-3 text-[11.5px] text-muted-foreground">
            El pricing partner es privado, por contrato. Los grants de accesos
            se gestionan en el detalle de cada partner.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
