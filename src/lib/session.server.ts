import "server-only";
import { getIronSession, type IronSession } from "iron-session";
import { cookies } from "next/headers";
import { getSessionOptions, type SessionData } from "@/lib/session";

/**
 * Sesión iron-session sobre `cookies()`. Solo lectura en Server Components;
 * `session.save()`/`destroy()` únicamente en Server Actions o Route Handlers.
 */
export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), getSessionOptions());
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return Boolean(session.accessToken);
}
