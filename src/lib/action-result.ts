import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api/http";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

/**
 * Traduce el fallo de una server action a `ActionResult`.
 *
 * Un 401 significa que la sesión murió a mitad de la acción (token expirado o
 * en la blacklist tras un logout): devolver el mensaje crudo dejaría al usuario
 * reintentando contra una sesión muerta, así que se le manda a login. `redirect`
 * lanza `NEXT_REDIRECT`, por eso esta función debe invocarse desde el `catch`
 * —nunca dentro del `try`, que se lo tragaría.
 */
export function toActionError(error: unknown): ActionResult<never> {
  if (error instanceof ApiError) {
    if (error.isUnauthorized) redirect("/login?expired=1");
    return { ok: false, error: error.message };
  }
  throw error;
}

/** `true` si el fallo es un 401 del API (sesión muerta). */
export function isSessionExpired(error: unknown): boolean {
  return error instanceof ApiError && error.isUnauthorized;
}
