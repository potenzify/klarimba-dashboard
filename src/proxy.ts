import { getIronSession } from "iron-session";
import { NextRequest, NextResponse } from "next/server";
import {
  decodeJwtExp,
  getSessionOptions,
  type SessionData,
} from "@/lib/session";

const API_URL = (
  process.env.KLARIMBA_API_URL ?? "http://localhost:8080/api/v1"
).replace(/\/$/, "");

/** Renueva el access token si expira en menos de 60 segundos. */
const REFRESH_WINDOW_MS = 60_000;

async function refreshTokens(refreshAccessToken: string) {
  const response = await fetch(`${API_URL}/auth/refresh-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Contrato del API (RefreshTokenGuard): header `x-refresh-token`.
      "x-refresh-token": refreshAccessToken,
    },
    cache: "no-store",
  });
  if (!response.ok) return null;
  const json = (await response.json()) as {
    data?: { accessToken?: string; refreshAccessToken?: string };
  };
  const tokens = json.data;
  if (!tokens?.accessToken || !tokens.refreshAccessToken) return null;
  return tokens as { accessToken: string; refreshAccessToken: string };
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(
    request,
    response,
    getSessionOptions(),
  );

  const isLoginPage = pathname === "/login";
  const isAuthenticated = Boolean(session.accessToken);

  if (isLoginPage) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return response;
  }

  if (!isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Refresh proactivo: si el access token está por expirar, lo renovamos aquí
  // (el middleware es el único lugar donde podemos reescribir la cookie en
  // cada request; los Server Components no pueden persistirla).
  const exp = decodeJwtExp(session.accessToken!);
  const aboutToExpire =
    exp !== null && exp * 1000 - Date.now() < REFRESH_WINDOW_MS;

  if (aboutToExpire && session.refreshAccessToken) {
    const tokens = await refreshTokens(session.refreshAccessToken).catch(
      () => null,
    );
    if (tokens) {
      session.accessToken = tokens.accessToken;
      session.refreshAccessToken = tokens.refreshAccessToken;
      await session.save();
      return response;
    }
    // Refresh fallido → sesión inválida, de vuelta al login.
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("expired", "1");
    const redirect = NextResponse.redirect(loginUrl);
    redirect.cookies.delete(getSessionOptions().cookieName);
    return redirect;
  }

  return response;
}

export const config = {
  matcher: [
    // Todo excepto estáticos de Next y assets públicos.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
