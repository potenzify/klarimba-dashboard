"use client";

import {
  Braces,
  CircleAlert,
  Loader2,
  RotateCcw,
  Save,
  Trash2,
  TriangleAlert,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createStepAction,
  deleteStepAction,
  updateStepAction,
} from "@/app/(dashboard)/admin/content/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type {
  ContentFile,
  ContentMission,
  ContentStep,
  StepContent,
  StepType,
} from "@/lib/api/content-schemas";
import { sameContent, setIn, type Path } from "@/lib/content/content-state";
import { newStepTemplate, STEP_TYPE_META } from "@/lib/content/step-types";
import { validateStepContent } from "@/lib/content/validate";
import { cn } from "@/lib/utils";
import { FileField } from "./file-field";
import { StepForm } from "./step-forms/step-form";
import { saveWithTranslation } from "./translation-feedback";
import { TranslationsPreview } from "./translations-preview";

export interface StepDraft {
  stepType: StepType;
  position: number;
}

interface StepEditorProps {
  mission: ContentMission;
  /** Step existente, o `null` si se está creando uno nuevo (`draft`). */
  step: ContentStep | null;
  draft?: StepDraft;
  files: Record<string, ContentFile>;
  registerFile: (file: ContentFile) => void;
  onDirtyChange: (dirty: boolean) => void;
  onCreated: (stepId: string) => void;
  onCancelDraft: () => void;
  onDeleted: () => void;
}

/**
 * Editor del contenido en español de un step: formulario por tipo (o JSON
 * avanzado), imagen, guardado con retraducción de en/it y borrado.
 */
