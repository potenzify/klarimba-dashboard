/** Helpers para `<input type="date">`, que trabaja con `YYYY-MM-DD` en hora local. */

/** Fin del día local de la fecha elegida, en ISO, para un `expiresAt`. */
export function endOfDayIso(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day, 23, 59, 59, 999).toISOString();
}

/** Hoy en formato `YYYY-MM-DD`, para el `min` del input. */
export function todayInputValue(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
