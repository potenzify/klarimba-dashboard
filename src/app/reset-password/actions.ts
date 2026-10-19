"use server";

import { redirect } from "next/navigation";
import { forgotPasswordApi, resetPasswordApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/http";
import {
  forgotPasswordInputSchema,
  resetPasswordInputSchema,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from "@/lib/api/schemas";
import { toActionError, type ActionResult } from "@/lib/action-result";

const TOO_MANY_REQUESTS =
  "Demasiados intentos seguidos. Espera un minuto y vuelve a probar.";

/** Pide el código por correo. El API responde igual exista o no la cuenta. */
export async function requestPasswordResetAction(
  input: ForgotPasswordInput,
): Promise<ActionResult> {
  const parsed = forgotPasswordInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Correo inválido" };
  }
  try {
    await forgotPasswordApi(parsed.data.email.toLowerCase());
    return { ok: true };
  } catch (error) {
    if (error instanceof ApiError && error.status === 429) {
      return { ok: false, error: TOO_MANY_REQUESTS };
    }
    return toActionError(error);
  }
}

/** Cambia la contraseña con el código y manda al login con el aviso de éxito. */
export async function resetPasswordAction(
  input: ResetPasswordInput,
): Promise<ActionResult> {
  const parsed = resetPasswordInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  try {
    await resetPasswordApi({
      ...parsed.data,
      email: parsed.data.email.toLowerCase(),
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      return {
        ok: false,
        error:
          "El código es incorrecto o ya venció. Si fallaste varias veces, pide uno nuevo.",
      };
    }
    if (error instanceof ApiError && error.status === 429) {
      return { ok: false, error: TOO_MANY_REQUESTS };
    }
    return toActionError(error);
  }
  redirect("/login?reset=1");
}
