"use server";

import { redirect } from "next/navigation";
import { logoutApi } from "@/lib/api/auth";
import { getSession } from "@/lib/session.server";

export async function logoutAction(): Promise<void> {
  const session = await getSession();
  if (session.accessToken && session.refreshAccessToken) {
    // Pone los tokens en la blacklist del API; si falla, igual cerramos local.
    await logoutApi(session.accessToken, session.refreshAccessToken);
  }
  session.destroy();
  redirect("/login");
}
