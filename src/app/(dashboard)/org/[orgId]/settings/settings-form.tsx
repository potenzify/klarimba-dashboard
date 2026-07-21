"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { renameOrganizationAction } from "../actions";

const renameFormSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres").max(255, "Máximo 255"),
});
type RenameFormValues = z.infer<typeof renameFormSchema>;

interface SettingsFormProps {
  orgId: string;
  currentName: string;
  /** Solo el Company Owner tiene MANAGE_ORGANIZATION. */
  canManage: boolean;
}

export function SettingsForm({ orgId, currentName, canManage }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<RenameFormValues>({
    resolver: zodResolver(renameFormSchema),
    defaultValues: { name: currentName },
  });

  function onSubmit(values: RenameFormValues) {
    startTransition(async () => {
      const result = await renameOrganizationAction({
        orgId,
        name: values.name,
      });
      if (result.ok) toast.success("Nombre actualizado");
      else toast.error(result.error);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[13.5px]">Nombre de la organización</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-3"
          noValidate
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="org-name">Nombre visible</Label>
            <Input
              id="org-name"
              disabled={!canManage}
              aria-invalid={Boolean(form.formState.errors.name)}
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
            {!canManage && (
              <p className="text-xs text-muted-foreground">
                Solo el Company Owner puede editar el nombre.
              </p>
            )}
          </div>
          {canManage && (
            <Button
              type="submit"
              size="sm"
              className="self-start"
              disabled={isPending || !form.formState.isDirty}
            >
              {isPending && <Loader2 className="animate-spin" />}
              Guardar cambios
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
