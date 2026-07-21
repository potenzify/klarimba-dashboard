"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Loader2, Plus, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
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
import { orgSlugSchema } from "@/lib/api/schemas";
import { cn } from "@/lib/utils";
import { slugify } from "../org/[orgId]/companies/create-company-dialog";
import { createClientAction } from "./actions";

const createClientFormSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres").max(255),
  slug: orgSlugSchema,
  type: z.enum(["TENANT", "PARTNER"]),
});
type CreateClientFormValues = z.infer<typeof createClientFormSchema>;

interface CreateClientDialogProps {
  /** Preselecciona el tipo y bloquea el selector (vista Partners). */
  fixedType?: "TENANT" | "PARTNER";
}

/** Alta directa de un cliente desde el backoffice (empresa o partner). */
export function CreateClientDialog({ fixedType }: CreateClientDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateClientFormValues>({
    resolver: zodResolver(createClientFormSchema),
    defaultValues: { name: "", slug: "", type: fixedType ?? "TENANT" },
  });
  const selectedType = form.watch("type");

  function onSubmit(values: CreateClientFormValues) {
    startTransition(async () => {
      const result = await createClientAction(values);
      if (result.ok) {
        toast.success(`Cliente "${values.name}" creado`);
        setOpen(false);
        form.reset();
        setSlugTouched(false);
        if (result.data) router.push(`/admin/clients/${result.data.id}`);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          {fixedType === "PARTNER" ? "Crear partner" : "Crear cliente"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Crear nuevo cliente</DialogTitle>
          <DialogDescription>
            Alta directa desde el backoffice. Después podrás asignar accesos,
            activar Enterprise e invitar al primer administrador.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
          noValidate
        >
          {!fixedType && (
            <div className="flex flex-col gap-2">
              <Label>Tipo de cliente</Label>
              <div className="flex gap-1 rounded-lg bg-secondary p-1">
                {(
                  [
                    { value: "TENANT", label: "Empresa directa", icon: Building2 },
                    { value: "PARTNER", label: "Partner (ARL / Caja)", icon: Shield },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => form.setValue("type", option.value)}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors",
                      selectedType === option.value
                        ? "bg-card text-brand-dark shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <option.icon className="size-3.5" />
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="client-name">
              {selectedType === "PARTNER"
                ? "Nombre del partner"
                : "Nombre de la empresa"}
            </Label>
            <Input
              id="client-name"
              placeholder={
                selectedType === "PARTNER" ? "Ej. ARL Sura" : "Ej. Acme Co."
              }
              aria-invalid={Boolean(form.formState.errors.name)}
              {...form.register("name", {
                onChange: (event) => {
                  if (!slugTouched) {
                    form.setValue("slug", slugify(event.target.value));
                  }
                },
              })}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="client-slug">Identificador (slug)</Label>
            <Input
              id="client-slug"
              placeholder="acme-co"
              aria-invalid={Boolean(form.formState.errors.slug)}
              {...form.register("slug", {
                onChange: () => setSlugTouched(true),
              })}
            />
            {form.formState.errors.slug && (
              <p className="text-xs text-destructive">
                {form.formState.errors.slug.message}
              </p>
            )}
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
              Crear cliente
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