export function StepEditor({
  mission,
  step,
  draft,
  files,
  registerFile,
  onDirtyChange,
  onCreated,
  onCancelDraft,
  onDeleted,
}: StepEditorProps) {
  const router = useRouter();
  const stepType = (step?.stepType ?? draft?.stepType) as StepType;
  const initial = useMemo<StepContent>(
    () => step?.translations.es ?? newStepTemplate(stepType, mission.format.code),
    [step, stepType, mission.format.code],
  );
  const [content, setContent] = useState<StepContent>(initial);
  /** `undefined` = sin cambios; `null` = volver al placeholder; id = imagen nueva. */
  const [imageId, setImageId] = useState<string | null | undefined>(undefined);
  const [mode, setMode] = useState<"form" | "json">("form");
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();
  const [deleting, startDelete] = useTransition();

  const dirty = !step || !sameContent(content, initial) || imageId !== undefined;
  const errors = useMemo(() => validateStepContent(stepType, content), [stepType, content]);
  const meta = STEP_TYPE_META[stepType];
  const supportsImage = step?.supportsImage ?? ["multiple_choice", "slider_choice", "role_play_dialog", "mindful_media"].includes(stepType);

  useEffect(() => onDirtyChange(Boolean(step) && dirty), [dirty, step, onDirtyChange]);

  const set = (path: Path, value: unknown) => setContent((current) => setIn(current, path, value));

  function switchMode(next: "form" | "json") {
    if (next === "json") {
      setJsonText(JSON.stringify(content, null, 2));
      setJsonError(null);
    }
    setMode(next);
  }

  function onJsonChange(text: string) {
    setJsonText(text);
    try {
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        setJsonError("El contenido debe ser un objeto JSON");
        return;
      }
      setJsonError(null);
      setContent(parsed);
    } catch (error) {
      setJsonError((error as Error).message);
    }
  }

  function save() {
    if (errors.length) {
      toast.error("Revisa el formulario", { description: errors.slice(0, 4).join(" · ") });
      return;
    }
    startSave(async () => {
      if (step) {
        await saveWithTranslation(
          (translation) =>
            updateStepAction({
              stepId: step.id,
              content,
              ...(imageId !== undefined ? { imageId } : {}),
              version: step.version,
              translation,
            }),
          {
            success: `Step ${step.order} guardado`,
            onSaved: () => {
              setImageId(undefined);
              router.refresh();
            },
          },
        );
        return;
      }
      await saveWithTranslation(
        (translation) =>
          createStepAction({
            missionId: mission.id,
            stepType,
            position: draft?.position,
            content,
            ...(imageId !== undefined ? { imageId } : {}),
            translation,
          }),
        {
          success: "Step creado",
          onSaved: (mutation) => {
            onCreated(mutation.entityId);
            router.refresh();
          },
        },
      );
    });
  }

  function remove() {
    if (!step) return;
    startDelete(async () => {
      const result = await deleteStepAction(step.id);
      if (result.ok) {
        toast.success(`Step ${step.order} borrado`, {
          description: "Puedes deshacerlo desde el historial.",
        });
        for (const warning of result.data?.warnings ?? []) toast.warning(warning);
        onDeleted();
        router.refresh();
      } else {
        toast.error("No se pudo borrar", { description: result.error });
      }
    });
  }

  function discard() {
    setContent(initial);
    setImageId(undefined);
    if (mode === "json") setJsonText(JSON.stringify(initial, null, 2));
  }

  const currentImage =
    imageId === undefined ? step?.image ?? null : imageId === null ? null : files[imageId] ?? null;
  const blockedDelete = (step?.responsesCount ?? 0) > 0;

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border bg-card p-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
            {step ? `Step ${step.order}` : `Nuevo step · posición ${draft?.position}`}
          </p>
          <h2 className="text-[17px] font-bold tracking-tight">{meta?.label ?? stepType}</h2>
          <p className="text-[12.5px] text-muted-foreground">{meta?.description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11.5px]">
            <code className="rounded bg-muted px-1.5 py-0.5 text-[11px]">{stepType}</code>
            {step && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold",
                  step.responsesCount > 0 ? "bg-warning-soft text-warning" : "bg-muted text-muted-foreground",
                )}
              >
                <Users className="size-3" />
                {step.responsesCount} respuesta(s)
              </span>
            )}
            {dirty && step && (
              <span className="rounded-full bg-secondary px-2 py-0.5 font-semibold text-primary">
                Cambios sin guardar
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {step ? (
            <AlertDialog>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" disabled={blockedDelete || deleting}>
                        {deleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
                        Borrar
                      </Button>
                    </AlertDialogTrigger>
                  </span>
                </TooltipTrigger>
                {blockedDelete && (
                  <TooltipContent>
                    Tiene respuestas de usuarios: borrarlo se llevaría su progreso. Edita el contenido.
                  </TooltipContent>
                )}
              </Tooltip>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Borrar el step {step.order}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Se quita de la misión y los siguientes suben una posición. Queda en el historial y
                    se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={remove}>
                    Borrar step
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button variant="ghost" size="sm" onClick={onCancelDraft}>
              Cancelar
            </Button>
          )}
          {step && (
            <Button variant="outline" size="sm" onClick={discard} disabled={!dirty || saving}>
              <RotateCcw />
              Descartar
            </Button>
          )}
          <Button size="sm" onClick={save} disabled={saving || (step ? !dirty : false) || Boolean(jsonError)}>
            {saving ? <Loader2 className="animate-spin" /> : <Save />}
            {step ? "Guardar" : "Crear step"}
          </Button>
        </div>
      </div>

      {step && step.issues.length > 0 && (
        <div className="flex gap-2.5 rounded-xl border border-warning/30 bg-warning-soft p-3 text-[12.5px] text-warning">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-semibold">El contenido guardado no cumple el contrato de su tipo:</p>
            <ul className="mt-1 list-disc pl-4">
              {step.issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {supportsImage && (
        <FileField
          label="Imagen del step"
          kind="image"
          file={currentImage}
          hint="Se muestra junto a la pregunta en la app. Sin imagen propia se usa el placeholder genérico."
          onUploaded={(file) => {
            registerFile(file);
            setImageId(file.id);
          }}
          onClear={() => setImageId(null)}
        />
      )}

      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[13px] font-bold">Contenido (español)</h3>
        <div className="flex gap-1 rounded-lg bg-secondary p-1">
          {(
            [
              { value: "form", label: "Formulario" },
              { value: "json", label: "JSON avanzado" },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => switchMode(option.value)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
                mode === option.value ? "bg-card text-brand-dark shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option.value === "json" && <Braces className="size-3.5" />}
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {mode === "form" ? (
        <div className="flex flex-col gap-4">
          <StepForm
            stepType={stepType}
            content={content}
            set={set}
            context={{
              formatCode: mission.format.code,
              missionType: mission.missionType,
              files,
              registerFile,
            }}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-[12px] text-muted-foreground">
            Edición directa del JSON en español (forma de <code>seeds/data/types.ts</code>). Las claves
            que no reconoce el formulario se conservan. El API valida el contrato al guardar.
          </p>
          <Textarea
            value={jsonText}
            onChange={(event) => onJsonChange(event.target.value)}
            rows={18}
            spellCheck={false}
            className="bg-card font-mono text-[12px]"
            aria-invalid={Boolean(jsonError)}
          />
          {jsonError && <p className="text-[12px] text-destructive">JSON inválido: {jsonError}</p>}
        </div>
      )}

      {errors.length > 0 && (
        <div className="flex gap-2.5 rounded-xl border border-destructive/20 bg-destructive-soft p-3 text-[12.5px] text-destructive">
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-semibold">Falta completar antes de guardar:</p>
            <ul className="mt-1 list-disc pl-4">
              {errors.slice(0, 8).map((error) => (
                <li key={error}>{error}</li>
              ))}
              {errors.length > 8 && <li>…y {errors.length - 8} más</li>}
            </ul>
          </div>
        </div>
      )}

      {step && <TranslationsPreview translations={step.translations} locales={mission.locales} />}
    </div>
  );
}
