import type { SessionOptions } from "iron-session";

/**
 * Opciones de la cookie de sesión. Este módulo no importa `server-only`
 * porque también se usa desde `proxy.ts` (middleware).
 */
export interface SessionData {
  accessToken?: string;
  refreshAccessToken?: string;
}

export function getSessionOptions(): SessionOptions {
  const password = process.env.SESSION_SECRET;
  if (!password || password.length < 32) {
    throw new Error(
      "SESSION_SECRET no está definido o tiene menos de 32 caracteres",
    );
  }
  return {
    cookieName: "klarimba_session",
    password,
    ttl: 60 * 60 * 24 * 14, // 14 días
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    },
  };
}

/** Decodifica el `exp` (unix seconds) de un JWT sin verificar la firma. */
export function decodeJwtExp(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { exp?: number };
    return typeof decoded.exp === "number" ? decoded.exp : null;
  } catch {
    return null;
  }
}
