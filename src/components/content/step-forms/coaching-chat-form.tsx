"use client";

import { NumberField, TextField } from "../fields";
import type { StepFormProps } from "./types";

/** COACHING_CHAT (F10): `CoachingChatContent`. */
export function CoachingChatForm({ content, set }: StepFormProps) {
  const orders: number[] = Array.isArray(content.sourceMissionOrders) ? content.sourceMissionOrders : [];
  return (
    <>
      <TextField
        label="Título"
        value={content.title}
        onChange={(v) => set(["title"], v || undefined)}
      />
      <TextField
        label="Texto bajo Kika"
        value={content.textBubble}
        onChange={(v) => set(["textBubble"], v || undefined)}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField
          label="Intercambios mínimos"
          value={content.minExchanges}
          min={1}
          onChange={(v) => set(["minExchanges"], v)}
        />
        <NumberField
          label="Intercambios máximos"
          value={content.maxExchanges}
          min={1}
          onChange={(v) => set(["maxExchanges"], v)}
          hint="En el último, Kika cierra la conversación."
        />
      </div>
      <TextField
        label="Misiones que alimentan el contexto de Kika (orders, separados por coma)"
        value={orders.join(", ")}
        onChange={(v) => {
          const parsed = v
            .split(",")
            .map((part) => Number(part.trim()))
            .filter((n) => Number.isInteger(n) && n >= 0);
          set(["sourceMissionOrders"], parsed.length ? parsed : undefined);
        }}
        hint="Vacío: se usan las F3, F5 y F4 completadas del mapa."
      />
    </>
  );
}
