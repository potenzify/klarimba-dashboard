"use client";

import { Download, FileUp, Loader2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  exportMissionAction,
  importMissionAction,
} from "@/app/(dashboard)/admin/content/actions";
import { StatusPill } from "@/components/dashboard/status-pill";
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
import { Textarea } from "@/components/ui/textarea";
import type { MissionImportPlan, TranslationMode } from "@/lib/api/content-schemas";
import { STEP_TYPE_META } from "@/lib/content/step-types";
import { SwitchField } from "./fields";

/** Descarga la misión como JSON (`MissionData` de los seeds + manifiesto de archivos). */
export function ExportMissionButton({ missionId, slug }: { missionId: string; slug: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const result = await exportMissionAction(missionId);
          if (!result.ok || !result.data) {
            toast.error("No se pudo exportar", { description: result.ok ? undefined : result.error });
            return;
          }
          const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `${slug}.json`;
          link.click();
          URL.revokeObjectURL(url);
          toast.success("Misión exportada", { description: `${slug}.json` });
        })
      }
    >
      {pending ? <Loader2 className="animate-spin" /> : <Download />}
      Exportar JSON
    </Button>
  );
}

const ACTION_TEXT: Record<string, { label: string; tone: "grey" | "purple" | "green" | "red" | "amber" }> = {
  UNCHANGED: { label: "Sin cambios", tone: "grey" },
  UPDATE: { label: "Se actualiza", tone: "purple" },
  CREATE: { label: "Se crea", tone: "green" },
  DELETE: { label: "Se borra", tone: "red" },
  REPLACE: { label: "Se reemplaza", tone: "amber" },
};

const FILE_TEXT: Record<string, string> = {
  FOUND: "ya existe en este entorno",
  DOWNLOAD: "se descargará del entorno de origen",
  MISSING: "no se encuentra",
};

/** Importa un JSON exportado (u otro `MissionData`) sobre esta misión: primero plan, después aplicar. */
export function ImportMissionDialog({ missionId }: { missionId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [plan, setPlan] = useState<MissionImportPlan | null>(null);
  const [translate, setTranslate] = useState(true);
  const [pending, start] = useTransition();

  function parse(): Record<string, unknown> | null {
    try {
      const value = JSON.parse(text);
      if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("no es un objeto");
      return value;
    } catch (error) {
      toast.error("JSON inválido", { description: (error as Error).message });
      return null;
    }
  }

  function analyze() {
    const payload = parse();
    if (!payload) return;
    start(async () => {
      const result = await importMissionAction({ missionId, payload, dryRun: true });
      if (result.ok && result.data) setPlan(result.data);
      else if (!result.ok) toast.error("No se pudo analizar el JSON", { description: result.error, duration: 10_000 });
    });
  }

  function apply() {
    const payload = parse();
    if (!payload) return;
    const translation: TranslationMode = translate ? "AUTO" : "SKIP";
    start(async () => {
      const result = await importMissionAction({ missionId, payload, dryRun: false, translation });
      if (result.ok) {
        toast.success("Misión importada", { description: "Puedes deshacerlo desde el historial." });
        for (const warning of result.data?.warnings ?? []) toast.warning(warning);
        setOpen(false);
        setPlan(null);
        setText("");
        router.refresh();
      } else {
        toast.error("No se pudo importar", { description: result.error, duration: 12_000 });
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setPlan(null);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload />
          Importar JSON
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar misión desde JSON</DialogTitle>
          <DialogDescription>
            Sobrescribe esta misión con un JSON exportado desde el panel (de este u otro entorno) o con un
            <code className="mx-1">MissionData</code>de un <code>data.ts</code>. Los steps del mismo tipo se
            actualizan en sitio; los que sobran solo se borran si nadie los respondió.
          </DialogDescription>
        </DialogHeader>

        {!plan ? (
          <div className="flex flex-col gap-3">
            <label className="flex cursor-pointer items-center gap-2 self-start rounded-lg border bg-card px-3 py-2 text-[12.5px] font-semibold hover:bg-muted">
              <FileUp className="size-4" />
              Elegir archivo .json
              <input
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (file) setText(await file.text());
                }}
              />
            </label>
            <Textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={10}
              placeholder="…o pega aquí el JSON"
              spellCheck={false}
              className="font-mono text-[11.5px]"
            />
          </div>
        ) : (
          <div className="flex max-h-[55vh] flex-col gap-3 overflow-auto">
            {plan.errors.length > 0 && (
              <div className="rounded-lg border border-destructive/20 bg-destructive-soft p-3 text-[12.5px] text-destructive">
                <p className="font-semibold">No se puede aplicar:</p>
                <ul className="mt-1 list-disc pl-4">
                  {plan.errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            {plan.warnings.length > 0 && (
              <div className="rounded-lg border border-warning/30 bg-warning-soft p-3 text-[12.5px] text-warning">
                <ul className="list-disc pl-4">
                  {plan.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-[12.5px]">
              <span className="font-semibold">Textos de la misión:</span>{" "}
              {plan.textsChanged ? "cambian" : "sin cambios"}
            </p>
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="py-1 font-semibold">#</th>
                  <th className="py-1 font-semibold">Actual</th>
                  <th className="py-1 font-semibold">JSON</th>
                  <th className="py-1 font-semibold">Acción</th>
                </tr>
              </thead>
              <tbody>
                {plan.steps.map((step) => (
                  <tr key={step.position} className="border-t align-top">
                    <td className="py-1.5 pr-2 font-semibold">{step.position}</td>
                    <td className="py-1.5 pr-2">
                      {step.currentStepType ? STEP_TYPE_META[step.currentStepType]?.label : "—"}
                      {step.responsesCount > 0 && (
                        <span className="ml-1 text-warning">({step.responsesCount} resp.)</span>
                      )}
                    </td>
                    <td className="py-1.5 pr-2">{step.stepType ? STEP_TYPE_META[step.stepType]?.label : "—"}</td>
                    <td className="py-1.5">
                      <StatusPill tone={ACTION_TEXT[step.action].tone}>{ACTION_TEXT[step.action].label}</StatusPill>
                      {step.blocked && <p className="mt-1 text-[11px] text-destructive">{step.blocked}</p>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {plan.files.length > 0 && (
              <div className="text-[12px]">
                <p className="font-semibold">Archivos</p>
                <ul className="mt-1 flex flex-col gap-0.5">
                  {plan.files.map((file) => (
                    <li key={file.ref} className="break-all">
                      <code className="text-[11px]">{file.ref}</code> — {FILE_TEXT[file.status]}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <SwitchField
              label="Traducir a inglés/italiano lo que el JSON no traiga"
              hint="Si el JSON ya incluye en/it (un export del panel), se usan tal cual."
              checked={translate}
              onChange={setTranslate}
            />
          </div>
        )}

        <DialogFooter>
          {plan ? (
            <>
              <Button variant="outline" onClick={() => setPlan(null)} disabled={pending}>
                Volver
              </Button>
              <Button onClick={apply} disabled={!plan.canApply || pending}>
                {pending && <Loader2 className="animate-spin" />}
                Aplicar importación
              </Button>
            </>
          ) : (
            <Button onClick={analyze} disabled={!text.trim() || pending}>
              {pending && <Loader2 className="animate-spin" />}
              Analizar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
