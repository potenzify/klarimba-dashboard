"use client";

import { ArrowDown, ArrowUp, Loader2, Plus, TriangleAlert, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { reorderStepsAction } from "@/app/(dashboard)/admin/content/actions";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ContentStep, StepType } from "@/lib/api/content-schemas";
import { STEP_TYPE_META, stepPreview } from "@/lib/content/step-types";
import { cn } from "@/lib/utils";
import type { StepDraft } from "./step-editor";

interface StepListProps {
  missionId: string;
  steps: ContentStep[];
  selectedId: string | null;
  draft: StepDraft | null;
  allowedStepTypes: StepType[];
  onSelect: (stepId: string) => void;
  onAddDraft: (draft: StepDraft) => void;
  onSelectDraft: () => void;
}

/** Steps de la misión en orden, con reordenar (↑/↓) y añadir. */
export function StepList({
  missionId,
  steps,
  selectedId,
  draft,
  allowedStepTypes,
  onSelect,
  onAddDraft,
  onSelectDraft,
}: StepListProps) {
  const router = useRouter();
  const [moving, startMove] = useTransition();

  function move(index: number, to: number) {
    const ids = steps.map((s) => s.id);
    const [id] = ids.splice(index, 1);
    ids.splice(to, 0, id);
    startMove(async () => {
      const result = await reorderStepsAction({ missionId, stepIds: ids });
      if (result.ok) {
        toast.success("Orden guardado");
        for (const warning of result.data?.warnings ?? []) toast.warning(warning);
        router.refresh();
      } else {
        toast.error("No se pudo reordenar", { description: result.error });
      }
    });
  }

  const items: Array<{ kind: "step"; step: ContentStep; index: number } | { kind: "draft" }> =
    steps.map((step, index) => ({ kind: "step" as const, step, index }));
  if (draft) items.splice(Math.min(draft.position - 1, items.length), 0, { kind: "draft" });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[12px] font-bold tracking-wider text-muted-foreground uppercase">
          Steps ({steps.length})
        </h3>
        {moving && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
      </div>
      <ol className="flex flex-col gap-1.5">
        {items.map((item) => {
          if (item.kind === "draft") {
            return (
              <li key="draft">
                <button
                  type="button"
                  onClick={onSelectDraft}
                  className={cn(
                    "w-full rounded-xl border-2 border-dashed px-3 py-2.5 text-left transition-colors",
                    selectedId === null ? "border-primary bg-secondary" : "border-border bg-card hover:bg-muted",
                  )}
                >
                  <span className="text-[11px] font-bold text-primary uppercase">Nuevo · sin guardar</span>
                  <span className="block text-[12.5px] font-semibold">
                    {STEP_TYPE_META[draft!.stepType]?.label}
                  </span>
                </button>
              </li>
            );
          }
          const { step, index } = item;
          const active = step.id === selectedId;
          const preview = stepPreview(step.stepType, step.translations.es);
          return (
            <li key={step.id} className="group relative">
              <button
                type="button"
                onClick={() => onSelect(step.id)}
                className={cn(
                  "flex w-full gap-2.5 rounded-xl border px-3 py-2.5 pr-9 text-left transition-colors",
                  active ? "border-primary bg-secondary" : "bg-card hover:bg-muted",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                    active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
                  {step.order}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[12.5px] font-semibold">
                    {STEP_TYPE_META[step.stepType]?.label ?? step.stepType}
                  </span>
                  {preview && (
                    <span className="line-clamp-2 text-[11.5px] leading-snug text-muted-foreground">
                      {preview}
                    </span>
                  )}
                  <span className="mt-1 flex flex-wrap gap-1.5">
                    {step.responsesCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-warning">
                        <Users className="size-3" />
                        {step.responsesCount}
                      </span>
                    )}
                    {step.issues.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-destructive">
                        <TriangleAlert className="size-3" />
                        revisar
                      </span>
                    )}
                  </span>
                </span>
              </button>
              <div className="absolute top-1.5 right-1.5 flex flex-col opacity-60 transition-opacity group-hover:opacity-100">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Subir step"
                  disabled={moving || index === 0}
                  onClick={() => move(index, index - 1)}
                >
                  <ArrowUp />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Bajar step"
                  disabled={moving || index === steps.length - 1}
                  onClick={() => move(index, index + 1)}
                >
                  <ArrowDown />
                </Button>
              </div>
            </li>
          );
        })}
      </ol>
      <AddStepDialog
        allowedStepTypes={allowedStepTypes}
        stepsCount={steps.length}
        disabled={Boolean(draft)}
        onAdd={onAddDraft}
      />
    </div>
  );
}

function AddStepDialog({
  allowedStepTypes,
  stepsCount,
  disabled,
  onAdd,
}: {
  allowedStepTypes: StepType[];
  stepsCount: number;
  disabled: boolean;
  onAdd: (draft: StepDraft) => void;
}) {
  const [open, setOpen] = useState(false);
  const [stepType, setStepType] = useState<StepType>(allowedStepTypes[0]);
  const [position, setPosition] = useState(String(stepsCount + 1));

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setPosition(String(stepsCount + 1));
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="mt-1" disabled={disabled}>
          <Plus />
          Añadir step
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Añadir step</DialogTitle>
          <DialogDescription>
            Solo los tipos que admite el formato de la misión. Se crea al pulsar «Crear step» en el
            editor.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label className="text-[12.5px] font-semibold">Tipo</Label>
          <div className="flex flex-col gap-1.5">
            {allowedStepTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setStepType(type)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-left transition-colors",
                  stepType === type ? "border-primary bg-secondary" : "hover:bg-muted",
                )}
              >
                <span className="block text-[12.5px] font-semibold">{STEP_TYPE_META[type]?.label}</span>
                <span className="block text-[11.5px] text-muted-foreground">
                  {STEP_TYPE_META[type]?.description}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-[12.5px] font-semibold">Posición</Label>
          <Select value={position} onValueChange={setPosition}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: stepsCount + 1 }, (_, i) => i + 1).map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n === stepsCount + 1 ? `${n} (al final)` : `${n} (antes del step ${n} actual)`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              onAdd({ stepType, position: Number(position) });
              setOpen(false);
            }}
          >
            Continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
