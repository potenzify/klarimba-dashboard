/** Formatea fechas del API (ISO string o unix seconds/millis) en es-CO. */
export function formatApiDate(
  value: string | number | null | undefined,
): string {
  if (value === null || value === undefined || value === "") return "—";
  let date: Date;
  if (typeof value === "number") {
    // unix seconds vs millis
    date = new Date(value < 10_000_000_000 ? value * 1000 : value);
  } else {
    date = new Date(value);
  }
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function fullName(user: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}): string {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return name || user.email || "—";
}
