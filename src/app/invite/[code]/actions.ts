"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { loginApi, logoutApi, registerApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/http";
import { previewInvitation, redeemInvitation } from "@/lib/api/organizations";
import {
  activateAccountInputSchema,
  type ActivateAccountInput,
} from "@/lib/api/schemas";
import { toActionError, type ActionResult } from "@/lib/action-result";
import { getSession, saveSessionTokens } from "@/lib/session.server";
import { EMAIL_TAKEN } from "./invite-errors";

const NOT_REDEEMABLE =
  "Esta invitación ya no está disponible (se usó, se revocó o venció). Pide una nueva a quien te invitó.";

/** Mensajes en español para los errores de dominio que el API devuelve aquí. */
const INVITATION_ERRORS: Record<string, string> = {
  "Invitation Not Redeemable": NOT_REDEEMABLE,
  "Invitation Identifier Mismatch":
    "Esta invitación es para otro correo. Entra con el correo al que te llegó.",
  "Profile Data Required": "Indica tu fecha de nacimiento y tu género.",
  "Consent Required": "Debes aceptar los términos y la política de privacidad.",
  "Insufficient Seats":
    "La organización no tiene accesos disponibles. Avisa a quien te invitó.",
};

function invitationError(error: unknown): ActionResult | null {
  if (!(error instanceof ApiError)) return null;
  if (error.status === 429) {
    return {
      ok: false,
      error: "Demasiados intentos seguidos. Espera un minuto y vuelve a probar.",
    };
  }
  if (error.code && INVITATION_ERRORS[error.code]) {
    return { ok: false, error: INVITATION_ERRORS[error.code], code: error.code };
  }
  return null;
}

/**
 * Crea la cuenta del invitado (registro + canje atómicos en el API), abre la
 * sesión y lo lleva a su organización. El correo sale de la invitación, no del
 * formulario, cuando está atada a uno: el API exige que coincidan.
 */
export async function activateAccountAction(
  code: string,
  input: ActivateAccountInput,
): Promise<ActionResult> {
  let preview;
  try {
    preview = await previewInvitation(code);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { ok: false, error: "Esta invitación no existe." };
    }
    return invitationError(error) ?? toActionError(error);
  }
  if (!preview.isRedeemable) return { ok: false, error: NOT_REDEEMABLE };

  const boundEmail = preview.identifierType === "EMAIL" ? preview.identifier : null;
  const parsed = activateAccountInputSchema({
    needsEmail: !boundEmail,
    needsAppProfile: preview.grantsAppAccess !== false,
  }).safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { email: typedEmail, birthDate, gender, ...data } = parsed.data;
  const email = (boundEmail ?? typedEmail ?? "").toLowerCase();
  const sendsAppProfile = preview.grantsAppAccess !== false;

  try {
    await registerApi({
      ...data,
      email,
      invitationCode: code,
      ...(sendsAppProfile ? { birthDate, gender } : {}),
    });
  } catch (error) {
    if (
      error instanceof ApiError &&
      error.status === 409 &&
      error.message === "Email already registered"
    ) {
      return {
        ok: false,
        error: "Ya existe una cuenta con este correo. Inicia sesión para aceptar la invitación.",
        code: EMAIL_TAKEN,
      };
    }
    if (error instanceof ApiError && error.status === 422 && error.message.includes("birthDate")) {
      return { ok: false, error: "Revisa la fecha de nacimiento: debes ser mayor de 18 años." };
    }
    return invitationError(error) ?? toActionError(error);
  }

  try {
    await saveSessionTokens(await loginApi({ email, password: data.password }));
  } catch {
    // La cuenta ya existe: que entre por el login normal.
    redirect("/login");
  }
  redirect("/");
}

/** Acepta la invitación con la sesión abierta (cuenta ya existente). */
export async function acceptInvitationAction(code: string): Promise<ActionResult> {
  let organizationId: string | undefined;
  try {
    const membership = await redeemInvitation(code);
    organizationId = membership.organization?.id;
  } catch (error) {
    // Ya era miembro (p. ej. doble clic o invitación repetida): no es un fallo.
    if (!(error instanceof ApiError && error.code === "Already Member")) {
      return invitationError(error) ?? toActionError(error);
    }
  }
  revalidatePath("/", "layout");
  redirect(organizationId ? `/org/${organizationId}` : "/");
}

/** Cierra la sesión actual y vuelve a la invitación para activarla con otra cuenta. */
export async function switchAccountAction(code: string): Promise<void> {
  const session = await getSession();
  if (session.accessToken && session.refreshAccessToken) {
    await logoutApi(session.accessToken, session.refreshAccessToken);
  }
  session.destroy();
  redirect(`/invite/${encodeURIComponent(code)}`);
}
