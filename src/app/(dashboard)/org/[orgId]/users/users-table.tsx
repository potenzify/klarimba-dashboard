"use client";

import {
  Check,
  CheckCircle2,
  Copy,
  Loader2,
  Mail,
  MoreVertical,
  UserX,
  Users,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { StatusPill, userStatusPill } from "@/components/dashboard/status-pill";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import type {
  OrganizationUser,
  OrganizationUserStatus,
} from "@/lib/api/schemas";
import { formatApiDate, fullName } from "@/lib/format";
import { roleLabel } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/lib/action-result";
import {
  reactivateMemberAction,
  resendInvitationAction,
  revokeInvitationAction,
  revokeMemberAction,
} from "../actions";

const FILTERS: { label: string; value?: OrganizationUserStatus }[] = [
  { label: "Todos" },
  { label: "Activos", value: "ACTIVE" },
  { label: "Invitados", value: "INVITED" },
  { label: "Suspendidos", value: "SUSPENDED" },
  { label: "Revocados", value: "REVOKED" },
];

interface UsersTableProps {
  orgId: string;
  users: OrganizationUser[];
  allUsers: OrganizationUser[];
  activeFilter?: OrganizationUserStatus;
}

/** Copia al portapapeles; `false` si el navegador lo bloquea (contexto inseguro). */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function UsersTable({
  orgId,
  users,
  allUsers,
  activeFilter,
}: UsersTableProps) {
  const [confirmRevoke, setConfirmRevoke] = useState<OrganizationUser | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  function run(
    action: () => Promise<ActionResult>,
    successMessage: string,
  ) {
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

  const countFor = (value?: OrganizationUserStatus) =>
    value ? allUsers.filter((u) => u.status === value).length : allUsers.length;

  return (
    <Card>
      <CardContent>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {FILTERS.map((filter) => {
            const isActive = filter.value === activeFilter;
            const href = filter.value
              ? `/org/${orgId}/users?status=${filter.value}`
              : `/org/${orgId}/users`;
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
                {filter.label} · {countFor(filter.value)}
              </Link>
            );
          })}
        </div>

        {users.length === 0 ? (
          <div className="py-10 text-center">
            <Users className="mx-auto mb-3 size-10 text-brand-mid" />
            <p className="text-sm font-bold">
              {activeFilter ? "Nada con este estado" : "Aún no hay usuarios"}
            </p>
            <p className="mx-auto mt-1 max-w-xs text-[12.5px] text-muted-foreground">
              {activeFilter
                ? "Prueba con otro filtro."
                : "Invita a tu equipo por correo para empezar."}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Persona</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Desde</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const pill = userStatusPill(user.status);
                const name = user.user ? fullName(user.user) : (user.identifier ?? "—");
                const email = user.user?.email ?? user.identifier ?? "";
                const code = user.invitationCode ?? undefined;
                return (
                  <TableRow key={`${user.status}-${user.membershipId ?? user.invitationId ?? user.id}`}>
                    <TableCell>
                      <span className="flex items-center gap-2.5">
                        <Avatar className="size-7">
                          <AvatarFallback className="bg-secondary text-[11px] font-bold text-primary">
                            {name
                              .split(/\s+/)
                              .slice(0, 2)
                              .map((p) => p[0]?.toUpperCase())
                              .join("") || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] font-semibold">
                            {name}
                          </span>
                          {email && email !== name && (
                            <span className="block truncate text-[11.5px] text-muted-foreground">
                              {email}
                            </span>
                          )}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="text-[12.5px]">
                      {roleLabel(user.role)}
                    </TableCell>
                    <TableCell>
                      <StatusPill tone={pill.tone}>{pill.label}</StatusPill>
                    </TableCell>
                    <TableCell>
                      {code ? (
                        <CopyCodeButton code={code} onCopy={copyCode} />
                      ) : (
                        <span className="text-[12.5px] text-muted-foreground">
                          —
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-[12.5px] text-muted-foreground">
                      {formatApiDate(user.joinedAt ?? user.invitedAt)}
                    </TableCell>
                    <TableCell>
                      <RowActions
                        user={user}
                        disabled={isPending}
                        code={code}
                        onCopyCode={() => code && copyCode(code)}
                        onResend={() =>
                          run(
                            () =>
                              resendInvitationAction(orgId, user.invitationId!),
                            "Invitación reenviada",
                          )
                        }
                        onRevokeInvitation={() =>
                          run(
                            () =>
                              revokeInvitationAction(orgId, user.invitationId!),
                            "Invitación revocada",
                          )
                        }
                        onReactivate={() =>
                          run(
                            () =>
                              reactivateMemberAction(orgId, user.membershipId!),
                            "Acceso reactivado",
                          )
                        }
                        onRevokeMember={() => setConfirmRevoke(user)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Confirmación de revocación */}
      <Dialog
        open={confirmRevoke !== null}
        onOpenChange={(open) => !open && setConfirmRevoke(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Revocar acceso</DialogTitle>
            <DialogDescription>
              {confirmRevoke?.user
                ? `${fullName(confirmRevoke.user)} perderá el acceso a Klarimba People y su licencia quedará libre.`
                : "La persona perderá el acceso a Klarimba People."}
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
                if (target?.membershipId) {
                  run(
                    () => revokeMemberAction(orgId, target.membershipId!),
                    "Acceso revocado",
                  );
                }
              }}
            >
              {isPending && <Loader2 className="animate-spin" />}
              Revocar acceso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/**
 * Código de invitación con copia al portapapeles. Permite repartirlo a mano
 * (chat, teléfono) sin depender del correo que envía el API.
 */
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
  user,
  disabled,
  code,
  onCopyCode,
  onResend,
  onRevokeInvitation,
  onReactivate,
  onRevokeMember,
}: {
  user: OrganizationUser;
  disabled: boolean;
  code?: string;
  onCopyCode: () => void;
  onResend: () => void;
  onRevokeInvitation: () => void;
  onReactivate: () => void;
  onRevokeMember: () => void;
}) {
  const isInvited = user.status === "INVITED" && user.invitationId;
  const canReactivate =
    (user.status === "SUSPENDED" || user.status === "REVOKED") &&
    user.membershipId;
  const canRevoke = user.status === "ACTIVE" && user.membershipId;

  if (!isInvited && !canReactivate && !canRevoke) return null;

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
        {isInvited && (
          <>
            {code && (
              <DropdownMenuItem onSelect={onCopyCode}>
                <Copy />
                Copiar código
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={onResend}>
              <Mail />
              Reenviar invitación
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={onRevokeInvitation}>
              <XCircle />
              Revocar invitación
            </DropdownMenuItem>
          </>
        )}
        {canReactivate && (
          <DropdownMenuItem onSelect={onReactivate}>
            <CheckCircle2 />
            Reactivar acceso
          </DropdownMenuItem>
        )}
        {canRevoke && (
          <DropdownMenuItem variant="destructive" onSelect={onRevokeMember}>
            <UserX />
            Revocar acceso
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
