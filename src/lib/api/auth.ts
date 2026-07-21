import "server-only";
import { apiFetch } from "@/lib/api/http";
import {
  authMeSchema,
  authTokensSchema,
  type AuthMe,
  type AuthTokens,
  type LoginInput,
} from "@/lib/api/schemas";

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

export async function getAuthMe(): Promise<AuthMe> {
  return apiFetch("/auth/me", { schema: authMeSchema });
}
