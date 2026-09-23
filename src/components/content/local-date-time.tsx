"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => undefined;

/**
 * Fecha y hora en la zona horaria del navegador. En el render del servidor
 * (cuya zona puede ser UTC) solo muestra la fecha, y al hidratar pasa a fecha
 * + hora local: así servidor y cliente no discrepan.
 */
export function LocalDateTime({ value, prefix }: { value: string | null; prefix?: string }) {
  const isClient = useSyncExternalStore(subscribe, () => true, () => false);
  if (!value) return <>—</>;
  const date = new Date(value);
  const text = isClient
    ? date.toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })
    : date.toLocaleDateString("es-CO", { dateStyle: "medium", timeZone: "UTC" });
  return (
    <time dateTime={value}>
      {prefix}
      {text}
    </time>
  );
}
