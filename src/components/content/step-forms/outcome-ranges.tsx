"use client";

import { ListEditor, NumberField, SelectField, TextField, nextId } from "../fields";
import { POLARITY_OPTIONS } from "@/lib/content/step-types";

export type OutcomeRange = {
  id?: string;
  min: number;
  max: number;
  polarity: string;
  badge: string;
  headline: string;
  message: string;
  suggestedAction: string;
};

/**
 * Tramos de resultado por puntaje (F3 `outcomes`, F5 `outcomeRanges`). Con
 * `fixedBands` los tramos son los del formato (manual técnico) y el rango no se
 * edita: la guarda de puntaje exige que coincidan con las bandas.
 */
export function OutcomeRangesEditor({
  items,
  onChange,
  withIds,
  fixedBands,
}: {
  items: OutcomeRange[];
  onChange: (items: OutcomeRange[]) => void;
  withIds?: boolean;
  fixedBands?: boolean;
}) {
  return (
    <ListEditor<OutcomeRange>
      items={items}
      onChange={onChange}
      fixed={fixedBands}
      minItems={1}
      addLabel="Añadir tramo"
      itemLabel={(i) => {
        const r = items[i];
        return `Tramo ${i + 1} · ${r?.min ?? "?"} a ${r?.max ?? "?"} puntos`;
      }}
      createItem={(current) => ({
        ...(withIds ? { id: nextId("r", current) } : {}),
        min: 0,
        max: 0,
        polarity: "neutral",
        badge: "",
        headline: "",
        message: "",
        suggestedAction: "",
      })}
      renderItem={(range, _i, update) => (
        <div className="grid gap-3 sm:grid-cols-3">
          <NumberField
            label="Desde"
            value={range.min}
            readOnly={fixedBands}
            onChange={(min) => update({ ...range, min: min ?? 0 })}
          />
          <NumberField
            label="Hasta"
            value={range.max}
            readOnly={fixedBands}
            onChange={(max) => update({ ...range, max: max ?? 0 })}
          />
          <SelectField
            label="Polaridad"
            value={range.polarity}
            options={POLARITY_OPTIONS}
            onChange={(polarity) => update({ ...range, polarity: polarity ?? "neutral" })}
          />
          <TextField
            label="Etiqueta"
            value={range.badge}
            onChange={(badge) => update({ ...range, badge })}
            className="sm:col-span-3"
          />
          <TextField
            label="Titular"
            value={range.headline}
            onChange={(headline) => update({ ...range, headline })}
            className="sm:col-span-3"
          />
          <TextField
            label="Mensaje"
            multiline
            rows={3}
            value={range.message}
            onChange={(message) => update({ ...range, message })}
            className="sm:col-span-3"
          />
          <TextField
            label="Acción sugerida"
            multiline
            value={range.suggestedAction}
            onChange={(suggestedAction) => update({ ...range, suggestedAction })}
            className="sm:col-span-3"
          />
        </div>
      )}
    />
  );
}
