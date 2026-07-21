"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
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
import { allocateSeatsAction } from "../actions";

const allocateFormSchema = z.object({
  totalSeats: z
    .number({ message: "Ingresa un número" })
    .int("Debe ser un número entero")
    .min(1, "Mínimo 1 acceso"),
  notes: z.string().max(1000).optional(),
});
type AllocateFormValues = z.infer<typeof allocateFormSchema>;

interface AllocateSeatsDialogProps {
  parentOrgId: string;
  childOrgId: string;
  childName: string;
}

/**
 * Concede accesos a una empresa hija (`POST .../seat-grants`).
 * Descuenta de la bolsa del partner; el API valida el cupo disponible.
 */
export function AllocateSeatsDialog({
  parentOrgId,
  childOrgId,
  childName,
}: AllocateSeatsDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<AllocateFormValues>({
    resolver: zodResolver(allocateFormSchema),
    defaultValues: { totalSeats: 50, notes: "" },
  });

  function onSubmit(values: AllocateFormValues) {
    startTransition(async () => {
      const result = await allocateSeatsAction({
        parentOrgId,
        childOrgId,
        totalSeats: values.totalSeats,
        notes: values.notes || undefined,
      });
      if (result.ok) {
        toast.success(`Accesos asignados a ${childName}`);
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
        <Button variant="outline" size="sm">
          <KeyRound />
          Asignar accesos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Asignar accesos</DialogTitle>
          <DialogDescription>
            Concede accesos de tu bolsa a <b>{childName}</b>. Si la empresa ya
            tiene un grant activo, el API lo indicará.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
          noValidate
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="total-seats">Número de accesos</Label>
            <Input
              id="total-seats"
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
              placeholder="Ej. Contrato 2026"
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
              Asignar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
