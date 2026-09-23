"use client";

import { Languages } from "lucide-react";
import type { StepContent } from "@/lib/api/content-schemas";
import { textLeaves } from "@/lib/content/content-state";
import { LOCALE_LABELS } from "@/lib/content/step-types";

/** Vista de solo lectura de los textos en/it (se regeneran desde el español al guardar). */
export function TranslationsPreview({
  translations,
  locales,
}: {
  translations: Record<string, StepContent | undefined>;
  locales: string[];
}) {
  const others = locales.filter((locale) => locale !== "es");
  return (
    <details className="group rounded-xl border bg-card">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-[12.5px] font-semibold select-none">
        <Languages className="size-4 text-muted-foreground" />
        Ver inglés e italiano
        <span className="font-normal text-muted-foreground">
          · solo lectura: se retraducen desde el español al guardar
        </span>
      </summary>
      <div className="grid gap-4 border-t px-4 py-3 md:grid-cols-2">
        {others.map((locale) => {
          const leaves = textLeaves(translations[locale]);
          return (
            <div key={locale} className="min-w-0">
              <h4 className="mb-2 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                {LOCALE_LABELS[locale] ?? locale}
              </h4>
              {translations[locale] === undefined ? (
                <p className="text-[12px] text-muted-foreground italic">
                  Aún no existe: la app muestra el español. Se generará al guardar.
                </p>
              ) : leaves.length === 0 ? (
                <p className="text-[12px] text-muted-foreground italic">Sin textos.</p>
              ) : (
                <dl className="flex flex-col gap-1.5">
                  {leaves.map((leaf) => (
                    <div key={leaf.path} className="min-w-0">
                      <dt className="font-mono text-[10.5px] text-muted-foreground">{leaf.path}</dt>
                      <dd className="text-[12.5px] leading-snug break-words">{leaf.text}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          );
        })}
      </div>
    </details>
  );
}
