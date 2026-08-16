"use client";

import {
  Check,
  Copy,
  Loader2,
  Mail,
  MoreVertical,
  Ticket,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  StatusPill,
  invitationStatusPill,
} from "@/components/dashboard/status-pill";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Invitation, InvitationStatus } from "@/lib/api/schemas";
import { copyToClipboard } from "@/lib/clipboard";
import { formatApiDate, parseApiDate } from "@/lib/format";
import { roleLabel } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/lib/action-result";
import { resendInvitationAction, revokeInvitationAction } from "../actions";

const FILTERS: { label: string; value?: InvitationStatus }[] = [
  { label: "Todas" },
  { label: "Activas", value: "ACTIVE" },
  { label: "Canjeadas", value: "EXHAUSTED" },
  { label: "Expiradas", value: "EXPIRED" },
  { label: "Revocadas", value: "REVOKED" },
];

/** Totales por estado (sondas al API); `null` si el API no informa totales. */
export type InvitationStatusCounts = Record<
  "ALL" | InvitationStatus,
  number | null
>;

interface InvitationsTableProps {
  orgId: string;
  invitations: Invitation[];
  counts: InvitationStatusCounts;
  activeFilter?: InvitationStatus;
}

/**
 * Estado a mostrar. El API no tiene job que marque EXPIRED: una ACTIVE con
 * `expiresAt` vencido ya no se puede canjear, así que se pinta como expirada
 * (mismo criterio que el filtro `?status=` del listado).
 */
export function resolveInvitationStatus(
  invitation: Invitation,
  now: Date = new Date(),
): InvitationStatus {
  if (invitation.status !== "ACTIVE") return invitation.status;
  const expiresAt = parseApiDate(invitation.expiresAt);
  return expiresAt && expiresAt <= now ? "EXPIRED" : "ACTIVE";
}

export type InvitationKind = "personal" | "bearer" | "shared";

/** Tipo funcional: personal con destinatario, "al portador" o compartida. */
export function invitationKind(invitation: Invitation): InvitationKind {
  if (invitation.type === "SHARED_CODE") return "shared";
  return invitation.identifier ? "personal" : "bearer";
}

/** Etiqueta y explicación de cada tipo, para la columna y su tooltip. */
export const INVITATION_KINDS: Record<
  InvitationKind,
  { label: string; hint: string }
> = {
  personal: {
    label: "Personal",
    hint: "Atada a un correo concreto: solo esa persona puede canjearla y la app le pre-llena el correo al registrarse.",
  },
  bearer: {
    label: "Al portador",
    hint: "Sin destinatario: la canjea quien tenga el código, una sola vez, con el correo que elija.",
  },
  shared: {
    label: "Compartida",
    hint: "Un mismo código para varias personas, hasta agotar los canjes.",
  },
};

/** Etiqueta de tipo: personal con destinatario, "al portador" o compartida. */
export function invitationKindLabel(invitation: Invitation): string {
  return INVITATION_KINDS[invitationKind(invitation)].label;
}

function redemptionsLabel(invitation: Invitation): string {
  const max =
    invitation.type === "PERSONAL" ? 1 : (invitation.maxRedemptions ?? null);
  return max === null
    ? `${invitation.redemptionsCount} / ∞`
    : `${invitation.redemptionsCount} / ${max}`;
}

