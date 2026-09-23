"use client";

import { TriangleAlert } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { ContentFile, ContentMission, ContentRevision } from "@/lib/api/content-schemas";
import { MissionTextsForm } from "./mission-texts-form";
import { RevisionHistory } from "./revision-history";
import { StepEditor, type StepDraft } from "./step-editor";
import { StepList } from "./step-list";

type Tab = "steps" | "texts" | "history";
const TABS: Tab[] = ["steps", "texts", "history"];

interface MissionEditorProps {
  mission: ContentMission;
  revisions: { items: ContentRevision[]; total: number | null };
}

/** Editor de una misión: steps (lista + editor), textos y historial. */
export function MissionEditor({ mission, revisions }: MissionEditorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab") as Tab | null;
  const tab: Tab = tabParam && TABS.includes(tabParam) ? tabParam : "steps";
  const stepParam = searchParams.get("step");
  const [draft, setDraft] = useState<StepDraft | null>(null);
  const [dirty, setDirty] = useState(false);
  const [uploaded, setUploaded] = useState<Record<string, ContentFile>>({});

  const files = useMemo(() => ({ ...mission.files, ...uploaded }), [mission.files, uploaded]);
  const selectedStep =
    mission.steps.find((s) => s.id === stepParam) ?? (draft ? null : mission.steps[0] ?? null);

  const setParams = useCallback(
    (changes: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(changes)) {
        if (value === null) params.delete(key);
        else params.set(key, value);
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const confirmLeave = () =>
    !dirty || window.confirm("Hay cambios sin guardar en este step. ¿Descartarlos?");

  function selectStep(stepId: string) {
    if (stepId === selectedStep?.id && !draft) return;
    if (!confirmLeave()) return;
    setDraft(null);
    setDirty(false);
    setParams({ step: stepId });
  }

  // Aviso del navegador al cerrar/recargar con cambios sin guardar.
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const registerFile = useCallback(
    (file: ContentFile) => setUploaded((current) => ({ ...current, [file.id]: file })),
    [],
  );
  const onDirtyChange = useCallback((value: boolean) => setDirty(value), []);

  return (
    <TooltipProvider>
      <Tabs value={tab} onValueChange={(value) => setParams({ tab: value === "steps" ? null : value })}>
        <TabsList className="mb-4">
          <TabsTrigger value="steps">Steps ({mission.steps.length})</TabsTrigger>
          <TabsTrigger value="texts">Textos y celebración</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="steps" className="flex flex-col gap-4">
          {mission.scoring && !mission.scoring.ok && (
            <div className="flex gap-2.5 rounded-xl border border-warning/30 bg-warning-soft p-3 text-[12.5px] text-warning">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="font-semibold">
                  El puntaje de esta misión no cuadra con las bandas de {mission.scoring.formatCode}:
                </p>
                <ul className="mt-1 list-disc pl-4">
                  {mission.scoring.issues.map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          <div className="grid items-start gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div className="lg:sticky lg:top-4">
              <StepList
                missionId={mission.id}
                steps={mission.steps}
                selectedId={draft ? null : (selectedStep?.id ?? null)}
                draft={draft}
                allowedStepTypes={mission.format.allowedStepTypes}
                onSelect={selectStep}
                onSelectDraft={() => undefined}
                onAddDraft={(next) => {
                  if (!confirmLeave()) return;
                  setDirty(false);
                  setDraft(next);
                }}
              />
            </div>
            <div className="min-w-0">
              {draft ? (
                <StepEditor
                  key={`draft-${draft.stepType}-${draft.position}`}
                  mission={mission}
                  step={null}
                  draft={draft}
                  files={files}
                  registerFile={registerFile}
                  onDirtyChange={onDirtyChange}
                  onCreated={(stepId) => {
                    setDraft(null);
                    setParams({ step: stepId });
                  }}
                  onCancelDraft={() => setDraft(null)}
                  onDeleted={() => undefined}
                />
              ) : selectedStep ? (
                <StepEditor
                  key={`${selectedStep.id}-${selectedStep.version}`}
                  mission={mission}
                  step={selectedStep}
                  files={files}
                  registerFile={registerFile}
                  onDirtyChange={onDirtyChange}
                  onCreated={() => undefined}
                  onCancelDraft={() => undefined}
                  onDeleted={() => {
                    setDirty(false);
                    setParams({ step: null });
                  }}
                />
              ) : (
                <p className="rounded-xl border border-dashed bg-card p-8 text-center text-[12.5px] text-muted-foreground">
                  Esta misión no tiene steps. Añade uno desde la lista.
                </p>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="texts">
          <MissionTextsForm key={mission.texts.version} mission={mission} />
        </TabsContent>

        <TabsContent value="history">
          <RevisionHistory
            key={`${revisions.items[0]?.id ?? "empty"}-${revisions.total}`}
            initial={revisions.items}
            total={revisions.total}
            filters={{ missionId: mission.id }}
          />
        </TabsContent>
      </Tabs>
    </TooltipProvider>
  );
}
