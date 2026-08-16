"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Copy, Download, Loader2, Ticket } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Invitation } from "@/lib/api/schemas";
import { copyToClipboard } from "@/lib/clipboard";
import { formatApiDate } from "@/lib/format";
import { roleLabel } from "@/lib/navigation";
import { generateInvitationCodesAction } from "../actions";

const generateCodesFormSchema = z.object({
  quantity: z
    .number({ error: "Indica cuántos códigos" })
    .int("Debe ser un número entero")
    .min(1, "Mínimo 1 código")
    .max(100, "Máximo 100 códigos por lote"),
  roleToGrant: z.enum(["MEMBER", "HR_ADMIN", "COMPANY_OWNER"]),
  /** `YYYY-MM-DD` del input nativo; vacío = sin caducidad. */
  expiresOn: z.string().optional(),
});

type GenerateCodesFormValues = z.infer<typeof generateCodesFormSchema>;

/** Fin del día local de la fecha elegida, en ISO, para `expiresAt`. */
function endOfDayIso(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day, 23, 59, 59, 999).toISOString();
}

function todayInputValue(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

interface GenerateCodesFormProps {
  orgId: string;
  onCancel: () => void;
  onDone: () => void;
}

/**
 * Pestaña "Generar códigos": lote de códigos PERSONAL sin destinatario ("al
 * portador"). Cada código es de un solo uso y lo canjea quien lo tenga; sirve
 * para sorteos, ferias o empleados sin correo conocido. El API no envía nada:
 * los códigos se muestran aquí para copiarlos/descargarlos y quedan en la
 * vista de Invitaciones.
 */
export function GenerateCodesForm({
  orgId,
  onCancel,
  onDone,
}: GenerateCodesFormProps) {
  const [isPending, startTransition] = useTransition();
  const [generated, setGenerated] = useState<Invitation[] | null>(null);

  const form = useForm<GenerateCodesFormValues>({
    resolver: zodResolver(generateCodesFormSchema),
    defaultValues: { quantity: 10, roleToGrant: "MEMBER", expiresOn: "" },
  });

  function onSubmit(values: GenerateCodesFormValues) {
    startTransition(async () => {
      const result = await generateInvitationCodesAction({
        orgId,
        quantity: values.quantity,
        roleToGrant: values.roleToGrant,
        expiresAt: values.expiresOn ? endOfDayIso(values.expiresOn) : undefined,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const invitations = result.data ?? [];
      setGenerated(invitations);
      toast.success(
        invitations.length === 1
          ? "1 código generado"
          : `${invitations.length} códigos generados`,
      );
    });
  }

  if (generated) {
    return (
      <GeneratedCodesResult
        orgId={orgId}
        invitations={generated}
        onDone={onDone}
      />
    );
  }

  const quantityError = form.formState.errors.quantity;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
      noValidate
    >
      <p className="rounded-lg border bg-muted/40 p-3 text-[12.5px] text-muted-foreground">
        A diferencia de la invitación por correo, estos códigos{" "}
        <span className="font-semibold text-foreground">
          no están atados a ninguna persona
        </span>
        : cada uno vale una vez y lo canjea quien lo tenga (sorteos, ferias,
        personas sin correo conocido). No se envía ningún email; los repartes
        tú.
      </p>

      <div className="flex flex-col gap-2">
        <Label htmlFor="codes-quantity">Cantidad de códigos</Label>
        <Input
          id="codes-quantity"
          type="number"
          min={1}
          max={100}
          inputMode="numeric"
          aria-invalid={Boolean(quantityError)}
          {...form.register("quantity", { valueAsNumber: true })}
        />
        {quantityError ? (
          <p className="text-xs text-destructive">{quantityError.message}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Entre 1 y 100 por lote. Cada canje consume un acceso.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label>Rol al canjear</Label>
        <Select
          value={form.watch("roleToGrant")}
          onValueChange={(value) =>
            form.setValue(
              "roleToGrant",
              value as GenerateCodesFormValues["roleToGrant"],
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

      <div className="flex flex-col gap-2">
        <Label htmlFor="codes-expires">Caducidad (opcional)</Label>
        <Input
          id="codes-expires"
          type="date"
          min={todayInputValue()}
          {...form.register("expiresOn")}
        />
        <p className="text-xs text-muted-foreground">
          Pasada esa fecha los códigos no canjeados dejan de servir.
        </p>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : <Ticket />}
          Generar códigos
        </Button>
      </DialogFooter>
    </form>
  );
}

function toCsv(invitations: Invitation[]): string {
  const header = ["codigo", "rol", "caduca"];
  const rows = invitations.map((inv) => [
    inv.code,
    inv.roleToGrant,
    inv.expiresAt ? String(inv.expiresAt) : "",
  ]);
  return [header, ...rows].map((row) => row.join(",")).join("\r\n");
}

/** Descarga un archivo de texto desde el navegador (Blob + anchor). */
function downloadTextFile(name: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/**
 * Resultado del lote: la única vez que los códigos se ven todos juntos y
 * listos para repartir. Copiar todos / descargar CSV; después siguen
 * disponibles uno a uno en la vista de Invitaciones.
 */
function GeneratedCodesResult({
  orgId,
  invitations,
  onDone,
}: {
  orgId: string;
  invitations: Invitation[];
  onDone: () => void;
}) {
  const [copiedAll, setCopiedAll] = useState(false);
  const first = invitations[0];

  async function copyAll() {
    const copied = await copyToClipboard(
      invitations.map((inv) => inv.code).join("\n"),
    );
    if (!copied) {
      toast.error("No se pudo copiar. Descarga el CSV.");
      return;
    }
    setCopiedAll(true);
    toast.success(
      invitations.length === 1
        ? "Código copiado"
        : `${invitations.length} códigos copiados`,
    );
    setTimeout(() => setCopiedAll(false), 1500);
  }

  function downloadCsv() {
    downloadTextFile(
      `codigos-klarimba-${todayInputValue()}.csv`,
      toCsv(invitations),
      "text/csv;charset=utf-8",
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border bg-muted/40 p-3 text-[12.5px]">
        <p className="font-semibold">
          {invitations.length === 1
            ? "1 código listo para repartir"
            : `${invitations.length} códigos listos para repartir`}
        </p>
        <p className="mt-0.5 text-muted-foreground">
          Rol al canjear: {first ? roleLabel(first.roleToGrant) : "—"} ·
          Caducidad:{" "}
          {first?.expiresAt ? formatApiDate(first.expiresAt) : "sin caducidad"}
        </p>
      </div>

      <ul
        aria-label="Códigos generados"
        className="grid max-h-56 grid-cols-2 gap-1.5 overflow-y-auto rounded-lg border p-2 sm:grid-cols-3"
      >
        {invitations.map((inv) => (
          <li
            key={inv.id}
            className="rounded-md bg-muted px-2 py-1 text-center font-mono text-[11.5px] font-bold tracking-wider"
          >
            {inv.code}
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={copyAll}>
          {copiedAll ? <Check className="text-brand-mid" /> : <Copy />}
          Copiar todos
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={downloadCsv}>
          <Download />
          Descargar CSV
        </Button>
      </div>

      <p className="text-[11.5px] text-muted-foreground">
        Los códigos quedan en{" "}
        <Link
          href={`/org/${orgId}/invitations`}
          className="font-semibold text-primary underline-offset-2 hover:underline"
        >
          Invitaciones
        </Link>
        , donde puedes copiarlos uno a uno o revocarlos.
      </p>

      <DialogFooter>
        <Button type="button" onClick={onDone}>
          Listo
        </Button>
      </DialogFooter>
    </div>
  );
}
