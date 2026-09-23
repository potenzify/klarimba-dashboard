"use client";

import { toast } from "sonner";
import type { ActionResult } from "@/lib/action-result";
import type {
  ContentMutation,
  LocaleTranslationReport,
  TranslationMode,
} from "@/lib/api/content-schemas";

const LOCALE_SHORT: Record<string, string> = { en: "EN", it: "IT" };

/** Resumen legible de lo que pasó con en/it al guardar. */
export function describeTranslation(report: LocaleTranslationReport[]): string {
  if (report.length === 0) return "";
  return report
    .map((r) => {
      const locale = LOCALE_SHORT[r.locale] ?? r.locale.toUpperCase();
      switch (r.status) {
        case "TRANSLATED":
          return `${locale}: ${r.translated} texto(s) traducido(s)`;
        case "UNCHANGED":
          return `${locale}: sin cambios`;
        case "COPIED":
          return `${locale}: ${r.copied} texto(s) quedaron en español`;
        case "NOT_CREATED":
          return `${locale}: no existe (la app usa el español)`;
      }
    })
    .join(" · ");
}

interface SaveOptions {
  /** Mensaje del toast de éxito. */
  success: string;
  onSaved?: (mutation: ContentMutation) => void;
}

/**
 * Guarda con retraducción automática; si Google falla (502 `Translation
 * Failed`), ofrece reintentar o guardar sin traducir (modo SKIP).
 */
export async function saveWithTranslation(
  run: (translation: TranslationMode) => Promise<ActionResult<ContentMutation>>,
  { success, onSaved }: SaveOptions,
  translation: TranslationMode = "AUTO",
): Promise<boolean> {
  const result = await run(translation);
  if (result.ok && result.data) {
    const detail = describeTranslation(result.data.translation);
    toast.success(success, { description: detail || undefined });
    for (const warning of result.data.warnings) {
      toast.warning("Revisa esto", { description: warning, duration: 10_000 });
    }
    onSaved?.(result.data);
    return true;
  }
  if (!result.ok && result.code === "Translation Failed") {
    toast.error("No se pudo traducir a inglés/italiano", {
      description: `${result.error}`,
      duration: 15_000,
      action: {
        label: "Guardar sin traducir",
        onClick: () => void saveWithTranslation(run, { success, onSaved }, "SKIP"),
      },
    });
    return false;
  }
  if (!result.ok) {
    toast.error("No se guardó", { description: result.error, duration: 10_000 });
  }
  return false;
}
