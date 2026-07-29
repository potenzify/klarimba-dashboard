import Link from "next/link";
import { StatusPill, orgStatusPill } from "@/components/dashboard/status-pill";
import { TruncationNotice } from "@/components/dashboard/truncation-notice";
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
import { organizationTypeSchema } from "@/lib/api/schemas";
import { formatApiDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CreateClientDialog } from "../create-client-dialog";

const FILTERS = [
  { label: "Todos", value: undefined },
  { label: "Empresas", value: "TENANT" as const },
  { label: "Partners", value: "PARTNER" as const },
];

interface ClientsPageProps {
  searchParams: Promise<{ type?: string }>;
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const { type } = await searchParams;
  const typeFilter = organizationTypeSchema.safeParse(type).data;
  const organizations = await listBackofficeOrganizations({
    type: typeFilter,
    limit: 100,
  });

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Todas las organizaciones de la plataforma · partners y empresas directas"
        actions={<CreateClientDialog />}
      />
      <Card>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {FILTERS.map((filter) => {
              const isActive = filter.value === typeFilter;
              return (
                <Link
                  key={filter.label}
                  href={
                    filter.value
                      ? `/admin/clients?type=${filter.value}`
                      : "/admin/clients"
                  }
                  className={cn(
                    "rounded-full px-3 py-1 text-[11.5px] font-semibold transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-secondary hover:text-secondary-foreground",
                  )}
                >
                  {filter.label}
                </Link>
              );
            })}
          </div>
          {organizations.length === 0 ? (
            <p className="py-8 text-center text-[12.5px] text-muted-foreground">
              No hay organizaciones con este filtro.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Identificador</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.map((org) => {
                  const status = orgStatusPill(org.status);
                  return (
                    <TableRow key={org.id} className="relative">
                      <TableCell className="font-semibold">
                        <Link
                          href={`/admin/clients/${org.id}`}
                          className="flex items-center gap-2.5 after:absolute after:inset-0"
                        >
                          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
                            {org.name.charAt(0).toUpperCase()}
                          </span>
                          {org.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <StatusPill
                          tone={org.type === "PARTNER" ? "purple" : "green"}
                        >
                          {org.type === "PARTNER" ? "Partner" : "Empresa"}
                        </StatusPill>
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
        </CardContent>
      </Card>
      <TruncationNotice
        count={organizations.length}
        limit={100}
        noun="organizaciones"
      />
    </>
  );
}
