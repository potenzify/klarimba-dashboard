"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, Plus, Ticket, Trash2, UserPlus } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { inviteByEmailAction } from "../actions";
import { GenerateCodesForm } from "./generate-codes-form";

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

export type InviteTab = "email" | "codes";

/**
 * Invitar empleados: por email (invitación PERSONAL + EMAIL, el API envía el
 * correo) o generando un lote de códigos "al portador" (PERSONAL sin
 * destinatario, se reparten a mano). Sin pestaña CSV ni selects de
 * equipo/sede (sin backend).
 */
export function InviteDialog({
  orgId,
  defaultTab = "email",
}: {
  orgId: string;
  defaultTab?: InviteTab;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<InviteTab>(defaultTab);
  // Remonta el formulario de códigos al reabrir: vuelve a la pantalla inicial
  // en vez de mostrar el lote anterior.
  const [session, setSession] = useState(0);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setTab(defaultTab);
      setSession((n) => n + 1);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
            {tab === "email"
              ? "Cada persona recibe por correo un código personal, atado a esa dirección: solo ella puede canjearlo y la app le pre-llena el correo al registrarse. También puedes copiar el código desde la tabla y compartirlo a mano."
              : "Códigos de un solo uso sin destinatario: los canjea quien los tenga, con el correo que elija. Tú los repartes por tus canales; no se envía ningún email."}
          </DialogDescription>
        </DialogHeader>
        <Tabs value={tab} onValueChange={(value) => setTab(value as InviteTab)}>
          <TabsList className="w-full">
            <TabsTrigger value="email">
              <Mail />
              Por correo
            </TabsTrigger>
            <TabsTrigger value="codes">
              <Ticket />
              Generar códigos
            </TabsTrigger>
          </TabsList>
          <TabsContent value="email" className="pt-2">
            <InviteByEmailForm
              key={`email-${session}`}
              orgId={orgId}
              onCancel={() => setOpen(false)}
              onDone={() => setOpen(false)}
            />
          </TabsContent>
          <TabsContent value="codes" className="pt-2">
            <GenerateCodesForm
              key={`codes-${session}`}
              orgId={orgId}
              onCancel={() => setOpen(false)}
              onDone={() => setOpen(false)}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function InviteByEmailForm({
  orgId,
  onCancel,
  onDone,
}: {
  orgId: string;
  onCancel: () => void;
  onDone: () => void;
}) {
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
        form.reset();
        onDone();
      }
    });
  }

  return (
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
                <p className="mt-1 text-xs text-destructive">{error.message}</p>
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
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="animate-spin" />}
          Enviar invitaciones
        </Button>
      </DialogFooter>
    </form>
  );
}
