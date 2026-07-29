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

/** Límite por cookie que aplican los navegadores. */
const COOKIE_BYTE_LIMIT = 4096;

/**
 * La cookie sellada guarda access + refresh token. Si el API añade claims al
 * JWT puede acercarse al límite de 4 KB, y al pasarlo el navegador **descarta
 * la cookie en silencio**: el usuario aparece deslogueado sin ningún error.
 *
 * No podemos evitarlo desde aquí, pero sí hacerlo ruidoso. Si esto empieza a
 * salir en los logs, toca partir la sesión en dos cookies o guardar solo un
 * identificador y mover los tokens a un store de servidor.
 */
export function warnIfSessionCookieTooLarge(value: string | undefined): void {
  if (!value) return;
  const bytes = new TextEncoder().encode(value).length;
  if (bytes > COOKIE_BYTE_LIMIT * 0.8) {
    console.warn(
      `[session] La cookie de sesión ocupa ${bytes} B de los ${COOKIE_BYTE_LIMIT} B ` +
        "que admite el navegador. Al superarlos se descarta en silencio y la sesión se pierde.",
    );
  }
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
