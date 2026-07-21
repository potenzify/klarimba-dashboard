import "server-only";
import { z } from "zod";
import { env } from "@/lib/env";
import { getSession } from "@/lib/session.server";

/**
 * Error normalizado del API. Distingue:
 * - 422: validación de DTO (`message` es un array de {property, constraints})
 * - errores de dominio: `{ message, error, metadata }` (p. ej. Insufficient Seats)
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code?: string,
    readonly metadata?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiError";
  }

  get isUnauthorized() {
    return this.status === 401;
  }
  get isForbidden() {
    return this.status === 403;
  }
}

const envelopeSchema = z.object({
  data: z.unknown(),
  pagination: z.unknown().nullish(),
  metadata: z.unknown().nullish(),
});

type ValidationIssue = {
  property?: string;
  constraints?: Record<string, string>;
};

function extractErrorMessage(body: unknown): {
  message: string;
  code?: string;
  metadata?: Record<string, unknown>;
} {
  if (typeof body !== "object" || body === null) {
    return { message: "Error inesperado del API" };
  }
  const b = body as {
    message?: string | ValidationIssue[];
    error?: string;
    metadata?: Record<string, unknown>;
  };
  if (Array.isArray(b.message)) {
    const details = b.message
      .map((issue) =>
        issue.constraints
          ? `${issue.property}: ${Object.values(issue.constraints).join(", ")}`
          : issue.property,
      )
      .filter(Boolean)
      .join(" · ");
    return { message: details || "Datos inválidos", code: b.error };
  }
  return {
    message: b.message ?? b.error ?? "Error inesperado del API",
    code: b.error,
    metadata: b.metadata,
  };
}

export type QueryParams = Record<
  string,
  string | number | boolean | undefined | null
>;

interface ApiFetchOptions<T> {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: QueryParams;
  /** Schema zod aplicado sobre `envelope.data`. */
  schema: z.ZodType<T>;
  /** `false` para endpoints públicos (login, preview de invitación). */
  auth?: boolean;
  /** Headers extra (p. ej. Authorization manual en el flujo de refresh). */
  headers?: Record<string, string>;
}

function buildUrl(path: string, query?: QueryParams): string {
  const base = env.KLARIMBA_API_URL.replace(/\/$/, "");
  const url = new URL(`${base}${path.startsWith("/") ? path : `/${path}`}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

/**
 * Llama al API de Klarimba, desenvuelve `{ data }` y valida con zod.
 * Solo servidor: el token nunca llega al cliente.
 */
export async function apiFetch<T>(
  path: string,
  { method = "GET", body, query, schema, auth = true, headers }: ApiFetchOptions<T>,
): Promise<T> {
  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (auth && !requestHeaders.Authorization) {
    const session = await getSession();
    if (!session.accessToken) {
      throw new ApiError(401, "No hay sesión activa");
    }
    requestHeaders.Authorization = `Bearer ${session.accessToken}`;
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers: requestHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      503,
      "No se pudo conectar con el API de Klarimba. ¿Está corriendo?",
    );
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const { message, code, metadata } = extractErrorMessage(errorBody);
    throw new ApiError(response.status, message, code, metadata);
  }

  const json = await response.json().catch(() => null);
  const envelope = envelopeSchema.safeParse(json);
  const payload = envelope.success ? envelope.data.data : json;

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    console.error(`[api] Respuesta inesperada en ${method} ${path}`, {
      issues: parsed.error.issues,
    });
    throw new ApiError(
      500,
      "La respuesta del API no tiene la forma esperada",
      "SchemaMismatch",
    );
  }
  return parsed.data;
}
