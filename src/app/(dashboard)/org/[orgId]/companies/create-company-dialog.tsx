"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Loader2 } from "lucide-react";
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
import { createChildAction } from "../actions";

const createCompanyFormSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres").max(255),
  slug: orgSlugSchema,
});
type CreateCompanyFormValues = z.infer<typeof createCompanyFormSchema>;

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

/** Alta de una empresa cliente del portfolio (`POST .../children`). */
export function CreateCompanyDialog({ parentOrgId }: { parentOrgId: string }) {
  const [open, setOpen] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreateCompanyFormValues>({
    resolver: zodResolver(createCompanyFormSchema),
    defaultValues: { name: "", slug: "" },
  });

  function onSubmit(values: CreateCompanyFormValues) {
    startTransition(async () => {
      const result = await createChildAction({ parentOrgId, ...values });
      if (result.ok) {
        toast.success(`Empresa "${values.name}" creada`);
        setOpen(false);
        form.reset();
        setSlugTouched(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Building2 />
          Crear empresa cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Crear empresa cliente</DialogTitle>
          <DialogDescription>
            Da de alta una organización en tu portfolio. Después podrás
            asignarle accesos de tu bolsa.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
          noValidate
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="company-name">Nombre de la empresa</Label>
            <Input
              id="company-name"
              placeholder="Ej. Innova Group S.A.S."
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
            <Label htmlFor="company-slug">Identificador (slug)</Label>
            <Input
              id="company-slug"
              placeholder="innova-group"
              aria-invalid={Boolean(form.formState.errors.slug)}
              {...form.register("slug", {
                onChange: () => setSlugTouched(true),
              })}
            />
            <p className="text-xs text-muted-foreground">
              Único en la plataforma; solo minúsculas, números y guiones.
            </p>
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
              Crear empresa
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
