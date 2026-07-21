"use server";

import { redirect } from "next/navigation";
import { loginApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/http";
import { loginInputSchema, type LoginInput } from "@/lib/api/schemas";
import { getSession } from "@/lib/session.server";

export interface LoginActionResult {
  error: string;
}

export async function loginAction(
  input: LoginInput,
  next?: string,
): Promise<LoginActionResult | void> {
  const parsed = loginInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Revisa el correo y la contraseña" };
  }

  let tokens;
  try {
    tokens = await loginApi(parsed.data);
  } catch (error) {
    if (error instanceof ApiError) {
      return {
        error:
          error.status === 401 || error.status === 400
            ? "Credenciales incorrectas"
            : error.message,
      };
    }
    throw error;
  }

  const session = await getSession();
  session.accessToken = tokens.accessToken;
  session.refreshAccessToken = tokens.refreshAccessToken;
  await session.save();

  // Solo rutas internas para evitar open redirects.
  const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  redirect(target);
}
