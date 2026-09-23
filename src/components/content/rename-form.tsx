"use client";

import { Languages, Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { renameContentAction } from "@/app/(dashboard)/admin/content/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LOCALE_LABELS } from "@/lib/content/step-types";
import { saveWithTranslation } from "./translation-feedback";

interface RenameFormProps {
  owner: "worlds" | "maps";
  id: string;
  version: string;
  translations: Record<string, { name: string }>;
}

/** Nombre en español de un mundo o mapa; en/it se retraducen al guardar. */
export function RenameForm({ owner, id, version, translations }: RenameFormProps) {
  const router = useRouter();
  const initial = translations.es?.name ?? "";
  const [name, setName] = useState(initial);
  const [pending, start] = useTransition();
  const dirty = name.trim() !== initial;

  function save() {
    start(async () => {
      await saveWithTranslation(
        (translation) => renameContentAction({ owner, id, name, version, translation }),
        { success: "Nombre guardado", onSaved: () => router.refresh() },
      );
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-64 flex-1 flex-col gap-1.5">
          <Label htmlFor={`${id}-name`} className="text-[12.5px] font-semibold">
            Nombre (español)
          </Label>
          <Input
            id={`${id}-name`}
            value={name}
            maxLength={100}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <Button onClick={save} disabled={!dirty || pending || !name.trim()}>
          {pending ? <Loader2 className="animate-spin" /> : <Save />}
          Guardar
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
        <Languages className="size-3.5" />
        {Object.entries(translations)
          .filter(([locale]) => locale !== "es")
          .map(([locale, value]) => (
            <span key={locale}>
              <span className="font-semibold">{LOCALE_LABELS[locale] ?? locale}:</span> {value.name}
            </span>
          ))}
        <span className="italic">Se retraducen al guardar.</span>
      </div>
    </div>
  );
}
