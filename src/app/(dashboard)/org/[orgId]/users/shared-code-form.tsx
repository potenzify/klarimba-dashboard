"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Copy, Loader2, Users } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Invitation } from "@/lib/api/schemas";
import { copyToClipboard } from "@/lib/clipboard";
import { endOfDayIso, todayInputValue } from "@/lib/date-input";
import { formatApiDate } from "@/lib/format";
import { createSharedCodeAction } from "../actions";

const CODE_PATTERN = /^[A-Z0-9_-]{4,32}$/;

const sharedCodeFormSchema = z.object({
  /** Vacío = el API genera uno. */
  code: z
    .string()
    .trim()
    .toUpperCase()
    .refine(
      (value) => value === "" || CODE_PATTERN.test(value),
      "4–32 caracteres: letras, números, - y _",
    ),
  maxRedemptions: z
    .number({ error: "Indica cuántos canjes" })
    .int("Debe ser un número entero")
    .min(1, "Mínimo 1 canje")
    .max(10000, "Máximo 10.000 canjes"),
  /** `YYYY-MM-DD` del input nativo; vacío = sin caducidad. */
  expiresOn: z.string().optional(),
});

type SharedCodeFormValues = z.input<typeof sharedCodeFormSchema>;

interface SharedCodeFormProps {
  orgId: string;
  onCancel: () => void;
  onDone: () => void;
}

/**
 * Pestaña "Compartido": un mismo código (`SHARED_CODE`) que pueden canjear
 * varias personas hasta agotar los canjes. Sirve para onboarding masivo sin
 * correos o para dar acceso a un tercero (p. ej. el equipo de App Review de
 * Apple). Siempre da rol de empleado y cada canje consume un acceso del grant.
 */
export function SharedCodeForm({ orgId, onCancel, onDone }: SharedCodeFormProps) {
  const [isPending, startTransition] = useTransition();
  const [created, setCreated] = useState<Invitation | null>(null);

  const form = useForm<SharedCodeFormValues>({
    resolver: zodResolver(sharedCodeFormSchema),
    defaultValues: { code: "", maxRedemptions: 10, expiresOn: "" },
  });

  function onSubmit(values: SharedCodeFormValues) {
    startTransition(async () => {
      const code = values.code.trim().toUpperCase();
      const result = await createSharedCodeAction({
        orgId,
        code: code || undefined,
        maxRedemptions: values.maxRedemptions,
        expiresAt: values.expiresOn ? endOfDayIso(values.expiresOn) : undefined,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setCreated(result.data!);
      toast.success("Código compartido creado");
    });
  }

  if (created) {
    return (
      <SharedCodeResult orgId={orgId} invitation={created} onDone={onDone} />
    );
  }

  const { errors } = form.formState;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
      noValidate
    >
      <p className="rounded-lg border bg-muted/40 p-3 text-[12.5px] text-muted-foreground">
        Un{" "}
        <span className="font-semibold text-foreground">
          mismo código para varias personas
        </span>
        , hasta agotar los canjes. Útil para dar acceso a un grupo sin enviar
        correos. Quienes lo canjeen entran como empleados.
      </p>

      <div className="flex flex-col gap-2">
        <Label htmlFor="shared-code">Código (opcional)</Label>
        <Input
          id="shared-code"
          placeholder="Ej: APPLE-REVIEW"
          autoComplete="off"
          className="font-mono uppercase"
          aria-invalid={Boolean(errors.code)}
          {...form.register("code")}
        />
        {errors.code ? (
          <p className="text-xs text-destructive">{errors.code.message}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Letras, números, guiones; de 4 a 32 caracteres. Si lo dejas vacío,
            se genera uno.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="shared-max">Número de canjes</Label>
        <Input
          id="shared-max"
          type="number"
          min={1}
          max={10000}
          inputMode="numeric"
          aria-invalid={Boolean(errors.maxRedemptions)}
          {...form.register("maxRedemptions", { valueAsNumber: true })}
        />
        {errors.maxRedemptions ? (
          <p className="text-xs text-destructive">
            {errors.maxRedemptions.message}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Cuántas personas pueden registrarse con él. Cada canje consume un
            acceso, y borrar una cuenta no devuelve el canje.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="shared-expires">Caducidad (opcional)</Label>
        <Input
          id="shared-expires"
          type="date"
          min={todayInputValue()}
          {...form.register("expiresOn")}
        />
        <p className="text-xs text-muted-foreground">
          Pasada esa fecha el código deja de servir.
        </p>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : <Users />}
          Crear código
        </Button>
      </DialogFooter>
    </form>
  );
}

function SharedCodeResult({
  orgId,
  invitation,
  onDone,
}: {
  orgId: string;
  invitation: Invitation;
  onDone: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!(await copyToClipboard(invitation.code))) {
      toast.error("No se pudo copiar el código.");
      return;
    }
    setCopied(true);
    toast.success("Código copiado");
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-2 rounded-lg border bg-muted/40 p-4">
        <p
          aria-label="Código compartido"
          className="font-mono text-xl font-bold tracking-wider"
        >
          {invitation.code}
        </p>
        <p className="text-[12.5px] text-muted-foreground">
          {invitation.maxRedemptions === 1
            ? "1 canje"
            : `${invitation.maxRedemptions} canjes`}{" "}
          · Caducidad:{" "}
          {invitation.expiresAt
            ? formatApiDate(invitation.expiresAt)
            : "sin caducidad"}
        </p>
        <Button type="button" variant="outline" size="sm" onClick={copy}>
          {copied ? <Check className="text-brand-mid" /> : <Copy />}
          Copiar código
        </Button>
      </div>

      <p className="text-[11.5px] text-muted-foreground">
        Puedes seguir sus canjes o revocarlo en{" "}
        <Link
          href={`/org/${orgId}/invitations`}
          className="font-semibold text-primary underline-offset-2 hover:underline"
        >
          Invitaciones
        </Link>
        .
      </p>

      <DialogFooter>
        <Button type="button" onClick={onDone}>
          Listo
        </Button>
      </DialogFooter>
    </div>
  );
}
