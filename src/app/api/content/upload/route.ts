import { env } from "@/lib/env";
import { refreshTokenApi } from "@/lib/api/auth";
import { decodeJwtExp } from "@/lib/session";
import { getSession } from "@/lib/session.server";

/** Renovamos el access token si expira en menos de 60 s (mismo margen que `proxy.ts`). */
const REFRESH_WINDOW_MS = 60_000;

function jsonError(status: number, message: string) {
  return Response.json({ message, error: "Upload Error" }, { status });
}

/**
 * Subida de imágenes y videos del panel de contenido → `POST
 * /backoffice/content/files` del API, reenviando el multipart en streaming.
 *
 * Está fuera del matcher de `proxy.ts` a propósito: con proxy activo Next
 * guarda el body en memoria y lo trunca a 10 MB, y un video mindful pesa más.
 * Por eso aquí se valida la sesión (y se renueva el token) a mano. El JWT no
 * sale nunca al navegador: se añade en el servidor, como en `apiFetch`.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session.accessToken) return jsonError(401, "No hay sesión activa");

  const exp = decodeJwtExp(session.accessToken);
  if (exp !== null && exp * 1000 - Date.now() < REFRESH_WINDOW_MS && session.refreshAccessToken) {
    try {
      const tokens = await refreshTokenApi(session.refreshAccessToken);
      session.accessToken = tokens.accessToken;
      session.refreshAccessToken = tokens.refreshAccessToken;
      await session.save();
    } catch {
      return jsonError(401, "La sesión expiró. Vuelve a iniciar sesión.");
    }
  }

  const contentType = request.headers.get("content-type");
  if (!contentType?.startsWith("multipart/form-data") || !request.body) {
    return jsonError(400, "Se esperaba un formulario multipart con el campo `file`");
  }

  let response: Response;
  try {
    response = await fetch(`${env.KLARIMBA_API_URL.replace(/\/$/, "")}/backoffice/content/files`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": contentType,
      },
      body: request.body,
      // Necesario en Node para enviar un ReadableStream como body.
      duplex: "half",
      cache: "no-store",
    } as RequestInit & { duplex: "half" });
  } catch {
    return jsonError(503, "No se pudo conectar con el API de Klarimba. ¿Está corriendo?");
  }

  return new Response(response.body, {
    status: response.status,
    headers: { "Content-Type": response.headers.get("content-type") ?? "application/json" },
  });
}
