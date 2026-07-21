"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  UserPlus,
  XCircle,
} from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { StatusPill } from "@/components/dashboard/status-pill";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OrganizationEntitlement } from "@/lib/api/schemas";
import { formatApiDate } from "@/lib/format";
import {
  bootstrapAdminAction,
  createGrantAction,
  grantEnterpriseAction,
  revokeEnterpriseAction,
  revokeGrantAction,
  updateClientAction,
} from "../../actions";

// ---------------------------------------------------------------------------
// Editar cliente (nombre / estado)
// ---------------------------------------------------------------------------

const editClientSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres").max(255),
  status: z.enum(["ACTIVE", "SUSPENDED", "ARCHIVED"]),
});
type EditClientValues = z.infer<typeof editClientSchema>;

export function EditClientDialog({
  orgId,
  currentName,
  currentStatus,
}: {
  orgId: string;
  currentName: string;
  currentStatus: "ACTIVE" | "SUSPENDED" | "ARCHIVED";
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const form = useForm<EditClientValues>({
    resolver: zodResolver(editClientSchema),
    defaultValues: { name: currentName, status: currentStatus },
  });

  function onSubmit(values: EditClientValues) {
    startTransition(async () => {
      const result = await updateClientAction({ orgId, ...values });
      if (result.ok) {
        toast.success("Cliente actualizado");
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Editar cliente</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
          noValidate
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-name">Nombre</Label>
            <Input
              id="edit-name"
              aria-invalid={Boolean(form.formState.errors.name)}
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label>Estado</Label>
            <Select
              value={form.watch("status")}
              onValueChange={(value) =>
                form.setValue("status", value as EditClientValues["status"], {
                  shouldDirty: true,
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Activa</SelectItem>
                <SelectItem value="SUSPENDED">Suspendida</SelectItem>
                <SelectItem value="ARCHIVED">Archivada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Grants de accesos
// ---------------------------------------------------------------------------

const grantSchema = z.object({
  totalSeats: z
    .number({ message: "Ingresa un número" })
    .int("Debe ser un número entero")
    .min(1, "Mínimo 1 acceso"),
  notes: z.string().max(1000).optional(),
});
type GrantValues = z.infer<typeof grantSchema>;

export function GrantSeatsDialog({ orgId }: { orgId: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const form = useForm<GrantValues>({
    resolver: zodResolver(grantSchema),
    defaultValues: { totalSeats: 100, notes: "" },
  });

  function onSubmit(values: GrantValues) {
    startTransition(async () => {
      const result = await createGrantAction({
        orgId,
        totalSeats: values.totalSeats,
        notes: values.notes || undefined,
      });
      if (result.ok) {
        toast.success("Grant creado");
        setOpen(false);
        form.reset();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus />
          Nuevo grant
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Nuevo grant de accesos</DialogTitle>
          <DialogDescription>
            Concede una bolsa de accesos a este cliente. Si ya tiene un grant
            activo, el API lo indicará.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
          noValidate
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="grant-seats">Número de accesos</Label>
            <Input
              id="grant-seats"
              type="number"
              min={1}
              aria-invalid={Boolean(form.formState.errors.totalSeats)}
              {...form.register("totalSeats", { valueAsNumber: true })}
            />
            {form.formState.errors.totalSeats && (
              <p className="text-xs text-destructive">
                {form.formState.errors.totalSeats.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="grant-notes">Notas (opcional)</Label>
            <Input
              id="grant-notes"
              placeholder="Ej. Contrato anual 2026"
              {...form.register("notes")}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              Crear grant
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function RevokeGrantButton({
  orgId,
  grantId,
}: {
  orgId: string;
  grantId: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Revocar grant"
          className="text-destructive"
        >
          <XCircle />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Revocar grant</DialogTitle>
          <DialogDescription>
            La organización perderá esta bolsa de accesos. Esta acción queda en
            la auditoría.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                const result = await revokeGrantAction(orgId, grantId);
                if (result.ok) {
                  toast.success("Grant revocado");
                  setOpen(false);
                } else {
                  toast.error(result.error);
                }
              })
            }
          >
            {isPending && <Loader2 className="animate-spin" />}
            Revocar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Add-on Enterprise
// ---------------------------------------------------------------------------

export function EnterpriseCard({
  orgId,
  entitlements,
}: {
  orgId: string;
  entitlements: OrganizationEntitlement[];
}) {
  const [isPending, startTransition] = useTransition();
  const active = entitlements.find(
    (e) => e.product === "ENTERPRISE" && e.status === "ACTIVE",
  );

  function run(action: () => Promise<{ ok: boolean; error?: string }>, msg: string) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) toast.success(msg);
      else toast.error(result.error ?? "Error");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[13.5px]">
          <Sparkles className="size-4 text-brand-mid" />
          Add-on Enterprise
        </CardTitle>
      </CardHeader>
      <CardContent>
        {active ? (
          <>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-muted-foreground">Estado</span>
              <StatusPill tone="green">Activo</StatusPill>
            </div>
            <div className="mt-2 flex items-center justify-between text-[13px]">
              <span className="text-muted-foreground">Desde</span>
              <b>{formatApiDate(active.validFrom)}</b>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="mt-4 w-full"
              disabled={isPending}
              onClick={() =>
                run(
                  () => revokeEnterpriseAction(orgId, active.id),
                  "Enterprise revocado",
                )
              }
            >
              {isPending && <Loader2 className="animate-spin" />}
              Revocar Enterprise
            </Button>
          </>
        ) : (
          <>
            <p className="text-[12.5px] text-muted-foreground">
              Sin Enterprise la consola del cliente opera en modo People
              básico (solo accesos y usuarios).
            </p>
            <Button
              size="sm"
              className="mt-4 w-full"
              disabled={isPending}
              onClick={() =>
                run(() => grantEnterpriseAction(orgId), "Enterprise activado")
              }
            >
              {isPending && <Loader2 className="animate-spin" />}
              Activar Enterprise
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Bootstrap del primer admin
// ---------------------------------------------------------------------------

const bootstrapFormSchema = z.object({
  email: z.string().email("Correo inválido"),
  role: z.enum(["COMPANY_OWNER", "HR_ADMIN"]),
});
type BootstrapValues = z.infer<typeof bootstrapFormSchema>;

export function BootstrapAdminCard({ orgId }: { orgId: string }) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<BootstrapValues>({
    resolver: zodResolver(bootstrapFormSchema),
    defaultValues: { email: "", role: "COMPANY_OWNER" },
  });

  function onSubmit(values: BootstrapValues) {
    startTransition(async () => {
      const result = await bootstrapAdminAction({ orgId, ...values });
      if (result.ok) {
        toast.success(
          result.data?.existed
            ? "El usuario ya existía: membresía de admin creada"
            : "Invitación de administrador enviada",
        );
        form.reset();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[13.5px]">
          <UserPlus className="size-4 text-brand-mid" />
          Invitar administrador
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-3"
          noValidate
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="admin-email">Correo</Label>
            <Input
              id="admin-email"
              type="email"
              placeholder="admin@cliente.com"
              aria-invalid={Boolean(form.formState.errors.email)}
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-xs text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label>Rol</Label>
            <Select
              value={form.watch("role")}
              onValueChange={(value) =>
                form.setValue("role", value as BootstrapValues["role"])
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="COMPANY_OWNER">Company Owner</SelectItem>
                <SelectItem value="HR_ADMIN">HR Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending && <Loader2 className="animate-spin" />}
            Enviar invitación
          </Button>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Recibe las llaves de la organización: si el usuario ya existe se le
            asigna el rol; si no, se le envía una invitación por correo.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
