import "server-only";
import { z } from "zod";
import { apiFetch } from "@/lib/api/http";
import {
  authMeSchema,
  authTokensSchema,
  type AuthMe,
  type AuthTokens,
  type LoginInput,
} from "@/lib/api/schemas";

const messageSchema = z.object({ message: z.string() }).passthrough();

/**
 * El dashboard no tiene i18n: los correos que disparan los endpoints públicos
 * (sin usuario cuyas preferencias leer) y las preferencias de la cuenta nueva
 * van en español. `x-client-locale` es el que lee `POST /auth/register`.
 */
const SPANISH_HEADERS = { "Accept-Language": "es", "x-client-locale": "es" };

export async function loginApi(input: LoginInput): Promise<AuthTokens> {
  return apiFetch("/auth/login", {
    method: "POST",
    body: input,
    schema: authTokensSchema,
    auth: false,
  });
}

/**
 * Contrato del API (RefreshTokenGuard): el refresh token viaja en el header
 * `x-refresh-token`. Verificado en klarimba-api
 * (src/modules/auth/presentation/guards/refresh-token.guard.ts).
 */
export async function refreshTokenApi(
  refreshAccessToken: string,
): Promise<AuthTokens> {
  return apiFetch("/auth/refresh-token", {
    method: "POST",
    schema: authTokensSchema,
    auth: false,
    headers: {
      "x-refresh-token": refreshAccessToken,
    },
  });
}

/**
 * El logout exige ambos tokens: el access token por `Authorization: Bearer`
 * (TokenGuard + JWT) y el refresh por `x-refresh-token` (RefreshTokenGuard).
 */
export async function logoutApi(
  accessToken: string,
  refreshAccessToken: string,
): Promise<void> {
  try {
    await apiFetch("/auth/logout", {
      method: "POST",
      schema: authMeSchema.or(
        // El logout devuelve `{ message }`; aceptamos cualquier objeto.
        authTokensSchema.partial().passthrough(),
      ),
      auth: false,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "x-refresh-token": refreshAccessToken,
      },
    });
  } catch {
    // Si el API rechaza el logout (token ya expirado), igual destruimos la
    // sesión local; no hay nada más que hacer.
  }
}

export interface RegisterApiInput {
  email: string;
  password: string;
  passwordConfirmation: string;
  firstName: string;
  lastName: string;
  invitationCode: string;
  acceptTerms: boolean;
  /** Solo si la invitación da acceso a la app (el API los exige entonces). */
  birthDate?: string;
  gender?: "male" | "female" | "other";
}

/**
 * Crea la cuenta y canjea la invitación en la misma transacción: si el código
 * no es válido no queda cuenta. No devuelve tokens; hay que hacer login después.
 */
export async function registerApi(input: RegisterApiInput): Promise<void> {
  await apiFetch("/auth/register", {
    method: "POST",
    body: input,
    schema: messageSchema,
    auth: false,
    headers: SPANISH_HEADERS,
  });
}

/** Siempre responde OK, exista o no la cuenta (el API no revela qué correos hay). */
export async function forgotPasswordApi(email: string): Promise<void> {
  await apiFetch("/auth/forgot-password", {
    method: "POST",
    body: { email },
    schema: messageSchema,
    auth: false,
    headers: SPANISH_HEADERS,
  });
}

/** Código incorrecto o caducado → 403; a los 5 fallos el API invalida el código. */
export async function resetPasswordApi(input: {
  email: string;
  code: string;
  password: string;
  passwordConfirmation: string;
}): Promise<void> {
  await apiFetch("/auth/reset-password", {
    method: "POST",
    body: input,
    schema: messageSchema,
    auth: false,
    headers: SPANISH_HEADERS,
  });
}

export async function getAuthMe(): Promise<AuthMe> {
  return apiFetch("/auth/me", { schema: authMeSchema });
}