export function InvitationsTable({
  orgId,
  invitations,
  counts,
  activeFilter,
}: InvitationsTableProps) {
  const [confirmRevoke, setConfirmRevoke] = useState<Invitation | null>(null);
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<ActionResult>, successMessage: string) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) toast.success(successMessage);
      else toast.error(result.error);
    });
  }

  async function copyCode(code: string) {
    const copied = await copyToClipboard(code);
    if (copied) toast.success(`Código ${code} copiado`);
    else toast.error(`No se pudo copiar. El código es ${code}`);
  }

  const countFor = (value?: InvitationStatus) => counts[value ?? "ALL"];

  return (
    <TooltipProvider>
      <Card>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {FILTERS.map((filter) => {
              const isActive = filter.value === activeFilter;
              // Cambiar de filtro siempre vuelve a la página 1 (sin `?page=`).
              const href = filter.value
                ? `/org/${orgId}/invitations?status=${filter.value}`
                : `/org/${orgId}/invitations`;
              const count = countFor(filter.value);
              return (
                <Link
                  key={filter.label}
                  href={href}
                  className={cn(
                    "rounded-full px-3 py-1 text-[11.5px] font-semibold transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-secondary hover:text-secondary-foreground",
                  )}
                >
                  {filter.label}
                  {count !== null && ` · ${count}`}
                </Link>
              );
            })}
          </div>

          {invitations.length === 0 ? (
            <div className="py-10 text-center">
              <Ticket className="mx-auto mb-3 size-10 text-brand-mid" />
              <p className="text-sm font-bold">
                {activeFilter
                  ? "Nada con este estado"
                  : "Aún no hay invitaciones"}
              </p>
              <p className="mx-auto mt-1 max-w-xs text-[12.5px] text-muted-foreground">
                {activeFilter
                  ? "Prueba con otro filtro."
                  : "Invita por correo o genera códigos para repartir."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Canjes</TableHead>
                  <TableHead>Caduca</TableHead>
                  <TableHead>Creada</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => {
                  const status = resolveInvitationStatus(invitation);
                  const pill = invitationStatusPill(status);
                  const canResend =
                    status === "ACTIVE" &&
                    invitation.identifierType === "EMAIL" &&
                    Boolean(invitation.identifier);
                  return (
                    <TableRow key={invitation.id}>
                      <TableCell>
                        <CopyCodeButton
                          code={invitation.code}
                          onCopy={copyCode}
                        />
                      </TableCell>
                      <TableCell>
                        <KindLabel kind={invitationKind(invitation)} />
                        {invitation.identifier && (
                          <span className="block max-w-56 truncate text-[11.5px] text-muted-foreground">
                            {invitation.identifier}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-[12.5px]">
                        {roleLabel(invitation.roleToGrant)}
                      </TableCell>
                      <TableCell>
                        <StatusPill tone={pill.tone}>{pill.label}</StatusPill>
                      </TableCell>
                      <TableCell className="text-[12.5px] tabular-nums">
                        {redemptionsLabel(invitation)}
                      </TableCell>
                      <TableCell className="text-[12.5px] text-muted-foreground">
                        {invitation.expiresAt
                          ? formatApiDate(invitation.expiresAt)
                          : "Sin caducidad"}
                      </TableCell>
                      <TableCell className="text-[12.5px] text-muted-foreground">
                        {formatApiDate(invitation.createdAt)}
                      </TableCell>
                      <TableCell>
                        <RowActions
                          disabled={isPending}
                          canRevoke={status === "ACTIVE"}
                          canResend={canResend}
                          onCopyCode={() => copyCode(invitation.code)}
                          onResend={() =>
                            run(
                              () =>
                                resendInvitationAction(orgId, invitation.id),
                              "Invitación reenviada",
                            )
                          }
                          onRevoke={() => setConfirmRevoke(invitation)}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>

        {/* Confirmación de revocación: el código deja de ser canjeable */}
        <Dialog
          open={confirmRevoke !== null}
          onOpenChange={(open) => !open && setConfirmRevoke(null)}
        >
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Revocar código</DialogTitle>
              <DialogDescription>
                El código{" "}
                <span className="font-mono font-bold">
                  {confirmRevoke?.code}
                </span>{" "}
                dejará de ser canjeable. Quien ya lo canjeó conserva su acceso.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmRevoke(null)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                disabled={isPending}
                onClick={() => {
                  const target = confirmRevoke;
                  setConfirmRevoke(null);
                  if (target) {
                    run(
                      () => revokeInvitationAction(orgId, target.id),
                      "Invitación revocada",
                    );
                  }
                }}
              >
                {isPending && <Loader2 className="animate-spin" />}
                Revocar código
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
    </TooltipProvider>
  );
}

/** Tipo de invitación con explicación al pasar el ratón / enfocar. */
function KindLabel({ kind }: { kind: InvitationKind }) {
  const { label, hint } = INVITATION_KINDS[kind];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className="inline-block cursor-help text-[12.5px] font-semibold underline decoration-dotted decoration-muted-foreground/60 underline-offset-2"
        >
          {label}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-64 text-[11.5px]">
        {hint}
      </TooltipContent>
    </Tooltip>
  );
}

function CopyCodeButton({
  code,
  onCopy,
}: {
  code: string;
  onCopy: (code: string) => void | Promise<void>;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        await onCopy(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      title="Copiar código"
      aria-label={`Copiar código de invitación ${code}`}
      className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 font-mono text-[11.5px] font-bold tracking-wider transition-colors hover:bg-secondary hover:text-secondary-foreground"
    >
      {code}
      {copied ? (
        <Check className="size-3.5 text-brand-mid" />
      ) : (
        <Copy className="size-3.5 text-muted-foreground" />
      )}
    </button>
  );
}

function RowActions({
  disabled,
  canRevoke,
  canResend,
  onCopyCode,
  onResend,
  onRevoke,
}: {
  disabled: boolean;
  canRevoke: boolean;
  canResend: boolean;
  onCopyCode: () => void;
  onResend: () => void;
  onRevoke: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={disabled}
          aria-label="Acciones"
        >
          <MoreVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        <DropdownMenuItem onSelect={onCopyCode}>
          <Copy />
          Copiar código
        </DropdownMenuItem>
        {canResend && (
          <DropdownMenuItem onSelect={onResend}>
            <Mail />
            Reenviar por correo
          </DropdownMenuItem>
        )}
        {canRevoke && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={onRevoke}>
              <XCircle />
              Revocar código
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
