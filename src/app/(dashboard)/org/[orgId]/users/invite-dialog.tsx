"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2, UserPlus } from "lucide-react";
import { useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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
import { inviteByEmailAction } from "../actions";

const inviteFormSchema = z.object({
  invites: z
    .array(
      z.object({
        email: z.string().email("Correo inválido"),
      }),
    )
    .min(1)
    .max(50),
  roleToGrant: z.enum(["MEMBER", "HR_ADMIN", "COMPANY_OWNER"]),
});

type InviteFormValues = z.infer<typeof inviteFormSchema>;

/**
 * Invitar empleados por email (invitación PERSONAL + EMAIL).
 * Fase 1: sin selects de equipo/sede ni pestaña CSV (sin backend).
 */
export function InviteDialog({ orgId }: { orgId: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: { invites: [{ email: "" }], roleToGrant: "MEMBER" },
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "invites",
  });

  function onSubmit(values: InviteFormValues) {
    startTransition(async () => {
      const result = await inviteByEmailAction({
        orgId,
        emails: values.invites.map((i) => i.email),
        roleToGrant: values.roleToGrant,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const { sent, failed } = result.data!;
      if (sent.length > 0) {
        toast.success(
          sent.length === 1
            ? `Invitación enviada a ${sent[0]}`
            : `${sent.length} invitaciones enviadas`,
        );
      }
      for (const failure of failed) {
        toast.error(`${failure.email}: ${failure.error}`);
      }
      if (failed.length === 0) {
        setOpen(false);
        form.reset();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus />
          Invitar empleados
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invitar empleados</DialogTitle>
          <DialogDescription>
            Cada persona recibe un correo con un código para activar su acceso a
            Klarimba People. También puedes copiar el código desde la tabla y
            compartirlo a mano.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
          noValidate
        >
          <div className="flex flex-col gap-2.5">
            {fields.map((field, index) => {
              const error = form.formState.errors.invites?.[index]?.email;
              return (
                <div key={field.id}>
                  <div className="flex items-center gap-2">
                    <Input
                      type="email"
                      placeholder="empleado@empresa.com"
                      aria-invalid={Boolean(error)}
                      {...form.register(`invites.${index}.email`)}
                    />
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Quitar correo"
                        onClick={() => remove(index)}
                      >
                        <Trash2 />
                      </Button>
                    )}
                  </div>
                  {error && (
                    <p className="mt-1 text-xs text-destructive">
                      {error.message}
                    </p>
                  )}
                </div>
              );
            })}
            {fields.length < 50 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="self-start text-primary"
                onClick={() => append({ email: "" })}
              >
                <Plus />
                Añadir otro
              </Button>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Rol al aceptar</Label>
            <Select
              value={form.watch("roleToGrant")}
              onValueChange={(value) =>
                form.setValue(
                  "roleToGrant",
                  value as InviteFormValues["roleToGrant"],
                )
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">Empleado (People)</SelectItem>
                <SelectItem value="HR_ADMIN">HR Admin</SelectItem>
                <SelectItem value="COMPANY_OWNER">Company Owner</SelectItem>
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
              Enviar invitaciones
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
