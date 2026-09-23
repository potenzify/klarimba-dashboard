"use client";

import { Loader2, RotateCcw, Save, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateMissionTextsAction } from "@/app/(dashboard)/admin/content/actions";
import { Button } from "@/components/ui/button";
import type { ContentMission, MissionTexts } from "@/lib/api/content-schemas";
import { sameContent } from "@/lib/content/content-state";
import { LOCALE_LABELS } from "@/lib/content/step-types";
import { FormSection, TextField } from "./fields";
import { saveWithTranslation } from "./translation-feedback";

const BANDS = [
  { key: "low", label: "Resultado bajo" },
  { key: "medium", label: "Resultado medio" },
  { key: "high", label: "Resultado alto" },
] as const;

const EMPTY: MissionTexts = {
  name: "",
  loadingText: "",
  low: { mainText: "", subText: "" },
  medium: { mainText: "", subText: "" },
  high: { mainText: "", subText: "" },
};

/** Nombre, mood y pantallas celebratorias de la misión (`MissionTranslationData`). */
export function MissionTextsForm({ mission }: { mission: ContentMission }) {
  const router = useRouter();
  const initial = mission.texts.translations.es ?? EMPTY;
  const [texts, setTexts] = useState<MissionTexts>(initial);
  const [saving, start] = useTransition();
  const dirty = !sameContent(texts, initial);
  const catalog = mission.format.catalogCelebration;

  const setBand = (band: (typeof BANDS)[number]["key"], field: "mainText" | "subText", value: string) =>
    setTexts((current) => ({ ...current, [band]: { ...current[band], [field]: value } }));

  function save() {
    start(async () => {
      await saveWithTranslation(
        (translation) =>
          updateMissionTextsAction({
            missionId: mission.id,
            texts,
            version: mission.texts.version,
            translation,
          }),
        { success: "Textos de la misión guardados", onSaved: () => router.refresh() },
      );
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <FormSection title="Misión" description="Nombre (máx. 100 caracteres) y mood de la pantalla de carga.">
        <TextField
          label="Nombre"
          maxLength={100}
          value={texts.name}
          onChange={(name) => setTexts((t) => ({ ...t, name }))}
        />
        <TextField
          label="Mood (pantalla de carga)"
          value={texts.loadingText}
          onChange={(loadingText) => setTexts((t) => ({ ...t, loadingText }))}
          hint="F1 y F3 no tienen pantalla de carga (puede ir vacío). Los moods del catálogo se traducen con su versión cuidada."
        />
      </FormSection>

      <FormSection
        title="Pantalla celebratoria"
        description={
          mission.format.fixedCelebration
            ? `En ${mission.format.code} es fija por formato (catálogo CE_${mission.format.code}): los tres niveles llevan el mismo texto.`
            : "Varía según el resultado (bajo / medio / alto) de la misión."
        }
        actions={
          catalog && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setTexts((t) => ({
                  ...t,
                  low: { mainText: catalog.title, subText: catalog.description },
                  medium: { mainText: catalog.title, subText: catalog.description },
                  high: { mainText: catalog.title, subText: catalog.description },
                }))
              }
            >
              <Sparkles />
              Usar la del catálogo
            </Button>
          )
        }
      >
        <div className="grid gap-3 lg:grid-cols-3">
          {BANDS.map((band) => (
            <div key={band.key} className="flex flex-col gap-3 rounded-lg border bg-card p-3">
              <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                {band.label}
              </span>
              <TextField
                label="Título"
                value={texts[band.key].mainText}
                onChange={(v) => setBand(band.key, "mainText", v)}
              />
              <TextField
                label="Descripción"
                multiline
                rows={3}
                value={texts[band.key].subText}
                onChange={(v) => setBand(band.key, "subText", v)}
              />
            </div>
          ))}
        </div>
      </FormSection>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
          {Object.entries(mission.texts.translations)
            .filter(([locale]) => locale !== "es")
            .map(([locale, value]) => (
              <span key={locale}>
                <span className="font-semibold">{LOCALE_LABELS[locale] ?? locale}:</span> {value.name}
                {value.loadingText ? ` · «${value.loadingText}»` : ""}
              </span>
            ))}
          {Object.keys(mission.texts.translations).length === 1 && (
            <span className="italic">Sin inglés ni italiano todavía: se generan al guardar.</span>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={!dirty || saving} onClick={() => setTexts(initial)}>
            <RotateCcw />
            Descartar
          </Button>
          <Button size="sm" disabled={!dirty || saving || !texts.name.trim()} onClick={save}>
            {saving ? <Loader2 className="animate-spin" /> : <Save />}
            Guardar textos
          </Button>
        </div>
      </div>
    </div>
  );
}
