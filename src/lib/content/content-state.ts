/** Utilidades inmutables para editar contenido JSON por ruta (client-safe). */

export type Path = Array<string | number>;

export function getIn(value: unknown, path: Path): unknown {
  let node = value;
  for (const key of path) {
    if (node === null || typeof node !== "object") return undefined;
    node = (node as Record<string | number, unknown>)[key];
  }
  return node;
}

/** Copia `root` cambiando solo el valor en `path` (crea objetos intermedios si faltan). */
export function setIn<T>(root: T, path: Path, value: unknown): T {
  if (path.length === 0) return value as T;
  const [key, ...rest] = path;
  const current = (root ?? (typeof key === "number" ? [] : {})) as Record<string | number, unknown>;
  const copy = (Array.isArray(current) ? [...current] : { ...current }) as Record<string | number, unknown>;
  copy[key] = setIn(current[key], rest, value);
  if (value === undefined && rest.length === 0 && !Array.isArray(copy)) delete copy[key];
  return copy as T;
}

/** Igualdad por contenido (para saber si hay cambios sin guardar). */
export function sameContent(a: unknown, b: unknown): boolean {
  return JSON.stringify(normalize(a)) === JSON.stringify(normalize(b));
}

function normalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value as object)
        .filter((key) => (value as Record<string, unknown>)[key] !== undefined)
        .sort()
        .map((key) => [key, normalize((value as Record<string, unknown>)[key])]),
    );
  }
  return value;
}

/** Claves que no son texto visible (ids, códigos, referencias a archivos). */
const NON_TEXT_KEYS = new Set(["id", "mediaId", "coverImgId", "pumpyName", "polarity", "accept"]);

/** Textos (hojas string) de un contenido, con su ruta legible: para la vista de en/it. */
export function textLeaves(value: unknown, prefix = ""): Array<{ path: string; text: string }> {
  if (typeof value === "string") return value.trim() ? [{ path: prefix, text: value }] : [];
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => textLeaves(item, `${prefix}[${index + 1}]`));
  }
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !NON_TEXT_KEYS.has(key))
      .flatMap(([key, item]) => textLeaves(item, prefix ? `${prefix}.${key}` : key));
  }
  return [];
}
